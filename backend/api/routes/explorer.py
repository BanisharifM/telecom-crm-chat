"""Data Explorer endpoints — filters, paginated data, CSV download."""

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
import io

from app.core.database import execute_query
from backend.api.deps import get_db
from backend.schemas.explorer import ExplorerResponse, FilterOptions

router = APIRouter(prefix="/explorer", tags=["explorer"])


@router.get("/filters", response_model=FilterOptions)
def filters():
    db = get_db()
    states = execute_query(db, 'SELECT DISTINCT "State" FROM customers ORDER BY "State"')["State"].tolist()
    return FilterOptions(states=states)


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
    db = get_db()
    where = _build_where(state, international_plan, voice_mail_plan, churn)
    offset = (page - 1) * page_size

    df = execute_query(db, f"SELECT * FROM customers {where} ORDER BY customer_id LIMIT {page_size} OFFSET {offset}")
    count_row = db.execute(f"SELECT COUNT(*), SUM(CASE WHEN \"Churn\" THEN 1 ELSE 0 END) FROM customers {where}").fetchone()
    filtered = int(count_row[0])
    churned = int(count_row[1] or 0)
    total = db.execute("SELECT COUNT(*) FROM customers").fetchone()[0]

    return ExplorerResponse(
        columns=df.columns.tolist(),
        data=df.fillna("").values.tolist(),
        total_rows=int(total),
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
    db = get_db()
    where = _build_where(state, international_plan, voice_mail_plan, churn)
    df = execute_query(db, f"SELECT * FROM customers {where} ORDER BY customer_id")

    buffer = io.StringIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=crm_data.csv"},
    )
