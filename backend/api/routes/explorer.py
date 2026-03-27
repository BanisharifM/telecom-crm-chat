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
