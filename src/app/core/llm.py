"""LLM integration using Claude tool use (function calling) via OpenRouter.

Architecture: Instead of always forcing SQL generation, Claude decides whether
to query the database (tool call) or respond conversationally (no tool call).
This naturally handles greetings, acknowledgments, follow-up explanations,
and data queries without hardcoded intent classification.

References:
- Claude Tool Use: platform.claude.com/docs/en/agents-and-tools/tool-use
- OpenRouter Tool Calling: openrouter.ai/docs/guides/features/tool-calling
"""

from __future__ import annotations

import json
import logging
import re
import time
from dataclasses import dataclass, field

from openai import OpenAI
import pandas as pd

from app.core.config import Settings
from app.core.prompt import SYSTEM_PROMPT
from app.core.sql_validator import SQLValidationError, fuzzy_fix_columns, validate_sql
from app.core.database import execute_query, execute_query_postgres

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════
# Tool Definition
# ═══════════════════════════════════════════════════════

QUERY_TOOL = {
    "type": "function",
    "function": {
        "name": "query_database",
        "description": (
            "Execute a SQL query against the TelecomCo CRM database. "
            "Call this ONLY when the user asks for data, metrics, analysis, or visualization. "
            "Do NOT call for greetings, thanks, acknowledgments, or conversational messages."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "sql": {
                    "type": "string",
                    "description": "Valid PostgreSQL SELECT query. Double-quote column names with spaces.",
                },
                "chart_type": {
                    "type": "string",
                    "enum": ["bar", "line", "pie", "scatter", "heatmap", "table", "metric", "none"],
                    "description": "Visualization type for the results.",
                },
                "chart_config": {
                    "type": "object",
                    "description": "Chart configuration with x, y, title, color fields.",
                    "properties": {
                        "x": {"type": "string"},
                        "y": {"type": "string"},
                        "title": {"type": "string"},
                        "color": {"type": "string"},
                    },
                },
                "explanation": {
                    "type": "string",
                    "description": "Natural language explanation of the query and what results mean. Use markdown formatting.",
                },
            },
            "required": ["sql", "chart_type", "explanation"],
        },
    },
}

TOOLS = [QUERY_TOOL]


# ═══════════════════════════════════════════════════════
# Result Types
# ═══════════════════════════════════════════════════════

@dataclass
class QueryResult:
    """Result of processing a user message."""
    success: bool
    question: str
    sql: str = ""
    explanation: str = ""
    data: pd.DataFrame | None = None
    chart_type: str = "none"
    chart_config: dict = field(default_factory=dict)
    error: str = ""
    query_time_ms: float = 0
    rows_returned: int = 0


# ═══════════════════════════════════════════════════════
# Main Processing Function
# ═══════════════════════════════════════════════════════

def process_question(
    question: str,
    client: OpenAI,
    conn,  # DuckDB connection or None for PostgreSQL
    settings: Settings,
    conversation_history: list[dict] | None = None,
) -> QueryResult:
    """Process a user message using Claude tool use.

    Claude decides whether to:
    1. Call query_database tool -> execute SQL, return data + chart
    2. Respond conversationally -> return text only (greetings, thanks, explanations)

    On SQL error: feeds error back as tool result, Claude retries with correction.
    """
    start = time.time()
    use_postgres = settings.database_backend == "postgres"
    dialect = "postgres" if use_postgres else "duckdb"

    # Build messages with conversation history
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if conversation_history:
        messages.extend(conversation_history[-10:])
    messages.append({"role": "user", "content": question})

    try:
        response = client.chat.completions.create(
            model=settings.llm_model,
            max_tokens=1024,
            temperature=0,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
        )
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        return QueryResult(
            success=False,
            question=question,
            error=f"Could not reach the AI service. Please try again. ({e})",
        )

    choice = response.choices[0]

    # ── CASE 1: Conversational response (no tool call) ──
    # Handles: greetings, thanks, "why?", explanations, off-topic
    if choice.finish_reason == "stop" or not choice.message.tool_calls:
        elapsed = (time.time() - start) * 1000
        return QueryResult(
            success=True,
            question=question,
            explanation=choice.message.content or "",
            chart_type="none",
            query_time_ms=round(elapsed, 1),
        )

    # ── CASE 2: Tool call (query_database) ──
    tool_call = choice.message.tool_calls[0]
    try:
        args = json.loads(tool_call.function.arguments)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse tool arguments: {e}")
        return QueryResult(
            success=False,
            question=question,
            error="Failed to parse the AI response. Please try again.",
        )

    sql = args.get("sql", "")
    chart_type = args.get("chart_type", "table")
    chart_config = args.get("chart_config", {})
    explanation = args.get("explanation", "")

    # Execute with retry loop (using tool result error pattern)
    for attempt in range(settings.max_retries):
        try:
            # Validate and fix SQL
            fixed_sql = fuzzy_fix_columns(sql)
            fixed_sql = validate_sql(fixed_sql, dialect=dialect)

            # Execute
            if use_postgres:
                df = execute_query_postgres(fixed_sql)
            else:
                df = execute_query(conn, fixed_sql)

            elapsed = (time.time() - start) * 1000
            return QueryResult(
                success=True,
                question=question,
                sql=fixed_sql,
                explanation=explanation,
                data=df,
                chart_type=chart_type,
                chart_config=chart_config,
                query_time_ms=round(elapsed, 1),
                rows_returned=len(df),
            )

        except (SQLValidationError, Exception) as e:
            last_error = str(e)
            logger.warning(f"Query failed (attempt {attempt + 1}/{settings.max_retries}): {e}")

            if attempt < settings.max_retries - 1:
                # Retry: feed error back to Claude using tool result pattern
                retry_messages = messages.copy()

                # Add Claude's tool call
                retry_messages.append({
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [{
                        "id": tool_call.id,
                        "type": "function",
                        "function": {
                            "name": tool_call.function.name,
                            "arguments": tool_call.function.arguments,
                        },
                    }],
                })

                # Add error as tool result
                retry_messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": (
                        f"SQL execution failed: {last_error}\n"
                        f"Fix the query and try again. Remember:\n"
                        f"- Double-quote column names with spaces\n"
                        f"- Churn is BOOLEAN (true/false)\n"
                        f"- Use ROUND(expr::numeric, 2) for PostgreSQL\n"
                        f"- International/Voice mail plan are VARCHAR ('Yes'/'No')"
                    ),
                })

                try:
                    retry_response = client.chat.completions.create(
                        model=settings.llm_model,
                        max_tokens=1024,
                        temperature=0,
                        messages=retry_messages,
                        tools=TOOLS,
                        tool_choice="auto",
                    )

                    retry_choice = retry_response.choices[0]

                    # Claude might give up and respond conversationally
                    if retry_choice.finish_reason == "stop" or not retry_choice.message.tool_calls:
                        elapsed = (time.time() - start) * 1000
                        return QueryResult(
                            success=True,
                            question=question,
                            explanation=retry_choice.message.content or f"I could not generate a valid query. {last_error}",
                            chart_type="none",
                            query_time_ms=round(elapsed, 1),
                        )

                    # Claude retried with new SQL
                    new_tool_call = retry_choice.message.tool_calls[0]
                    new_args = json.loads(new_tool_call.function.arguments)
                    sql = new_args.get("sql", sql)
                    chart_type = new_args.get("chart_type", chart_type)
                    chart_config = new_args.get("chart_config", chart_config)
                    explanation = new_args.get("explanation", explanation)
                    tool_call = new_tool_call

                except Exception as retry_err:
                    logger.error(f"Retry LLM call failed: {retry_err}")
                    break

    # All retries exhausted
    elapsed = (time.time() - start) * 1000
    return QueryResult(
        success=False,
        question=question,
        sql=sql,
        explanation=f"I tried several approaches but could not generate a valid query.\n\n**Last error:** {last_error}\n\nTry rephrasing your question or breaking it into simpler steps.",
        chart_type="none",
        query_time_ms=round(elapsed, 1),
    )


# ═══════════════════════════════════════════════════════
# Legacy API (kept for Streamlit compatibility)
# ═══════════════════════════════════════════════════════

class LLMResponse:
    """Legacy response type for Streamlit app."""
    def __init__(self, sql: str, explanation: str, chart_type: str, chart_config: dict):
        self.sql = sql
        self.explanation = explanation
        self.chart_type = chart_type
        self.chart_config = chart_config


def create_client(settings: Settings) -> OpenAI:
    """Create an OpenAI-compatible client for OpenRouter."""
    if not settings.openrouter_api_key:
        raise ValueError("OPENROUTER_API_KEY not set.")
    return OpenAI(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
    )


def generate_sql(client, question, model=None, conversation_history=None):
    """Legacy function for Streamlit. Use process_question instead."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if conversation_history:
        messages.extend(conversation_history[-6:])
    messages.append({"role": "user", "content": question})

    response = client.chat.completions.create(
        model=model or "anthropic/claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=messages,
        temperature=0,
    )
    return _parse_response(response.choices[0].message.content)


def generate_sql_with_retry(client, question, error_message, failed_sql, model=None):
    """Legacy retry for Streamlit."""
    from app.core.prompt import RETRY_PROMPT
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": question},
        {"role": "assistant", "content": f'{{"sql": "{failed_sql}"}}'},
        {"role": "user", "content": RETRY_PROMPT.format(error=error_message, failed_sql=failed_sql)},
    ]
    response = client.chat.completions.create(
        model=model or "anthropic/claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=messages,
        temperature=0,
    )
    return _parse_response(response.choices[0].message.content)


def _parse_response(raw_text: str) -> LLMResponse:
    """Parse legacy JSON response."""
    text = raw_text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        json_match = re.search(r"\{[\s\S]*\}", text)
        if json_match:
            try:
                data = json.loads(json_match.group())
            except json.JSONDecodeError:
                return LLMResponse(sql="SELECT 1", explanation=text, chart_type="none", chart_config={})
        else:
            return LLMResponse(sql="SELECT 1", explanation=text, chart_type="none", chart_config={})

    return LLMResponse(
        sql=data.get("sql", "").strip(),
        explanation=data.get("explanation", ""),
        chart_type=data.get("chart_type", "table"),
        chart_config=data.get("chart_config", {}),
    )
