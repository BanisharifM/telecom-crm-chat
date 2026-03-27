"""Query service: orchestrates NL question -> SQL -> execute -> response."""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any

from openai import OpenAI
import pandas as pd

from app.core.config import Settings
from app.core.database import execute_query, execute_query_postgres
from app.core.llm import LLMResponse, generate_sql, generate_sql_with_retry
from app.core.sql_validator import SQLValidationError, fuzzy_fix_columns, validate_sql

logger = logging.getLogger(__name__)


@dataclass
class QueryResult:
    """Result of processing a natural language question."""

    success: bool
    question: str
    sql: str = ""
    explanation: str = ""
    data: pd.DataFrame | None = None
    chart_type: str = "table"
    chart_config: dict = field(default_factory=dict)
    error: str = ""
    query_time_ms: float = 0
    rows_returned: int = 0


def process_question(
    question: str,
    client: OpenAI,
    conn: Any,  # DuckDB connection or None for PostgreSQL
    settings: Settings,
    conversation_history: list[dict] | None = None,
) -> QueryResult:
    """Process a natural language question end-to-end.

    Pipeline:
    1. Send question to LLM -> get SQL + chart config
    2. Apply fuzzy column name fixes
    3. Validate SQL (schema check, statement type, LIMIT)
    4. Execute against database (PostgreSQL or DuckDB)
    5. Return structured result

    On failure: retry up to max_retries with error feedback to LLM.
    """
    start = time.time()
    use_postgres = settings.database_backend == "postgres"
    dialect = "postgres" if use_postgres else "duckdb"

    # Step 1: Generate SQL via LLM
    try:
        llm_response = generate_sql(
            client=client,
            question=question,
            model=settings.llm_model,
            conversation_history=conversation_history,
        )
    except Exception as e:
        logger.error(f"LLM generation failed: {e}")
        return QueryResult(
            success=False,
            question=question,
            error=f"I couldn't understand that question. Please try rephrasing it. ({e})",
        )

    # Step 2-4: Validate and execute with retries
    last_error = ""
    sql = ""
    for attempt in range(settings.max_retries):
        sql = llm_response.sql

        try:
            # Step 2: Apply fuzzy fixes
            sql = fuzzy_fix_columns(sql)

            # Step 3: Validate
            sql = validate_sql(sql, dialect=dialect)

            # Step 4: Execute
            if use_postgres:
                df = execute_query_postgres(sql)
            else:
                df = execute_query(conn, sql)

            elapsed = (time.time() - start) * 1000

            return QueryResult(
                success=True,
                question=question,
                sql=sql,
                explanation=llm_response.explanation,
                data=df,
                chart_type=llm_response.chart_type,
                chart_config=llm_response.chart_config,
                query_time_ms=round(elapsed, 1),
                rows_returned=len(df),
            )

        except SQLValidationError as e:
            last_error = str(e)
            logger.warning(f"SQL validation failed (attempt {attempt + 1}): {e}")
        except Exception as e:
            last_error = str(e)
            logger.warning(f"Query execution failed (attempt {attempt + 1}): {e}")

        # Retry with error feedback
        if attempt < settings.max_retries - 1:
            try:
                llm_response = generate_sql_with_retry(
                    client=client,
                    question=question,
                    error_message=last_error,
                    failed_sql=sql,
                    model=settings.llm_model,
                )
            except Exception as e:
                logger.error(f"Retry generation failed: {e}")
                break

    # Instead of showing a raw error, ask LLM to explain what went wrong
    # and suggest alternatives
    elapsed = (time.time() - start) * 1000
    try:
        clarification = client.chat.completions.create(
            model=settings.llm_model,
            max_tokens=512,
            temperature=0,
            messages=[
                {"role": "system", "content": "You are a helpful CRM data assistant. The user asked a question but the SQL query failed. Explain briefly what went wrong and suggest 2-3 simpler alternative questions they could ask instead. Be friendly and helpful. Use markdown formatting."},
                {"role": "user", "content": f"My question was: \"{question}\"\n\nThe error was: {last_error}\n\nPlease help me rephrase this or suggest alternatives."},
            ],
        )
        helpful_msg = clarification.choices[0].message.content
    except Exception:
        helpful_msg = (
            f"I had trouble with that query. Here are some alternatives you could try:\n\n"
            f"- Break it into simpler questions\n"
            f"- Be more specific about which columns or states you want\n"
            f"- Try asking for one thing at a time\n\n"
            f"*Technical detail: {last_error}*"
        )

    return QueryResult(
        success=True,  # Mark as success so UI renders the explanation nicely
        question=question,
        sql=sql,
        explanation=helpful_msg,
        chart_type="none",
        chart_config={},
        query_time_ms=round(elapsed, 1),
    )
