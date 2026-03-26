"""Query service: orchestrates NL question -> SQL -> execute -> response."""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field

from openai import OpenAI
import duckdb
import pandas as pd

from app.core.config import Settings
from app.core.database import execute_query
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
    conn: duckdb.DuckDBPyConnection,
    settings: Settings,
    conversation_history: list[dict] | None = None,
) -> QueryResult:
    """Process a natural language question end-to-end.

    Pipeline:
    1. Send question to LLM -> get SQL + chart config
    2. Apply fuzzy column name fixes
    3. Validate SQL (schema check, statement type, LIMIT)
    4. Execute against DuckDB
    5. Return structured result

    On failure: retry up to max_retries with error feedback to LLM.
    """
    start = time.time()

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
    for attempt in range(settings.max_retries):
        sql = llm_response.sql

        try:
            # Step 2: Apply fuzzy fixes
            sql = fuzzy_fix_columns(sql)

            # Step 3: Validate
            sql = validate_sql(sql)

            # Step 4: Execute
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
        except duckdb.Error as e:
            last_error = str(e)
            logger.warning(f"DuckDB execution failed (attempt {attempt + 1}): {e}")
        except Exception as e:
            last_error = str(e)
            logger.warning(f"Unexpected error (attempt {attempt + 1}): {e}")

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

    elapsed = (time.time() - start) * 1000
    return QueryResult(
        success=False,
        question=question,
        sql=sql if "sql" in dir() else "",
        error=f"I wasn't able to generate a valid query after {settings.max_retries} attempts. "
        f"Last error: {last_error}",
        query_time_ms=round(elapsed, 1),
    )
