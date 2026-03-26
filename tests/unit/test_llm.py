"""Tests for LLM response parsing."""

import pytest
from app.core.llm import _parse_response, LLMResponse


class TestParseResponse:
    """Test LLM JSON response parsing."""

    def test_valid_json(self):
        raw = '{"sql": "SELECT 1", "explanation": "test", "chart_type": "table", "chart_config": {}}'
        result = _parse_response(raw)
        assert isinstance(result, LLMResponse)
        assert result.sql == "SELECT 1"
        assert result.explanation == "test"
        assert result.chart_type == "table"

    def test_json_with_markdown_fences(self):
        raw = '```json\n{"sql": "SELECT 1", "explanation": "test"}\n```'
        result = _parse_response(raw)
        assert result.sql == "SELECT 1"

    def test_json_with_surrounding_text(self):
        raw = 'Here is the query:\n{"sql": "SELECT 1", "explanation": "test"}\nDone!'
        result = _parse_response(raw)
        assert result.sql == "SELECT 1"

    def test_missing_sql_field(self):
        raw = '{"explanation": "test", "chart_type": "bar"}'
        with pytest.raises(ValueError, match="missing 'sql'"):
            _parse_response(raw)

    def test_empty_sql_field(self):
        raw = '{"sql": "", "explanation": "test"}'
        with pytest.raises(ValueError, match="missing 'sql'"):
            _parse_response(raw)

    def test_plain_text_becomes_conversational(self):
        """Non-JSON responses (greetings) should become conversational responses."""
        raw = "Hi there! I'm your data assistant. How can I help?"
        result = _parse_response(raw)
        assert result.chart_type == "none"
        assert "Hi there" in result.explanation
        assert result.sql == "SELECT 1"

    def test_defaults_chart_type(self):
        raw = '{"sql": "SELECT 1", "explanation": "test"}'
        result = _parse_response(raw)
        assert result.chart_type == "table"  # Default

    def test_defaults_chart_config(self):
        raw = '{"sql": "SELECT 1", "explanation": "test"}'
        result = _parse_response(raw)
        assert result.chart_config == {}

    def test_complex_sql_in_json(self):
        raw = '''{"sql": "SELECT \\"State\\", COUNT(*) as cnt FROM customers WHERE \\"Churn\\" = true GROUP BY \\"State\\" ORDER BY cnt DESC LIMIT 10", "explanation": "Top 10 states by churned customers", "chart_type": "bar", "chart_config": {"x": "State", "y": "cnt", "title": "Test"}}'''
        result = _parse_response(raw)
        assert "State" in result.sql
        assert "Churn" in result.sql
        assert result.chart_type == "bar"
        assert result.chart_config["x"] == "State"
