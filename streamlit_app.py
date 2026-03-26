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
from app.ui.charts import create_chart, CHART_CONFIG, CRM_COLORS
from app.ui.styles import CUSTOM_CSS

# ═══════════════════════════════════════════════════════
# Page Config (must be first Streamlit command)
# ═══════════════════════════════════════════════════════

st.set_page_config(
    page_title="TelecomCo CRM Chat",
    page_icon="📱",
    layout="wide",
    initial_sidebar_state="expanded",
    menu_items={
        "About": "# TelecomCo CRM Chat\nPowered by Claude + DuckDB",
    },
)

# Inject custom CSS
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)


# ═══════════════════════════════════════════════════════
# Initialize Resources (cached)
# ═══════════════════════════════════════════════════════

@st.cache_resource
def get_database():
    """Initialize DuckDB with CRM data (runs once)."""
    settings = get_settings()
    return init_database(settings.data_file)


@st.cache_resource
def get_llm_client():
    """Create Anthropic client (runs once)."""
    settings = get_settings()
    return create_client(settings)


@st.cache_data(ttl=3600)
def get_kpis() -> dict:
    """Fetch KPI metrics from the database."""
    conn = get_database()
    kpis = conn.execute("SELECT * FROM overall_kpis").fetchdf()
    row = kpis.iloc[0]
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
        # International plan churn comparison
        intl_stats = conn.execute("""
            SELECT "International plan",
                   SUM(total_customers) as total,
                   ROUND(SUM(total_customers * churn_rate_pct) / NULLIF(SUM(total_customers), 0), 1) as rate
            FROM plan_summary
            GROUP BY "International plan"
            ORDER BY rate DESC
        """).fetchdf()

        for _, row in intl_stats.iterrows():
            label = "International" if row["International plan"] == "Yes" else "Non-international"
            insights.append(
                f"{label} plan holders: **{row['rate']}%** churn rate "
                f"({int(row['total'])} customers)"
            )
    except Exception:
        pass

    try:
        # Service calls correlation
        svc = conn.execute("""
            SELECT
                ROUND(AVG(CASE WHEN "Churn" THEN "Customer service calls" END), 1) as churned_avg,
                ROUND(AVG(CASE WHEN NOT "Churn" THEN "Customer service calls" END), 1) as active_avg
            FROM customers
        """).fetchdf().iloc[0]
        insights.append(
            f"Churned customers averaged **{svc['churned_avg']}** service calls "
            f"vs **{svc['active_avg']}** for active customers"
        )
    except Exception:
        pass

    try:
        # Top churn state
        top_state = conn.execute("""
            SELECT "State", churn_rate_pct, total_customers
            FROM state_summary
            WHERE total_customers >= 30
            ORDER BY churn_rate_pct DESC
            LIMIT 1
        """).fetchdf().iloc[0]
        insights.append(
            f"Highest churn state: **{top_state['State']}** "
            f"at **{top_state['churn_rate_pct']}%** ({int(top_state['total_customers'])} customers)"
        )
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
    "Show distribution of customer service calls",
    "Average monthly bill in California",
    "Which area code has the highest churn?",
    "Show me a pie chart of churn",
]


# ═══════════════════════════════════════════════════════
# Sidebar
# ═══════════════════════════════════════════════════════

with st.sidebar:
    st.markdown("## 📱 TelecomCo CRM")
    st.caption("AI-Powered Data Assistant")
    st.divider()

    # Navigation
    page = st.radio(
        "Navigate",
        ["💬 Chat", "📊 Dashboard", "🔍 Data Explorer"],
        label_visibility="collapsed",
    )

    st.divider()

    # KPIs in sidebar
    try:
        kpis = get_kpis()
        st.markdown("### Dataset Overview")
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Customers", f"{kpis['total_customers']:,}")
        with col2:
            st.metric("Churned", f"{kpis['total_churned']:,}")
        st.metric("Churn Rate", f"{kpis['churn_rate']}%")
        st.metric("States", kpis["num_states"])
    except Exception:
        st.warning("Database not yet loaded")

    st.divider()

    # Example questions
    if page == "💬 Chat":
        st.markdown("### Try Asking")
        for q in EXAMPLE_QUESTIONS:
            if st.button(q, key=f"example_{q}", use_container_width=True):
                st.session_state.pending_question = q
                st.rerun()

    st.divider()
    st.caption("Powered by Claude + DuckDB + Plotly")
    st.caption("Built by Mahdi BanisharifDehkordi")


# ═══════════════════════════════════════════════════════
# Chat Page
# ═══════════════════════════════════════════════════════

def render_chat_page():
    """Render the main chat interface."""
    st.markdown("# 💬 Ask Your CRM Data")
    st.caption("Ask natural-language questions about your telecom customer data")

    # Display chat history
    for msg in st.session_state.messages:
        _render_message(msg)

    # Welcome message if no history
    if not st.session_state.messages:
        with st.chat_message("assistant", avatar="🤖"):
            st.markdown(
                "Hello! I'm your CRM data assistant. Ask me anything about your "
                "telecom customer data — churn rates, billing, service calls, and more.\n\n"
                "Try one of the example questions in the sidebar, or type your own below!"
            )

    # Handle pending question from sidebar buttons
    pending = st.session_state.pop("pending_question", None)
    prompt = st.chat_input("Ask a question about your CRM data...")

    question = pending or prompt
    if question:
        _handle_question(question)


def _handle_question(question: str):
    """Process a user question and display results."""
    # Add user message
    st.session_state.messages.append({"role": "user", "content": question})
    with st.chat_message("user", avatar="👤"):
        st.markdown(question)

    # Process with LLM + DuckDB
    with st.chat_message("assistant", avatar="🤖"):
        with st.status("Processing your question...", expanded=True) as status:
            st.write("🧠 Understanding your question...")

            try:
                conn = get_database()
                client = get_llm_client()
                settings = get_settings()

                result = process_question(
                    question=question,
                    client=client,
                    conn=conn,
                    settings=settings,
                    conversation_history=st.session_state.conversation_history,
                )

                if result.sql:
                    st.write("📝 Generated SQL query")
                    st.code(result.sql, language="sql")

                if result.success:
                    st.write(f"✅ Query returned {result.rows_returned} rows in {result.query_time_ms}ms")
                    status.update(label="Complete!", state="complete", expanded=False)
                else:
                    status.update(label="Error", state="error", expanded=False)

            except Exception as e:
                result = QueryResult(
                    success=False,
                    question=question,
                    error=f"An unexpected error occurred: {e}",
                )
                status.update(label="Error", state="error", expanded=False)

        # Display results
        if result.success:
            _render_success(result)

            # Update conversation history for context
            st.session_state.conversation_history.append(
                {"role": "user", "content": question}
            )
            st.session_state.conversation_history.append(
                {"role": "assistant", "content": result.explanation}
            )
        else:
            st.error(result.error)

        # Save message
        st.session_state.messages.append({
            "role": "assistant",
            "result": result,
        })


def _render_success(result: QueryResult):
    """Render a successful query result with explanation, table, and chart."""
    # Explanation
    st.markdown(result.explanation)

    # Chart
    if result.data is not None and not result.data.empty:
        fig = create_chart(result.data, result.chart_type, result.chart_config)
        if fig:
            st.plotly_chart(fig, width="stretch", config=CHART_CONFIG)

    # Data table
    if result.data is not None and not result.data.empty:
        with st.expander(f"📋 View Data ({result.rows_returned} rows)", expanded=result.chart_type == "table"):
            st.dataframe(
                result.data,
                width="stretch",
                hide_index=True,
            )

            # Download button
            csv = result.data.to_csv(index=False)
            st.download_button(
                "⬇️ Download CSV",
                csv,
                "query_results.csv",
                "text/csv",
                use_container_width=True,
            )

    # SQL expander
    if result.sql:
        with st.expander("🔍 View SQL Query"):
            st.code(result.sql, language="sql")

    # Query metadata
    st.markdown(
        f'<div class="query-meta">'
        f'<span>⏱️ {result.query_time_ms}ms</span>'
        f'<span>📊 {result.rows_returned} rows</span>'
        f'<span>📈 {result.chart_type}</span>'
        f'</div>',
        unsafe_allow_html=True,
    )


def _render_message(msg: dict):
    """Render a saved message from history."""
    if msg["role"] == "user":
        with st.chat_message("user", avatar="👤"):
            st.markdown(msg["content"])
    else:
        with st.chat_message("assistant", avatar="🤖"):
            result = msg.get("result")
            if result and result.success:
                _render_success(result)
            elif result:
                st.error(result.error)
            else:
                st.markdown(msg.get("content", ""))


# ═══════════════════════════════════════════════════════
# Dashboard Page
# ═══════════════════════════════════════════════════════

def render_dashboard_page():
    """Render the overview dashboard with KPIs and charts."""
    st.markdown("# 📊 CRM Dashboard")
    st.caption("At-a-glance overview of your telecom customer data")

    try:
        conn = get_database()
        kpis = get_kpis()
    except Exception as e:
        st.error(f"Failed to load data: {e}")
        return

    # KPI Row
    cols = st.columns(5)
    with cols[0]:
        st.metric("Total Customers", f"{kpis['total_customers']:,}")
    with cols[1]:
        st.metric("Churned", f"{kpis['total_churned']:,}")
    with cols[2]:
        st.metric("Churn Rate", f"{kpis['churn_rate']}%")
    with cols[3]:
        st.metric("States", kpis["num_states"])
    with cols[4]:
        st.metric("Avg Account Length", f"{kpis['avg_account_length']} days")

    st.divider()

    # Auto Insights
    insights = get_auto_insights()
    st.markdown("### 💡 Key Insights")
    for insight in insights:
        st.markdown(f"- {insight}")

    st.divider()

    # Charts row
    col_left, col_right = st.columns(2)

    with col_left:
        # Churn by state (top 15)
        state_df = execute_query(conn, """
            SELECT "State", churn_rate_pct, total_customers
            FROM state_summary
            ORDER BY churn_rate_pct DESC
            LIMIT 15
        """)
        fig = create_chart(state_df, "bar", {
            "x": "State", "y": "churn_rate_pct",
            "title": "Top 15 States by Churn Rate (%)"
        })
        if fig:
            st.plotly_chart(fig, width="stretch", config=CHART_CONFIG)

    with col_right:
        # Churn by international plan
        plan_df = execute_query(conn, """
            SELECT
                "International plan",
                SUM(total_customers) as customers,
                ROUND(SUM(total_customers * churn_rate_pct) / SUM(total_customers), 1) as churn_rate
            FROM plan_summary
            GROUP BY "International plan"
        """)
        fig = create_chart(plan_df, "bar", {
            "x": "International plan", "y": "churn_rate",
            "title": "Churn Rate by International Plan"
        })
        if fig:
            st.plotly_chart(fig, width="stretch", config=CHART_CONFIG)

    col_left2, col_right2 = st.columns(2)

    with col_left2:
        # Customer service calls distribution
        svc_df = execute_query(conn, """
            SELECT "Customer service calls", COUNT(*) as num_customers
            FROM customers
            GROUP BY "Customer service calls"
            ORDER BY "Customer service calls"
        """)
        fig = create_chart(svc_df, "bar", {
            "x": "Customer service calls", "y": "num_customers",
            "title": "Distribution of Customer Service Calls"
        })
        if fig:
            st.plotly_chart(fig, width="stretch", config=CHART_CONFIG)

    with col_right2:
        # Churn pie chart
        churn_df = execute_query(conn, """
            SELECT
                CASE WHEN "Churn" THEN 'Churned' ELSE 'Active' END as status,
                COUNT(*) as count
            FROM customers
            GROUP BY status
        """)
        fig = create_chart(churn_df, "pie", {
            "x": "status", "y": "count",
            "title": "Customer Churn Distribution"
        })
        if fig:
            st.plotly_chart(fig, width="stretch", config=CHART_CONFIG)


# ═══════════════════════════════════════════════════════
# Data Explorer Page
# ═══════════════════════════════════════════════════════

def render_data_explorer_page():
    """Render the interactive data explorer."""
    st.markdown("# 🔍 Data Explorer")
    st.caption("Browse and filter the raw CRM dataset")

    try:
        conn = get_database()
    except Exception as e:
        st.error(f"Failed to load data: {e}")
        return

    # Filters
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        states = ["All"] + sorted(
            execute_query(conn, 'SELECT DISTINCT "State" FROM customers ORDER BY "State"')["State"].tolist()
        )
        selected_state = st.selectbox("State", states)

    with col2:
        selected_intl = st.selectbox("International Plan", ["All", "Yes", "No"])

    with col3:
        selected_vm = st.selectbox("Voice Mail Plan", ["All", "Yes", "No"])

    with col4:
        selected_churn = st.selectbox("Churn Status", ["All", "Churned", "Active"])

    # Build filter query
    conditions = []
    if selected_state != "All":
        conditions.append(f""""State" = '{selected_state}'""")
    if selected_intl != "All":
        conditions.append(f""""International plan" = '{selected_intl}'""")
    if selected_vm != "All":
        conditions.append(f""""Voice mail plan" = '{selected_vm}'""")
    if selected_churn == "Churned":
        conditions.append('"Churn" = true')
    elif selected_churn == "Active":
        conditions.append('"Churn" = false')

    where = "WHERE " + " AND ".join(conditions) if conditions else ""
    query = f"SELECT * FROM customers {where} ORDER BY customer_id LIMIT 500"

    df = execute_query(conn, query)

    # Stats bar
    total = len(df)
    churned = df["Churn"].sum() if "Churn" in df.columns else 0
    cols = st.columns(3)
    cols[0].metric("Filtered Rows", f"{total:,}")
    cols[1].metric("Churned", f"{int(churned):,}")
    cols[2].metric("Churn Rate", f"{churned/total*100:.1f}%" if total > 0 else "N/A")

    st.divider()

    # Data table
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

    # Download
    csv = df.to_csv(index=False)
    st.download_button("⬇️ Download Filtered Data", csv, "crm_data.csv", "text/csv")


# ═══════════════════════════════════════════════════════
# Main Router
# ═══════════════════════════════════════════════════════

if page == "💬 Chat":
    render_chat_page()
elif page == "📊 Dashboard":
    render_dashboard_page()
elif page == "🔍 Data Explorer":
    render_data_explorer_page()
