"""SQL validation and sanitization for LLM-generated queries."""

from __future__ import annotations

import re

import sqlglot
from sqlglot import exp

from app.core.database import VALID_COLUMNS, VALID_TABLES

# Dangerous SQL keywords that should never appear
BLOCKED_KEYWORDS = {
    "DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "CREATE", "GRANT",
    "REVOKE", "TRUNCATE", "EXEC", "EXECUTE", "MERGE", "REPLACE",
    "ATTACH", "DETACH", "COPY", "EXPORT", "IMPORT",
}


class SQLValidationError(Exception):
    """Raised when SQL validation fails."""

    pass


def validate_sql(sql: str, dialect: str = "postgres") -> str:
    """Validate and sanitize LLM-generated SQL.

    Returns the cleaned SQL if valid.
    Raises SQLValidationError if invalid.
    """
    sql = sql.strip().rstrip(";")

    if not sql:
        raise SQLValidationError("Empty SQL query")

    # Check for blocked keywords (case-insensitive)
    _check_blocked_keywords(sql)

    # Parse and validate structure
    _validate_structure(sql, dialect=dialect)

    # Ensure LIMIT exists
    sql = _ensure_limit(sql)

    return sql


def _check_blocked_keywords(sql: str) -> None:
    """Reject SQL containing dangerous keywords."""
    sql_upper = sql.upper()
    for keyword in BLOCKED_KEYWORDS:
        # Match as whole word to avoid false positives (e.g., "UPDATED" in column name)
        pattern = rf"\b{keyword}\b"
        if re.search(pattern, sql_upper):
            raise SQLValidationError(
                f"Forbidden SQL operation: {keyword}. Only SELECT queries are allowed."
            )


def _validate_structure(sql: str, dialect: str = "postgres") -> None:
    """Parse SQL and validate it's a SELECT with valid references."""
    try:
        parsed = sqlglot.parse_one(sql, dialect=dialect)
    except sqlglot.errors.ParseError as e:
        raise SQLValidationError(f"SQL syntax error: {e}") from e

    # Must be a SELECT statement (or UNION of SELECTs)
    if not isinstance(parsed, (exp.Select, exp.Union)):
        raise SQLValidationError("Only SELECT statements are allowed.")

    # Collect CTE aliases (WITH ... AS) so they are treated as valid tables
    cte_aliases: set[str] = set()
    for cte in parsed.find_all(exp.CTE):
        if cte.alias:
            cte_aliases.add(cte.alias)

    # Collect subquery aliases
    subquery_aliases: set[str] = set()
    for subq in parsed.find_all(exp.Subquery):
        if subq.alias:
            subquery_aliases.add(subq.alias)

    # Validate table references (allow CTE aliases + subquery aliases + known tables)
    allowed_tables = VALID_TABLES | cte_aliases | subquery_aliases
    for table in parsed.find_all(exp.Table):
        table_name = table.name
        if table_name and table_name not in allowed_tables:
            raise SQLValidationError(
                f"Unknown table: '{table_name}'. "
                f"Available tables: {', '.join(sorted(VALID_TABLES))}"
            )


def _ensure_limit(sql: str, max_rows: int = 500) -> str:
    """Ensure the query has a LIMIT clause."""
    sql_upper = sql.upper()
    if "LIMIT" not in sql_upper:
        sql = f"{sql} LIMIT {max_rows}"
    return sql


def fuzzy_fix_columns(sql: str) -> str:
    """Attempt to fix common column name issues in generated SQL.

    E.g., unquoted column names with spaces, underscores instead of spaces.
    """
    # Fix common underscore-to-space issues
    replacements = {
        "Total_day_minutes": '"Total day minutes"',
        "Total_day_calls": '"Total day calls"',
        "Total_day_charge": '"Total day charge"',
        "Total_eve_minutes": '"Total eve minutes"',
        "Total_eve_calls": '"Total eve calls"',
        "Total_eve_charge": '"Total eve charge"',
        "Total_night_minutes": '"Total night minutes"',
        "Total_night_calls": '"Total night calls"',
        "Total_night_charge": '"Total night charge"',
        "Total_intl_minutes": '"Total intl minutes"',
        "Total_intl_calls": '"Total intl calls"',
        "Total_intl_charge": '"Total intl charge"',
        "Account_length": '"Account length"',
        "Area_code": '"Area code"',
        "International_plan": '"International plan"',
        "Voice_mail_plan": '"Voice mail plan"',
        "Number_vmail_messages": '"Number vmail messages"',
        "Customer_service_calls": '"Customer service calls"',
    }

    for wrong, correct in replacements.items():
        sql = re.sub(rf"\b{wrong}\b", correct, sql, flags=re.IGNORECASE)

    # Fix Churn = 'Yes'/'No' -> Churn = true/false
    sql = re.sub(
        r"""["']?Churn["']?\s*=\s*['"]Yes['"]""",
        '"Churn" = true',
        sql,
        flags=re.IGNORECASE,
    )
    sql = re.sub(
        r"""["']?Churn["']?\s*=\s*['"]No['"]""",
        '"Churn" = false',
        sql,
        flags=re.IGNORECASE,
    )

    return sql
