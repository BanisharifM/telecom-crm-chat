"""Tests for SQL validation and sanitization."""

import pytest
from app.core.sql_validator import SQLValidationError, fuzzy_fix_columns, validate_sql


class TestValidateSQL:
    """Test SQL validation logic."""

    def test_valid_select(self):
        sql = 'SELECT "State", COUNT(*) FROM customers GROUP BY "State"'
        result = validate_sql(sql)
        assert "SELECT" in result
        assert "LIMIT" in result  # Auto-added

    def test_rejects_drop(self):
        with pytest.raises(SQLValidationError, match="Forbidden"):
            validate_sql("DROP TABLE customers")

    def test_rejects_delete(self):
        with pytest.raises(SQLValidationError, match="Forbidden"):
            validate_sql("DELETE FROM customers WHERE 1=1")

    def test_rejects_insert(self):
        with pytest.raises(SQLValidationError, match="Forbidden"):
            validate_sql("INSERT INTO customers VALUES (1, 'CA')")

    def test_rejects_update(self):
        with pytest.raises(SQLValidationError, match="Forbidden"):
            validate_sql('UPDATE customers SET "State" = \'XX\'')

    def test_rejects_empty(self):
        with pytest.raises(SQLValidationError, match="Empty"):
            validate_sql("")

    def test_preserves_existing_limit(self):
        sql = 'SELECT * FROM customers LIMIT 10'
        result = validate_sql(sql)
        assert "LIMIT 10" in result
        # Should not double-add LIMIT
        assert result.count("LIMIT") == 1

    def test_adds_limit_when_missing(self):
        sql = 'SELECT * FROM customers'
        result = validate_sql(sql)
        assert "LIMIT 500" in result

    def test_rejects_unknown_table(self):
        with pytest.raises(SQLValidationError, match="Unknown table"):
            validate_sql("SELECT * FROM secret_data")

    def test_allows_summary_tables(self):
        sql = "SELECT * FROM state_summary"
        result = validate_sql(sql)
        assert "state_summary" in result

    def test_allows_cte_aliases(self):
        sql = """WITH avg_churn AS (
            SELECT AVG(CASE WHEN "Churn" THEN 1.0 ELSE 0.0 END) as avg_rate
            FROM customers
        )
        SELECT "State", churn_rate_pct FROM state_summary, avg_churn
        WHERE churn_rate_pct > avg_churn.avg_rate"""
        result = validate_sql(sql)
        assert "avg_churn" in result


class TestFuzzyFixColumns:
    """Test fuzzy column name correction."""

    def test_fixes_underscore_columns(self):
        sql = "SELECT Total_day_minutes FROM customers"
        result = fuzzy_fix_columns(sql)
        assert '"Total day minutes"' in result

    def test_fixes_churn_yes(self):
        sql = "SELECT * FROM customers WHERE Churn = 'Yes'"
        result = fuzzy_fix_columns(sql)
        assert '"Churn" = true' in result

    def test_fixes_churn_no(self):
        sql = "SELECT * FROM customers WHERE Churn = 'No'"
        result = fuzzy_fix_columns(sql)
        assert '"Churn" = false' in result

    def test_preserves_correct_sql(self):
        sql = 'SELECT "Total day minutes" FROM customers WHERE "Churn" = true'
        result = fuzzy_fix_columns(sql)
        assert result == sql  # No changes needed
