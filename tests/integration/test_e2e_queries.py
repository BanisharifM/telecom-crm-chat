"""End-to-end tests that verify LLM-generated SQL produces CORRECT results.

These tests call the real OpenRouter API and validate not just execution,
but the actual data returned. They verify the full pipeline:
  question → LLM → SQL → validate → execute → correct answer

Skip these in CI (no API key). Run locally with:
  PYTHONPATH=src pytest tests/integration/test_e2e_queries.py -v
"""

from __future__ import annotations

import os

import pytest

from app.core.config import get_settings
from app.core.database import init_database
from app.core.llm import create_client
from app.core.query_service import process_question

# Skip all tests if no API key
pytestmark = pytest.mark.skipif(
    not os.environ.get("OPENROUTER_API_KEY"),
    reason="OPENROUTER_API_KEY not set — skipping live LLM tests",
)


@pytest.fixture(scope="module")
def setup():
    """Shared setup: database + LLM client (created once for all tests)."""
    settings = get_settings()
    conn = init_database(settings.data_file)
    client = create_client(settings)
    return conn, client, settings


# ══════════════════════════════════════════════════════════════
# Task.md Example Queries — these are the EXACT questions from
# the assignment spec. They MUST work correctly.
# ══════════════════════════════════════════════════════════════


class TestTaskSpecQueries:
    """Test the 3 exact example queries from task.md."""

    def test_average_monthly_bill_in_california(self, setup):
        """task.md: 'What is the average monthly bill in California?'"""
        conn, client, settings = setup
        result = process_question(
            "What is the average monthly bill in California?",
            client, conn, settings,
        )
        assert result.success, f"Query failed: {result.error}"
        assert result.data is not None
        assert len(result.data) >= 1

        # Verify the answer is numerically reasonable
        # CA avg bill should be ~$55-65 based on data analysis
        values = result.data.select_dtypes(include=["number"]).values.flatten()
        numeric_values = [v for v in values if 20 < v < 120]
        assert len(numeric_values) > 0, "Expected a dollar amount between $20-$120"

    def test_customers_churned_last_3_months(self, setup):
        """task.md: 'How many customers churned in the last 3 months?'

        This dataset has NO date column. The LLM should gracefully
        handle this — either explain the limitation or return total churn.
        """
        conn, client, settings = setup
        result = process_question(
            "How many customers churned in the last 3 months?",
            client, conn, settings,
        )
        # Should succeed (even if it explains the date limitation)
        assert result.success, f"Query failed: {result.error}"
        assert result.explanation  # Must explain something
        # If it returned data, churn count should be reasonable
        if result.data is not None and not result.data.empty:
            values = result.data.select_dtypes(include=["number"]).values.flatten()
            # Total churn is 483. Any reasonable answer is OK.
            assert any(0 < v <= 3333 for v in values), "Expected a count between 1-3333"

    def test_top_10_highest_spending_customers(self, setup):
        """task.md: 'Show me the 10 highest-spending customers.'"""
        conn, client, settings = setup
        result = process_question(
            "Show me the 10 highest-spending customers.",
            client, conn, settings,
        )
        assert result.success, f"Query failed: {result.error}"
        assert result.data is not None
        assert len(result.data) == 10, f"Expected 10 rows, got {len(result.data)}"

        # Verify results are sorted descending by some charge column
        numeric_cols = result.data.select_dtypes(include=["number"]).columns
        charge_cols = [c for c in numeric_cols if "charge" in c.lower() or "total" in c.lower()]
        if charge_cols:
            col = charge_cols[0]
            values = result.data[col].tolist()
            assert values == sorted(values, reverse=True), \
                f"Expected descending order for {col}"


# ══════════════════════════════════════════════════════════════
# Complex Queries — challenge the LLM with harder SQL
# ══════════════════════════════════════════════════════════════


class TestComplexQueries:
    """Test complex queries that challenge LLM SQL generation."""

    def test_subquery_above_average(self, setup):
        """Requires a subquery: states above average churn."""
        conn, client, settings = setup
        result = process_question(
            "Which states have a churn rate above the overall average?",
            client, conn, settings,
        )
        assert result.success, f"Query failed: {result.error}"
        assert result.data is not None
        # Overall avg is 14.49%. Should return ~23 states.
        assert 10 <= len(result.data) <= 40, f"Expected 10-40 states, got {len(result.data)}"

    def test_percentile_computation(self, setup):
        """Requires PERCENTILE_CONT — DuckDB-specific function."""
        conn, client, settings = setup
        result = process_question(
            "What is the 90th percentile of total charges for churned vs active customers?",
            client, conn, settings,
        )
        assert result.success, f"Query failed: {result.error}"
        assert result.data is not None
        assert len(result.data) == 2, "Expected 2 rows (churned vs active)"

    def test_multi_aggregation(self, setup):
        """Multiple aggregations in one query."""
        conn, client, settings = setup
        result = process_question(
            "For each area code, show the number of customers, churn rate, "
            "and average total charges",
            client, conn, settings,
        )
        assert result.success, f"Query failed: {result.error}"
        assert result.data is not None
        assert len(result.data) == 3, "Expected 3 rows (3 area codes: 408, 415, 510)"

    def test_case_when_categorization(self, setup):
        """Requires CASE WHEN to create categories."""
        conn, client, settings = setup
        result = process_question(
            "Group customers into 'Low' (0-1 service calls), 'Medium' (2-3), "
            "and 'High' (4+) and show the churn rate for each group",
            client, conn, settings,
        )
        assert result.success, f"Query failed: {result.error}"
        assert result.data is not None
        assert len(result.data) >= 2, "Expected at least 2 groups"

    def test_combined_filter_and_sort(self, setup):
        """Multiple WHERE conditions + ORDER BY."""
        conn, client, settings = setup
        result = process_question(
            "Show customers in California who have an international plan "
            "and made more than 3 service calls, sorted by total charges descending",
            client, conn, settings,
        )
        assert result.success, f"Query failed: {result.error}"
        assert result.data is not None
        # Verify all rows have State = CA
        if "State" in result.data.columns:
            assert all(result.data["State"] == "CA"), "All results should be from CA"

    def test_comparison_query(self, setup):
        """Compare two segments side by side."""
        conn, client, settings = setup
        result = process_question(
            "Compare the average day minutes, evening minutes, and night minutes "
            "between churned and active customers",
            client, conn, settings,
        )
        assert result.success, f"Query failed: {result.error}"
        assert result.data is not None
        assert len(result.data) == 2, "Expected 2 rows (churned vs active)"


# ══════════════════════════════════════════════════════════════
# Edge Cases — things that should fail gracefully
# ══════════════════════════════════════════════════════════════


class TestEdgeCases:
    """Test edge cases and graceful failure handling."""

    def test_no_date_column_question(self, setup):
        """Questions about time should be handled gracefully."""
        conn, client, settings = setup
        result = process_question(
            "Show me the monthly churn trend for 2025",
            client, conn, settings,
        )
        # Should succeed (explains limitation) or fail gracefully
        if result.success:
            assert result.explanation  # Should explain the date limitation

    def test_nonexistent_column_question(self, setup):
        """Questions about data we don't have."""
        conn, client, settings = setup
        result = process_question(
            "What is the average customer satisfaction score?",
            client, conn, settings,
        )
        # Should succeed with an explanation or fail gracefully
        # The LLM should recognize we don't have a satisfaction score column

    def test_chart_type_request(self, setup):
        """User explicitly requests a chart type."""
        conn, client, settings = setup
        result = process_question(
            "Show me a pie chart of customers by area code",
            client, conn, settings,
        )
        assert result.success, f"Query failed: {result.error}"
        assert result.chart_type == "pie", f"Expected pie chart, got {result.chart_type}"
        assert result.data is not None
        assert len(result.data) == 3, "Expected 3 area codes"

    def test_follow_up_style_question(self, setup):
        """A question that builds on common knowledge."""
        conn, client, settings = setup
        result = process_question(
            "Now break that down by voice mail plan as well",
            client, conn, settings,
            conversation_history=[
                {"role": "user", "content": "What is the churn rate by international plan?"},
                {"role": "assistant", "content": "International plan holders churn at 42%."},
            ],
        )
        assert result.success, f"Query failed: {result.error}"
        assert result.data is not None
