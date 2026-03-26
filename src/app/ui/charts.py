"""Chart generation using Plotly with a professional CRM theme."""

from __future__ import annotations

import plotly.express as px
import plotly.graph_objects as go
import plotly.io as pio
import pandas as pd

# ═══════════════════════════════════════════════════════
# CRM Dashboard Color Palette
# ═══════════════════════════════════════════════════════

CRM_COLORS = {
    "primary": "#7C3AED",    # Purple (brand)
    "secondary": "#3B82F6",  # Blue (trust)
    "success": "#10B981",    # Emerald (growth)
    "danger": "#EF4444",     # Red (churn/alert)
    "warning": "#F59E0B",    # Amber (attention)
    "info": "#06B6D4",       # Cyan (neutral)
    "orange": "#F97316",
    "pink": "#EC4899",
    "gray": "#6B7280",
    "light_gray": "#94A3B8",
    "dark": "#E2E8F0",
    "bg": "#0F172A",
    "card_bg": "#1E293B",
}

CRM_COLORWAY = [
    CRM_COLORS["primary"],
    CRM_COLORS["secondary"],
    CRM_COLORS["success"],
    CRM_COLORS["danger"],
    CRM_COLORS["warning"],
    CRM_COLORS["info"],
    CRM_COLORS["orange"],
    CRM_COLORS["pink"],
]

FONT_FAMILY = "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"

# ═══════════════════════════════════════════════════════
# Plotly Template (dark theme matching Streamlit config)
# ═══════════════════════════════════════════════════════

crm_template = go.layout.Template(
    layout=go.Layout(
        font=dict(family=FONT_FAMILY, size=13, color=CRM_COLORS["dark"]),
        title=dict(
            font=dict(family=FONT_FAMILY, size=18, color=CRM_COLORS["dark"]),
            x=0.0,
            xanchor="left",
        ),
        colorway=CRM_COLORWAY,
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        xaxis=dict(
            showgrid=False,
            showline=True,
            linewidth=1,
            linecolor="#334155",
            ticks="outside",
            tickcolor="#334155",
            tickfont=dict(size=11, color=CRM_COLORS["light_gray"]),
            title_font=dict(size=13, color=CRM_COLORS["light_gray"]),
            zeroline=False,
        ),
        yaxis=dict(
            showgrid=True,
            gridwidth=1,
            gridcolor="rgba(255,255,255,0.06)",
            showline=False,
            ticks="",
            tickfont=dict(size=11, color=CRM_COLORS["light_gray"]),
            title_font=dict(size=13, color=CRM_COLORS["light_gray"]),
            zeroline=False,
        ),
        legend=dict(
            font=dict(size=12, color=CRM_COLORS["light_gray"]),
            bgcolor="rgba(0,0,0,0)",
            borderwidth=0,
            orientation="h",
            yanchor="bottom",
            y=-0.25,
            xanchor="center",
            x=0.5,
        ),
        margin=dict(l=50, r=20, t=60, b=50),
        hovermode="x unified",
        hoverlabel=dict(
            bgcolor=CRM_COLORS["card_bg"],
            font_size=12,
            font_family=FONT_FAMILY,
            font_color=CRM_COLORS["dark"],
            bordercolor="#334155",
        ),
        bargap=0.25,
    ),
)

pio.templates["crm_dark"] = crm_template
pio.templates.default = "plotly_dark+crm_dark"

# Chart config for Plotly modebar
CHART_CONFIG = {
    "responsive": True,
    "displayModeBar": True,
    "displaylogo": False,
    "modeBarButtonsToRemove": ["lasso2d", "select2d", "autoScale2d"],
    "toImageButtonOptions": {
        "format": "png",
        "filename": "telecomco_chart",
        "height": 600,
        "width": 1200,
        "scale": 2,
    },
}


def create_chart(
    df: pd.DataFrame,
    chart_type: str,
    chart_config: dict,
) -> go.Figure | None:
    """Create a Plotly chart from query results.

    Args:
        df: Query result DataFrame
        chart_type: One of bar, line, pie, scatter, heatmap, table, metric, none
        chart_config: Dict with x, y, title, color keys

    Returns:
        Plotly Figure or None if chart_type is table/metric/none
    """
    if chart_type in ("table", "metric", "none") or df.empty:
        return None

    x_col = chart_config.get("x", "")
    y_col = chart_config.get("y", "")
    title = chart_config.get("title", "")
    color_col = chart_config.get("color")

    # Validate columns exist
    if x_col and x_col not in df.columns:
        x_col = df.columns[0] if len(df.columns) > 0 else ""
    if y_col and y_col not in df.columns:
        y_col = df.columns[1] if len(df.columns) > 1 else df.columns[0]

    try:
        if chart_type == "bar":
            fig = _create_bar(df, x_col, y_col, title, color_col)
        elif chart_type == "line":
            fig = _create_line(df, x_col, y_col, title, color_col)
        elif chart_type == "pie":
            fig = _create_pie(df, x_col, y_col, title)
        elif chart_type == "scatter":
            fig = _create_scatter(df, x_col, y_col, title, color_col)
        elif chart_type == "heatmap":
            fig = _create_heatmap(df, title)
        else:
            fig = _auto_chart(df, title)

        if fig:
            fig.update_layout(title_text=title)

        return fig

    except Exception:
        # Fallback to auto-chart on any error
        return _auto_chart(df, title)


def _create_bar(
    df: pd.DataFrame, x: str, y: str, title: str, color: str | None = None
) -> go.Figure:
    """Create a bar chart."""
    kwargs: dict = {"x": x, "y": y, "title": title}
    if color and color in df.columns:
        kwargs["color"] = color

    fig = px.bar(df, **kwargs)
    fig.update_traces(marker=dict(cornerradius=4, line=dict(width=0)))

    # Add value labels on bars if not too many
    if len(df) <= 20:
        fig.update_traces(textposition="outside", texttemplate="%{y:.1f}")

    return fig


def _create_line(
    df: pd.DataFrame, x: str, y: str, title: str, color: str | None = None
) -> go.Figure:
    """Create a line chart."""
    kwargs: dict = {"x": x, "y": y, "title": title, "markers": True}
    if color and color in df.columns:
        kwargs["color"] = color
    return px.line(df, **kwargs)


def _create_pie(df: pd.DataFrame, names: str, values: str, title: str) -> go.Figure:
    """Create a donut chart."""
    fig = px.pie(df, names=names, values=values, title=title, hole=0.4)
    fig.update_traces(
        textposition="auto",
        textinfo="percent+label",
        marker=dict(line=dict(color=CRM_COLORS["bg"], width=2)),
    )
    return fig


def _create_scatter(
    df: pd.DataFrame, x: str, y: str, title: str, color: str | None = None
) -> go.Figure:
    """Create a scatter plot."""
    kwargs: dict = {"x": x, "y": y, "title": title}
    if color and color in df.columns:
        kwargs["color"] = color
    return px.scatter(df, **kwargs)


def _create_heatmap(df: pd.DataFrame, title: str) -> go.Figure:
    """Create a heatmap from numeric columns."""
    numeric_df = df.select_dtypes(include=["number"])
    if numeric_df.empty:
        return _auto_chart(df, title)
    corr = numeric_df.corr()
    fig = px.imshow(corr, title=title, color_continuous_scale="RdBu_r", zmin=-1, zmax=1)
    return fig


def _auto_chart(df: pd.DataFrame, title: str = "") -> go.Figure | None:
    """Automatically select the best chart type based on DataFrame shape."""
    if df.empty:
        return None

    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    categorical_cols = df.select_dtypes(include=["object", "bool"]).columns.tolist()

    # Single numeric value -> no chart needed (metric)
    if len(df) == 1 and len(numeric_cols) >= 1:
        return None

    # One categorical + one numeric -> bar chart
    if len(categorical_cols) >= 1 and len(numeric_cols) >= 1:
        x = categorical_cols[0]
        y = numeric_cols[0]
        fig = px.bar(df, x=x, y=y, title=title or f"{y} by {x}")
        fig.update_traces(marker=dict(cornerradius=4))
        return fig

    # Two numeric columns -> scatter
    if len(numeric_cols) >= 2:
        return px.scatter(df, x=numeric_cols[0], y=numeric_cols[1], title=title)

    return None
