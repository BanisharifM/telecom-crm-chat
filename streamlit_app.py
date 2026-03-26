"""TelecomCo CRM Chat — Main Streamlit Application.

A natural-language chat interface for querying telecom CRM data.
Uses Claude to convert questions to SQL, executes against DuckDB,
and returns answers with interactive Plotly charts.
"""

from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st
import pandas as pd

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

from app.core.config import get_settings
from app.core.database import init_database, execute_query
from app.core.llm import create_client
from app.core.query_service import process_question, QueryResult
from app.ui.charts import create_chart, CHART_CONFIG
from app.ui.styles import CUSTOM_CSS

# ═══════════════════════════════════════════════════════
# Page Config (must be first Streamlit command)
# ═══════════════════════════════════════════════════════

st.set_page_config(
    page_title="TelecomCo CRM Chat",
    page_icon="📱",
    layout="wide",
    initial_sidebar_state="auto",
    menu_items={
        "About": "# TelecomCo CRM Chat\nAI-powered data assistant for telecom CRM analytics.",
    },
)

st.markdown(CUSTOM_CSS, unsafe_allow_html=True)


# ═══════════════════════════════════════════════════════
# Initialize Resources
# ═══════════════════════════════════════════════════════

@st.cache_resource
def get_database():
    """Initialize DuckDB with CRM data (runs once)."""
    settings = get_settings()
    return init_database(settings.data_file)


def get_llm_client():
    """Create OpenRouter client. Not cached — reads fresh secrets each time."""
    settings = get_settings()
    return create_client(settings)


@st.cache_data(ttl=3600)
def get_kpis() -> dict:
    """Fetch KPI metrics."""
    conn = get_database()
    row = conn.execute("SELECT * FROM overall_kpis").fetchdf().iloc[0]
    return {
        "total_customers": int(row["total_customers"]),
        "total_churned": int(row["total_churned"]),
        "churn_rate": float(row["churn_rate_pct"]),
        "num_states": int(row["num_states"]),
        "avg_account_length": float(row["avg_account_length"]),
    }


@st.cache_data
def get_auto_insights() -> list[str]:
    """Generate pre-computed data insights."""
    conn = get_database()
    insights = []
    try:
        intl_stats = conn.execute("""
            SELECT "International plan",
                   SUM(total_customers) as total,
                   ROUND(SUM(total_customers * churn_rate_pct) / NULLIF(SUM(total_customers), 0), 1) as rate
            FROM plan_summary
            GROUP BY "International plan" ORDER BY rate DESC
        """).fetchdf()
        for _, row in intl_stats.iterrows():
            label = "International" if row["International plan"] == "Yes" else "Non-international"
            insights.append(f"{label} plan holders: **{row['rate']}%** churn rate ({int(row['total'])} customers)")
    except Exception:
        pass
    try:
        svc = conn.execute("""
            SELECT ROUND(AVG(CASE WHEN "Churn" THEN "Customer service calls" END), 1) as c_avg,
                   ROUND(AVG(CASE WHEN NOT "Churn" THEN "Customer service calls" END), 1) as a_avg
            FROM customers
        """).fetchdf().iloc[0]
        insights.append(f"Churned customers averaged **{svc['c_avg']}** service calls vs **{svc['a_avg']}** for active")
    except Exception:
        pass
    try:
        ts = conn.execute("""
            SELECT "State", churn_rate_pct, total_customers FROM state_summary
            WHERE total_customers >= 30 ORDER BY churn_rate_pct DESC LIMIT 1
        """).fetchdf().iloc[0]
        insights.append(f"Highest churn state: **{ts['State']}** at **{ts['churn_rate_pct']}%** ({int(ts['total_customers'])} customers)")
    except Exception:
        pass
    return insights


# ═══════════════════════════════════════════════════════
# Session State
# ═══════════════════════════════════════════════════════

if "messages" not in st.session_state:
    st.session_state.messages = []
if "conversation_history" not in st.session_state:
    st.session_state.conversation_history = []

EXAMPLE_QUESTIONS = [
    "What is the overall churn rate?",
    "Show churn rate by state",
    "Top 10 customers by total charges",
    "Compare international plan holders vs non-holders",
    "Distribution of customer service calls",
    "Average monthly bill in California",
    "Which area code has the highest churn?",
    "Show me a pie chart of churn",
]


# ═══════════════════════════════════════════════════════
# Sidebar
# ═══════════════════════════════════════════════════════

with st.sidebar:
    # Logo / Brand
    st.markdown(
        '<div style="text-align:center; padding: 8px 0 4px;">'
        '<span style="font-size:2rem;">📱</span><br>'
        '<span style="font-size:1.1rem; font-weight:700; color:#F1F5F9; letter-spacing:-0.02em;">TelecomCo CRM</span><br>'
        '<span style="font-size:0.72rem; color:#64748B; text-transform:uppercase; letter-spacing:0.1em;">AI Data Assistant</span>'
        '</div>',
        unsafe_allow_html=True,
    )
    st.divider()

    # Navigation
    page = st.radio(
        "NAVIGATION",
        ["💬 Chat", "📊 Dashboard", "🔍 Data Explorer"],
        label_visibility="visible",
    )
    st.divider()

    # KPIs
    try:
        kpis = get_kpis()
        st.markdown(
            '<span style="font-size:0.7rem; color:#475569; text-transform:uppercase; letter-spacing:0.1em; font-weight:600;">Dataset Overview</span>',
            unsafe_allow_html=True,
        )
        c1, c2 = st.columns(2)
        c1.metric("Customers", f"{kpis['total_customers']:,}")
        c2.metric("Churned", f"{kpis['total_churned']:,}")
        c1.metric("Churn Rate", f"{kpis['churn_rate']}%")
        c2.metric("States", kpis["num_states"])
    except Exception:
        pass

    # Example questions (only on chat page)
    if page == "💬 Chat":
        st.divider()
        st.markdown(
            '<span style="font-size:0.7rem; color:#475569; text-transform:uppercase; letter-spacing:0.1em; font-weight:600;">Quick Questions</span>',
            unsafe_allow_html=True,
        )
        for q in EXAMPLE_QUESTIONS:
            if st.button(q, key=f"ex_{q}", use_container_width=True):
                st.session_state.pending_question = q
                st.rerun()

    # Footer
    st.divider()
    st.markdown(
        '<div style="text-align:center; font-size:0.68rem; color:#475569; line-height:1.6;">'
        'Powered by <strong style="color:#7C3AED;">Claude</strong> + '
        '<strong style="color:#F59E0B;">DuckDB</strong> + '
        '<strong style="color:#3B82F6;">Plotly</strong><br>'
        'Built by Mahdi BanisharifDehkordi'
        '</div>',
        unsafe_allow_html=True,
    )


# ═══════════════════════════════════════════════════════
# CHAT PAGE
# ═══════════════════════════════════════════════════════

def render_chat_page():
    """Main chat interface."""
    st.markdown('<div class="hero-title">💬 Ask Your CRM Data</div>', unsafe_allow_html=True)
    st.markdown('<div class="hero-subtitle">Type a question in plain English and get answers with charts and tables.</div>', unsafe_allow_html=True)

    # Chat history
    for i, msg in enumerate(st.session_state.messages):
        _render_message(msg, i)

    # Welcome
    if not st.session_state.messages:
        with st.chat_message("assistant", avatar="🤖"):
            st.markdown(
                "Welcome! I can answer questions about **3,333 telecom customers** — "
                "churn rates, billing, service calls, plans, and more.\n\n"
                "Try clicking one of the **Quick Questions** in the sidebar, or type your own below."
            )

    # Input
    pending = st.session_state.pop("pending_question", None)
    prompt = st.chat_input("Ask a question about your CRM data...")
    question = pending or prompt
    if question:
        _handle_question(question)


def _handle_question(question: str):
    """Process a user question."""
    st.session_state.messages.append({"role": "user", "content": question})
    with st.chat_message("user", avatar="👤"):
        st.markdown(question)

    with st.chat_message("assistant", avatar="🤖"):
        with st.spinner("Thinking..."):
            try:
                result = process_question(
                    question=question,
                    client=get_llm_client(),
                    conn=get_database(),
                    settings=get_settings(),
                    conversation_history=st.session_state.conversation_history,
                )
            except Exception as e:
                result = QueryResult(success=False, question=question, error=str(e))

        if result.success:
            _render_success(result, msg_index=len(st.session_state.messages))
            st.session_state.conversation_history.append({"role": "user", "content": question})
            st.session_state.conversation_history.append({"role": "assistant", "content": result.explanation})
        else:
            st.error(result.error)

        st.session_state.messages.append({"role": "assistant", "result": result})


def _render_success(result: QueryResult, msg_index: int = -1):
    """Render: text answer → metric cards → chart → table → download."""
    # Unique key suffix to prevent duplicate element IDs across messages
    key = f"_{msg_index}_{hash(result.sql) % 100000}"

    # 1. TEXT ANSWER
    st.markdown(result.explanation)

    if result.data is None or result.data.empty:
        return
    df = result.data

    # 2. METRIC CARDS — for single-row results
    if result.chart_type == "metric" or (len(df) == 1 and len(df.columns) <= 5):
        _render_metric_cards(df, key)

    # 3. CHART
    fig = create_chart(df, result.chart_type, result.chart_config)
    if fig:
        st.plotly_chart(fig, width="stretch", config=CHART_CONFIG, key=f"chart{key}")

    # 4. TABLE
    if len(df) > 1 or result.chart_type == "table":
        st.dataframe(df, width="stretch", hide_index=True, key=f"df{key}")

    # 5. DOWNLOAD
    st.download_button("⬇️ Download CSV", df.to_csv(index=False), "results.csv", "text/csv",
                       use_container_width=True, key=f"dl{key}")


def _render_metric_cards(df: pd.DataFrame, key: str = ""):
    """Big KPI cards for single-value results."""
    row = df.iloc[0]
    num_cols = df.select_dtypes(include=["number"]).columns.tolist()
    if not num_cols:
        return
    cols = st.columns(min(len(num_cols), 4))
    for i, col_name in enumerate(num_cols[:4]):
        v = row[col_name]
        if "rate" in col_name.lower() or "pct" in col_name.lower():
            disp = f"{v:.1f}%"
        elif "charge" in col_name.lower() or "bill" in col_name.lower():
            disp = f"${v:,.2f}"
        elif isinstance(v, float) and v == int(v):
            disp = f"{int(v):,}"
        elif isinstance(v, float):
            disp = f"{v:,.2f}"
        else:
            disp = f"{v:,}"
        cols[i].metric(col_name.replace("_", " ").title(), disp)


def _render_message(msg: dict, index: int = 0):
    """Replay a saved message."""
    if msg["role"] == "user":
        with st.chat_message("user", avatar="👤"):
            st.markdown(msg["content"])
    else:
        with st.chat_message("assistant", avatar="🤖"):
            result = msg.get("result")
            if result and result.success:
                _render_success(result, msg_index=index)
            elif result:
                st.error(result.error)
            else:
                st.markdown(msg.get("content", ""))


# ═══════════════════════════════════════════════════════
# DASHBOARD PAGE
# ═══════════════════════════════════════════════════════

def render_dashboard_page():
    """Overview dashboard with KPIs, insights, and charts."""
    st.markdown('<div class="hero-title">📊 CRM Dashboard</div>', unsafe_allow_html=True)
    st.markdown('<div class="hero-subtitle">At-a-glance overview of your telecom customer data.</div>', unsafe_allow_html=True)

    try:
        conn = get_database()
        kpis = get_kpis()
    except Exception as e:
        st.error(f"Failed to load data: {e}")
        return

    # ── KPI Row ──
    k1, k2, k3, k4, k5 = st.columns(5)
    k1.metric("Total Customers", f"{kpis['total_customers']:,}")
    k2.metric("Churned", f"{kpis['total_churned']:,}")
    k3.metric("Churn Rate", f"{kpis['churn_rate']}%")
    k4.metric("States Covered", kpis["num_states"])
    k5.metric("Avg Tenure", f"{kpis['avg_account_length']:.0f} days")

    st.divider()

    # ── Insights ──
    insights = get_auto_insights()
    if insights:
        st.markdown("#### 💡 Key Insights")
        for ins in insights:
            st.markdown(f'<div class="insight-card">{ins}</div>', unsafe_allow_html=True)
        st.divider()

    # ── Charts (2×2 grid) ──
    c1, c2 = st.columns(2)

    with c1:
        df = execute_query(conn, """
            SELECT "State", churn_rate_pct, total_customers
            FROM state_summary ORDER BY churn_rate_pct DESC LIMIT 15
        """)
        fig = create_chart(df, "bar", {"x": "State", "y": "churn_rate_pct", "title": "Top 15 States by Churn Rate (%)"})
        if fig:
            st.plotly_chart(fig, width="stretch", config=CHART_CONFIG)

    with c2:
        df = execute_query(conn, """
            SELECT "International plan",
                   SUM(total_customers) as customers,
                   ROUND(SUM(total_customers * churn_rate_pct) / SUM(total_customers), 1) as churn_rate
            FROM plan_summary GROUP BY "International plan"
        """)
        fig = create_chart(df, "bar", {"x": "International plan", "y": "churn_rate", "title": "Churn Rate by International Plan"})
        if fig:
            st.plotly_chart(fig, width="stretch", config=CHART_CONFIG)

    c3, c4 = st.columns(2)

    with c3:
        df = execute_query(conn, """
            SELECT "Customer service calls", COUNT(*) as num_customers
            FROM customers GROUP BY "Customer service calls" ORDER BY "Customer service calls"
        """)
        fig = create_chart(df, "bar", {"x": "Customer service calls", "y": "num_customers", "title": "Customer Service Calls Distribution"})
        if fig:
            st.plotly_chart(fig, width="stretch", config=CHART_CONFIG)

    with c4:
        df = execute_query(conn, """
            SELECT CASE WHEN "Churn" THEN 'Churned' ELSE 'Active' END as status,
                   COUNT(*) as count FROM customers GROUP BY status
        """)
        fig = create_chart(df, "pie", {"x": "status", "y": "count", "title": "Customer Churn Breakdown"})
        if fig:
            st.plotly_chart(fig, width="stretch", config=CHART_CONFIG)


# ═══════════════════════════════════════════════════════
# DATA EXPLORER PAGE
# ═══════════════════════════════════════════════════════

def render_data_explorer_page():
    """Interactive data browser with filters."""
    st.markdown('<div class="hero-title">🔍 Data Explorer</div>', unsafe_allow_html=True)
    st.markdown('<div class="hero-subtitle">Browse and filter the raw CRM dataset.</div>', unsafe_allow_html=True)

    try:
        conn = get_database()
    except Exception as e:
        st.error(f"Failed to load data: {e}")
        return

    # ── Filters ──
    f1, f2, f3, f4 = st.columns(4)
    with f1:
        states = ["All"] + sorted(execute_query(conn, 'SELECT DISTINCT "State" FROM customers ORDER BY "State"')["State"].tolist())
        sel_state = st.selectbox("State", states)
    with f2:
        sel_intl = st.selectbox("International Plan", ["All", "Yes", "No"])
    with f3:
        sel_vm = st.selectbox("Voice Mail Plan", ["All", "Yes", "No"])
    with f4:
        sel_churn = st.selectbox("Churn Status", ["All", "Churned", "Active"])

    # Build query
    conds = []
    if sel_state != "All":
        conds.append(f""""State" = '{sel_state}'""")
    if sel_intl != "All":
        conds.append(f""""International plan" = '{sel_intl}'""")
    if sel_vm != "All":
        conds.append(f""""Voice mail plan" = '{sel_vm}'""")
    if sel_churn == "Churned":
        conds.append('"Churn" = true')
    elif sel_churn == "Active":
        conds.append('"Churn" = false')

    where = "WHERE " + " AND ".join(conds) if conds else ""
    df = execute_query(conn, f"SELECT * FROM customers {where} ORDER BY customer_id LIMIT 500")

    # ── Stats row ──
    total = len(df)
    churned = int(df["Churn"].sum()) if "Churn" in df.columns else 0
    m1, m2, m3 = st.columns(3)
    m1.metric("Filtered Rows", f"{total:,}")
    m2.metric("Churned", f"{churned:,}")
    m3.metric("Churn Rate", f"{churned / total * 100:.1f}%" if total > 0 else "N/A")

    st.divider()

    # ── Table ──
    st.dataframe(
        df,
        width="stretch",
        hide_index=True,
        height=500,
        column_config={
            "Churn": st.column_config.CheckboxColumn("Churned"),
            "Total day charge": st.column_config.NumberColumn("Day $", format="$%.2f"),
            "Total eve charge": st.column_config.NumberColumn("Eve $", format="$%.2f"),
            "Total night charge": st.column_config.NumberColumn("Night $", format="$%.2f"),
            "Total intl charge": st.column_config.NumberColumn("Intl $", format="$%.2f"),
        },
    )

    st.download_button("⬇️ Download Filtered Data", df.to_csv(index=False), "crm_data.csv", "text/csv", use_container_width=True)


# ═══════════════════════════════════════════════════════
# ROUTER
# ═══════════════════════════════════════════════════════

if page == "💬 Chat":
    render_chat_page()
elif page == "📊 Dashboard":
    render_dashboard_page()
elif page == "🔍 Data Explorer":
    render_data_explorer_page()
