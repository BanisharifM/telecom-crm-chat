"""Shared test fixtures."""

import sys
from pathlib import Path

import pytest
import duckdb

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


@pytest.fixture
def db_connection():
    """In-memory DuckDB with test data."""
    conn = duckdb.connect(":memory:")
    conn.execute("""
        CREATE TABLE customers (
            "customer_id" INTEGER,
            "State" VARCHAR,
            "Account length" INTEGER,
            "Area code" INTEGER,
            "International plan" VARCHAR,
            "Voice mail plan" VARCHAR,
            "Number vmail messages" INTEGER,
            "Total day minutes" DOUBLE,
            "Total day calls" INTEGER,
            "Total day charge" DOUBLE,
            "Total eve minutes" DOUBLE,
            "Total eve calls" INTEGER,
            "Total eve charge" DOUBLE,
            "Total night minutes" DOUBLE,
            "Total night calls" INTEGER,
            "Total night charge" DOUBLE,
            "Total intl minutes" DOUBLE,
            "Total intl calls" INTEGER,
            "Total intl charge" DOUBLE,
            "Customer service calls" INTEGER,
            "Churn" BOOLEAN
        )
    """)
    conn.execute("""
        INSERT INTO customers VALUES
        (0, 'CA', 128, 415, 'Yes', 'No', 0, 265.1, 110, 45.07, 197.4, 99, 16.78, 244.7, 91, 11.01, 10.0, 3, 2.70, 1, true),
        (1, 'NY', 107, 415, 'No', 'Yes', 26, 161.6, 123, 27.47, 195.5, 103, 16.62, 254.4, 103, 11.45, 13.7, 3, 3.70, 1, false),
        (2, 'TX', 137, 408, 'No', 'No', 0, 243.4, 114, 41.38, 121.2, 110, 10.30, 162.6, 104, 7.32, 12.2, 5, 3.29, 0, false),
        (3, 'CA', 84, 408, 'Yes', 'No', 0, 299.4, 71, 50.90, 61.9, 88, 5.26, 196.9, 89, 8.86, 6.6, 7, 1.78, 2, true),
        (4, 'NY', 75, 510, 'No', 'Yes', 30, 166.7, 113, 28.34, 148.3, 122, 12.61, 186.9, 121, 8.41, 10.1, 3, 2.73, 3, false)
    """)
    yield conn
    conn.close()
