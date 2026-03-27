"""Data Explorer endpoints — filters, paginated data, CSV download."""

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
import io

from app.core.database import execute_query, execute_query_postgres
from backend.api.deps import get_db, get_app_settings
from backend.schemas.explorer import ExplorerResponse, FilterOptions

router = APIRouter(prefix="/explorer", tags=["explorer"])


def _run_query(sql: str):
    settings = get_app_settings()
    if settings.database_backend == "postgres":
        return execute_query_postgres(sql)
    return execute_query(get_db(), sql)


@router.get("/filters", response_model=FilterOptions)
def filters():
    df = _run_query('SELECT DISTINCT "State" FROM customers ORDER BY "State"')
    return FilterOptions(states=df["State"].tolist())


def _build_where(state: str, intl: str, vm: str, churn: str) -> str:
    conds = []
    if state != "All":
        conds.append(f""""State" = '{state}'""")
    if intl != "All":
        conds.append(f""""International plan" = '{intl}'""")
    if vm != "All":
        conds.append(f""""Voice mail plan" = '{vm}'""")
    if churn == "Churned":
        conds.append('"Churn" = true')
    elif churn == "Active":
        conds.append('"Churn" = false')
    return "WHERE " + " AND ".join(conds) if conds else ""


@router.get("/data", response_model=ExplorerResponse)
def data(
    state: str = Query("All"),
    international_plan: str = Query("All"),
    voice_mail_plan: str = Query("All"),
    churn: str = Query("All"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=10, le=200),
):
    where = _build_where(state, international_plan, voice_mail_plan, churn)
    offset = (page - 1) * page_size

    df = _run_query(f"SELECT * FROM customers {where} ORDER BY customer_id LIMIT {page_size} OFFSET {offset}")
    count_df = _run_query(f'SELECT COUNT(*) as cnt, SUM(CASE WHEN "Churn" THEN 1 ELSE 0 END) as churned FROM customers {where}')
    total_df = _run_query("SELECT COUNT(*) as cnt FROM customers")

    filtered = int(count_df.iloc[0]["cnt"])
    churned = int(count_df.iloc[0]["churned"] or 0)
    total = int(total_df.iloc[0]["cnt"])

    return ExplorerResponse(
        columns=df.columns.tolist(),
        data=df.fillna("").values.tolist(),
        total_rows=total,
        filtered_rows=filtered,
        churned=churned,
        churn_rate=round(churned / filtered * 100, 1) if filtered > 0 else 0,
    )


def _calculate_health_score(record: dict) -> dict:
    """Calculate customer health score (0-100) with risk factors."""
    score = 100
    factors = []

    svc_calls = record.get("Customer service calls", 0)
    if svc_calls >= 5:
        score -= 45; factors.append(f"{svc_calls} service calls (critical - 3x+ churn rate)")
    elif svc_calls == 4:
        score -= 30; factors.append(f"{svc_calls} service calls (high risk)")
    elif svc_calls >= 2:
        score -= 10; factors.append(f"{svc_calls} service calls")

    if record.get("International plan") == "Yes":
        score -= 20; factors.append("International plan holder (42% churn rate vs 11%)")

    total_charge = sum(
        float(record.get(f"Total {p} charge", 0))
        for p in ["day", "eve", "night", "intl"]
    )
    if total_charge > 70:
        score -= 15; factors.append(f"High total charges (${total_charge:.2f})")

    if record.get("Account length", 999) < 30:
        score -= 10; factors.append("New customer (< 30 days)")

    if record.get("Voice mail plan") == "No":
        score -= 5; factors.append("No voicemail plan")

    if record.get("Churn"):
        score -= 30; factors.append("Customer has already churned")

    score = max(0, min(100, score))

    if score >= 70: label, color = "Healthy", "green"
    elif score >= 40: label, color = "At Risk", "yellow"
    else: label, color = "Critical", "red"

    return {"score": score, "label": label, "color": color, "factors": factors}


@router.get("/customer/{customer_id}")
def customer_detail(customer_id: int):
    """Get customer record with health score."""
    df = _run_query(f'SELECT * FROM customers WHERE customer_id = {customer_id}')
    if df.empty:
        return {"found": False, "record": None, "health": None}

    record = {col: (val.item() if hasattr(val, 'item') else val) for col, val in zip(df.columns, df.iloc[0])}
    health = _calculate_health_score(record)

    return {
        "found": True,
        "record": record,
        "health": health,
    }


@router.get("/download")
def download(
    state: str = Query("All"),
    international_plan: str = Query("All"),
    voice_mail_plan: str = Query("All"),
    churn: str = Query("All"),
):
    where = _build_where(state, international_plan, voice_mail_plan, churn)
    df = _run_query(f"SELECT * FROM customers {where} ORDER BY customer_id")

    buffer = io.StringIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=crm_data.csv"},
    )
