"""LLM integration for text-to-SQL conversion using OpenRouter (OpenAI-compatible)."""

from __future__ import annotations

import json
import logging
import re

from openai import OpenAI

from app.core.config import Settings
from app.core.prompt import RETRY_PROMPT, SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class LLMResponse:
    """Parsed LLM response with SQL, explanation, and chart config."""

    def __init__(self, sql: str, explanation: str, chart_type: str, chart_config: dict):
        self.sql = sql
        self.explanation = explanation
        self.chart_type = chart_type
        self.chart_config = chart_config

    def __repr__(self) -> str:
        return f"LLMResponse(sql='{self.sql[:50]}...', chart_type='{self.chart_type}')"


def create_client(settings: Settings) -> OpenAI:
    """Create an OpenAI-compatible client for OpenRouter."""
    if not settings.openrouter_api_key:
        raise ValueError(
            "OPENROUTER_API_KEY not set. Please set it in your .env file or environment."
        )
    return OpenAI(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
    )


def generate_sql(
    client: OpenAI,
    question: str,
    model: str = "anthropic/claude-sonnet-4-20250514",
    conversation_history: list[dict] | None = None,
) -> LLMResponse:
    """Generate SQL from a natural language question."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add conversation history for context (last 6 messages max)
    if conversation_history:
        for msg in conversation_history[-6:]:
            messages.append(msg)

    messages.append({"role": "user", "content": question})

    response = client.chat.completions.create(
        model=model,
        max_tokens=1024,
        messages=messages,
        temperature=0,
    )

    raw_text = response.choices[0].message.content
    return _parse_response(raw_text)


def generate_sql_with_retry(
    client: OpenAI,
    question: str,
    error_message: str,
    failed_sql: str,
    model: str = "anthropic/claude-sonnet-4-20250514",
) -> LLMResponse:
    """Retry SQL generation with error feedback."""
    retry_content = RETRY_PROMPT.format(error=error_message, failed_sql=failed_sql)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": question},
        {"role": "assistant", "content": f'{{"sql": "{failed_sql}"}}'},
        {"role": "user", "content": retry_content},
    ]

    response = client.chat.completions.create(
        model=model,
        max_tokens=1024,
        messages=messages,
        temperature=0,
    )

    raw_text = response.choices[0].message.content
    return _parse_response(raw_text)


def _parse_response(raw_text: str) -> LLMResponse:
    """Parse LLM JSON response into LLMResponse object."""
    text = raw_text.strip()

    # Remove markdown code fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON in the text
        json_match = re.search(r"\{[\s\S]*\}", text)
        if json_match:
            try:
                data = json.loads(json_match.group())
            except json.JSONDecodeError as e:
                raise ValueError(f"Failed to parse LLM response as JSON: {e}\nRaw: {text}") from e
        else:
            raise ValueError(f"No JSON found in LLM response:\n{text}")

    sql = data.get("sql", "").strip()
    if not sql:
        raise ValueError("LLM response missing 'sql' field")

    return LLMResponse(
        sql=sql,
        explanation=data.get("explanation", ""),
        chart_type=data.get("chart_type", "table"),
        chart_config=data.get("chart_config", {}),
    )
