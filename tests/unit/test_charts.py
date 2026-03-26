"""Tests for chart generation logic."""

import pytest
import pandas as pd
from app.ui.charts import create_chart, _auto_chart, CRM_COLORS


class TestCreateChart:
    """Test chart creation from query results."""

    def test_bar_chart(self):
        df = pd.DataFrame({"State": ["CA", "NY", "TX"], "count": [100, 200, 150]})
        fig = create_chart(df, "bar", {"x": "State", "y": "count", "title": "Test"})
        assert fig is not None
        assert fig.data[0].type == "bar"

    def test_pie_chart(self):
        df = pd.DataFrame({"status": ["Churned", "Active"], "count": [483, 2850]})
        fig = create_chart(df, "pie", {"x": "status", "y": "count", "title": "Test"})
        assert fig is not None
        assert fig.data[0].type == "pie"

    def test_line_chart(self):
        df = pd.DataFrame({"calls": [0, 1, 2, 3], "customers": [50, 100, 75, 30]})
        fig = create_chart(df, "line", {"x": "calls", "y": "customers", "title": "Test"})
        assert fig is not None
        assert fig.data[0].type == "scatter"  # Plotly line is scatter with mode=lines

    def test_scatter_chart(self):
        df = pd.DataFrame({"day_minutes": [100, 200, 300], "eve_minutes": [50, 150, 250]})
        fig = create_chart(df, "scatter", {"x": "day_minutes", "y": "eve_minutes", "title": "Test"})
        assert fig is not None

    def test_returns_none_for_table_type(self):
        df = pd.DataFrame({"a": [1]})
        fig = create_chart(df, "table", {})
        assert fig is None

    def test_returns_none_for_metric_type(self):
        df = pd.DataFrame({"a": [1]})
        fig = create_chart(df, "metric", {})
        assert fig is None

    def test_returns_none_for_empty_df(self):
        df = pd.DataFrame()
        fig = create_chart(df, "bar", {"x": "a", "y": "b"})
        assert fig is None

    def test_handles_invalid_column_gracefully(self):
        df = pd.DataFrame({"State": ["CA", "NY"], "count": [100, 200]})
        # Wrong column names — should fallback to available columns
        fig = create_chart(df, "bar", {"x": "nonexistent", "y": "also_nonexistent", "title": "Test"})
        assert fig is not None  # Should use first/second columns as fallback

    def test_chart_has_title(self):
        df = pd.DataFrame({"x": [1, 2], "y": [3, 4]})
        fig = create_chart(df, "bar", {"x": "x", "y": "y", "title": "My Title"})
        assert fig is not None
        assert "My Title" in fig.layout.title.text


class TestAutoChart:
    """Test automatic chart type selection."""

    def test_categorical_numeric_gives_bar(self):
        df = pd.DataFrame({"State": ["CA", "NY"], "count": [100, 200]})
        fig = _auto_chart(df, "Test")
        assert fig is not None
        assert fig.data[0].type == "bar"

    def test_two_numeric_gives_scatter(self):
        df = pd.DataFrame({"a": [1.0, 2.0, 3.0], "b": [4.0, 5.0, 6.0]})
        fig = _auto_chart(df, "Test")
        assert fig is not None
        assert fig.data[0].type == "scatter"

    def test_single_value_gives_none(self):
        df = pd.DataFrame({"value": [42.5]})
        fig = _auto_chart(df, "Test")
        assert fig is None  # Single scalar = metric card, not chart

    def test_empty_df_gives_none(self):
        fig = _auto_chart(pd.DataFrame(), "Test")
        assert fig is None


class TestCRMColors:
    """Test chart theme configuration."""

    def test_all_colors_are_hex(self):
        for name, color in CRM_COLORS.items():
            assert color.startswith("#"), f"Color '{name}' is not hex: {color}"
            assert len(color) == 7, f"Color '{name}' is not 7 chars: {color}"
