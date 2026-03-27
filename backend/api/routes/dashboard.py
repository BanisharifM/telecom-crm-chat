"""Dashboard endpoints — KPIs, insights, and chart data."""

from fastapi import APIRouter

from app.core.database import execute_query, execute_query_postgres
from backend.api.deps import get_db, get_app_settings
from backend.schemas.dashboard import ChartData, ChartsResponse, InsightsResponse, KPIResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _run_query(sql: str):
    """Execute query using the configured backend."""
    settings = get_app_settings()
    if settings.database_backend == "postgres":
        return execute_query_postgres(sql)
    return execute_query(get_db(), sql)


@router.get("/kpis", response_model=KPIResponse)
def kpis():
    df = _run_query("SELECT * FROM overall_kpis")
    row = df.iloc[0]
    return KPIResponse(
        total_customers=int(float(row["total_customers"])),
        total_churned=int(float(row["total_churned"])),
        churn_rate=round(float(row["churn_rate_pct"]), 2),
        num_states=int(float(row["num_states"])),
        avg_account_length=round(float(row["avg_account_length"]), 1),
    )


@router.get("/insights", response_model=InsightsResponse)
def insights():
    results: list[str] = []

    try:
        df = _run_query("""
            SELECT "International plan",
                   SUM(total_customers) as total,
                   ROUND((SUM(total_customers * churn_rate_pct) / NULLIF(SUM(total_customers), 0))::numeric, 1) as rate
            FROM plan_summary GROUP BY "International plan" ORDER BY rate DESC
        """)
        for _, row in df.iterrows():
            label = "International" if row["International plan"] == "Yes" else "Non-international"
            results.append(f"{label} plan holders: {row['rate']}% churn rate ({int(row['total'])} customers)")
    except Exception:
        pass

    try:
        df = _run_query("""
            SELECT ROUND(AVG(CASE WHEN "Churn" THEN "Customer service calls" END)::numeric, 1) as c,
                   ROUND(AVG(CASE WHEN NOT "Churn" THEN "Customer service calls" END)::numeric, 1) as a
            FROM customers
        """)
        row = df.iloc[0]
        results.append(f"Churned customers averaged {row['c']} service calls vs {row['a']} for active")
    except Exception:
        pass

    try:
        df = _run_query("""
            SELECT "State", churn_rate_pct, total_customers FROM state_summary
            WHERE total_customers >= 30 ORDER BY churn_rate_pct DESC LIMIT 1
        """)
        row = df.iloc[0]
        results.append(f"Highest churn state: {row['State']} at {row['churn_rate_pct']}% ({int(row['total_customers'])} customers)")
    except Exception:
        pass

    return InsightsResponse(insights=results)


def _df_to_chart(df, chart_id: str, title: str, chart_type: str, config: dict) -> ChartData:
    return ChartData(
        id=chart_id, title=title, chart_type=chart_type,
        columns=df.columns.tolist(),
        data=df.fillna("").values.tolist(),
        chart_config=config,
    )


@router.get("/charts", response_model=ChartsResponse)
def charts():
    result: list[ChartData] = []

    df = _run_query('SELECT "State", churn_rate_pct, total_customers FROM state_summary ORDER BY churn_rate_pct DESC LIMIT 15')
    result.append(_df_to_chart(df, "state_churn", "Top 15 States by Churn Rate (%)", "bar", {"x": "State", "y": "churn_rate_pct"}))

    df = _run_query("""
        SELECT "International plan", SUM(total_customers) as customers,
               ROUND((SUM(total_customers * churn_rate_pct) / SUM(total_customers))::numeric, 1) as churn_rate
        FROM plan_summary GROUP BY "International plan"
    """)
    result.append(_df_to_chart(df, "intl_churn", "Churn Rate by International Plan", "bar", {"x": "International plan", "y": "churn_rate"}))

    df = _run_query("""
        SELECT "Customer service calls", COUNT(*) as num_customers FROM customers
        GROUP BY "Customer service calls" ORDER BY "Customer service calls"
    """)
    result.append(_df_to_chart(df, "svc_dist", "Customer Service Calls Distribution", "bar", {"x": "Customer service calls", "y": "num_customers"}))

    df = _run_query("""
        SELECT CASE WHEN "Churn" THEN 'Churned' ELSE 'Active' END as status,
               COUNT(*) as count FROM customers GROUP BY status
    """)
    result.append(_df_to_chart(df, "churn_pie", "Customer Churn Breakdown", "pie", {"x": "status", "y": "count"}))

    return ChartsResponse(charts=result)
