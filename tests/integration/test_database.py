"""Integration tests for DuckDB queries."""

import pytest


class TestDatabaseQueries:
    """Test DuckDB queries with test data."""

    def test_count_customers(self, db_connection):
        result = db_connection.execute("SELECT COUNT(*) FROM customers").fetchone()
        assert result[0] == 5

    def test_churn_filter_boolean(self, db_connection):
        result = db_connection.execute(
            'SELECT COUNT(*) FROM customers WHERE "Churn" = true'
        ).fetchone()
        assert result[0] == 2  # CA customers are churned

    def test_column_with_spaces(self, db_connection):
        result = db_connection.execute(
            'SELECT "Total day charge" FROM customers WHERE customer_id = 0'
        ).fetchone()
        assert result[0] == pytest.approx(45.07)

    def test_state_aggregation(self, db_connection):
        result = db_connection.execute("""
            SELECT "State", COUNT(*) as cnt
            FROM customers
            GROUP BY "State"
            ORDER BY cnt DESC
        """).fetchdf()
        assert result.iloc[0]["State"] in ("CA", "NY")
        assert result.iloc[0]["cnt"] == 2

    def test_international_plan_filter(self, db_connection):
        result = db_connection.execute("""
            SELECT COUNT(*) FROM customers
            WHERE "International plan" = 'Yes'
        """).fetchone()
        assert result[0] == 2

    def test_total_charge_computation(self, db_connection):
        result = db_connection.execute("""
            SELECT customer_id,
                   ROUND("Total day charge" + "Total eve charge" +
                         "Total night charge" + "Total intl charge", 2) as total
            FROM customers
            WHERE customer_id = 0
        """).fetchone()
        expected = round(45.07 + 16.78 + 11.01 + 2.70, 2)
        assert result[1] == pytest.approx(expected)
