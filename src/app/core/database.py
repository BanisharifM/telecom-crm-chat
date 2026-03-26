"""DuckDB database setup and query execution."""

from __future__ import annotations

import logging
from pathlib import Path

import duckdb
import pandas as pd

logger = logging.getLogger(__name__)

# Schema information for LLM prompt injection
TABLE_NAME = "customers"

COLUMN_DEFINITIONS = """CREATE TABLE customers (
    "customer_id" INTEGER,              -- Unique customer identifier (0-2665, some duplicates from merged dataset)
    "State" VARCHAR,                    -- US state abbreviation (51 states incl. DC, e.g. 'KS', 'OH', 'CA')
    "Account length" INTEGER,           -- Number of days the account has been active (1-243)
    "Area code" INTEGER,                -- Phone area code: 408, 415, or 510
    "International plan" VARCHAR,       -- 'Yes' or 'No'
    "Voice mail plan" VARCHAR,          -- 'Yes' or 'No'
    "Number vmail messages" INTEGER,    -- Number of voicemail messages (0-51, 0 if no VM plan)
    "Total day minutes" DOUBLE,         -- Total daytime call minutes (0-350.8)
    "Total day calls" INTEGER,          -- Total daytime calls made (0-165)
    "Total day charge" DOUBLE,          -- Total daytime charges in dollars (0-59.64)
    "Total eve minutes" DOUBLE,         -- Total evening call minutes (0-363.7)
    "Total eve calls" INTEGER,          -- Total evening calls made (0-170)
    "Total eve charge" DOUBLE,          -- Total evening charges in dollars (0-30.91)
    "Total night minutes" DOUBLE,       -- Total nighttime call minutes (23.2-395.0)
    "Total night calls" INTEGER,        -- Total nighttime calls made (33-175)
    "Total night charge" DOUBLE,        -- Total nighttime charges in dollars (1.04-17.77)
    "Total intl minutes" DOUBLE,        -- Total international call minutes (0-20.0)
    "Total intl calls" INTEGER,         -- Total international calls made (0-20)
    "Total intl charge" DOUBLE,         -- Total international charges in dollars (0-5.40)
    "Customer service calls" INTEGER,   -- Number of calls to customer service (0-9)
    "Churn" BOOLEAN                     -- true = customer left, false = still active. NOT 'Yes'/'No'.
);"""

VALID_TABLES = {"customers", "state_summary", "plan_summary", "overall_kpis"}

VALID_COLUMNS = {
    "customer_id", "State", "Account length", "Area code",
    "International plan", "Voice mail plan", "Number vmail messages",
    "Total day minutes", "Total day calls", "Total day charge",
    "Total eve minutes", "Total eve calls", "Total eve charge",
    "Total night minutes", "Total night calls", "Total night charge",
    "Total intl minutes", "Total intl calls", "Total intl charge",
    "Customer service calls", "Churn",
    # Summary table columns
    "total_customers", "churned", "churn_rate_pct",
    "avg_total_charge", "avg_service_calls",
    "avg_day_minutes", "total_churned", "num_states", "avg_account_length",
}


def init_database(data_file: str, db_path: str = ":memory:") -> duckdb.DuckDBPyConnection:
    """Initialize DuckDB with the CRM data and summary tables."""
    conn = duckdb.connect(db_path)

    # Check if customers table already exists
    tables = [row[0] for row in conn.execute("SHOW TABLES").fetchall()]
    if "customers" in tables:
        logger.info("Database already initialized, skipping data load.")
        return conn

    # Load xlsx
    xlsx_path = Path(data_file)
    if not xlsx_path.exists():
        raise FileNotFoundError(f"Data file not found: {data_file}")

    logger.info(f"Loading data from {data_file}...")
    conn.execute("INSTALL excel; LOAD excel;")
    conn.execute(f"""
        CREATE TABLE customers AS
        SELECT * FROM read_xlsx('{data_file}')
    """)

    row_count = conn.execute("SELECT COUNT(*) FROM customers").fetchone()[0]
    logger.info(f"Loaded {row_count} rows into customers table.")

    # Create summary tables
    _create_summary_tables(conn)

    return conn


def _create_summary_tables(conn: duckdb.DuckDBPyConnection) -> None:
    """Create pre-computed summary tables for fast common queries."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS state_summary AS
        SELECT
            "State",
            COUNT(*) as total_customers,
            SUM(CASE WHEN "Churn" THEN 1 ELSE 0 END) as churned,
            ROUND(AVG(CASE WHEN "Churn" THEN 1.0 ELSE 0.0 END) * 100, 2) as churn_rate_pct,
            ROUND(AVG("Total day charge" + "Total eve charge" + "Total night charge" + "Total intl charge"), 2) as avg_total_charge,
            ROUND(AVG("Customer service calls"), 2) as avg_service_calls
        FROM customers
        GROUP BY "State"
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS plan_summary AS
        SELECT
            "International plan",
            "Voice mail plan",
            COUNT(*) as total_customers,
            ROUND(AVG(CASE WHEN "Churn" THEN 1.0 ELSE 0.0 END) * 100, 2) as churn_rate_pct,
            ROUND(AVG("Total day minutes"), 2) as avg_day_minutes,
            ROUND(AVG("Customer service calls"), 2) as avg_service_calls
        FROM customers
        GROUP BY "International plan", "Voice mail plan"
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS overall_kpis AS
        SELECT
            COUNT(*) as total_customers,
            SUM(CASE WHEN "Churn" THEN 1 ELSE 0 END) as total_churned,
            ROUND(AVG(CASE WHEN "Churn" THEN 1.0 ELSE 0.0 END) * 100, 2) as churn_rate_pct,
            COUNT(DISTINCT "State") as num_states,
            ROUND(AVG("Account length"), 1) as avg_account_length
        FROM customers
    """)

    logger.info("Summary tables created: state_summary, plan_summary, overall_kpis")


def execute_query(conn: duckdb.DuckDBPyConnection, sql: str) -> pd.DataFrame:
    """Execute a SQL query and return results as a DataFrame."""
    return conn.execute(sql).fetchdf()
