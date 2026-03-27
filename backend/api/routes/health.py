"""Health check endpoint."""

from fastapi import APIRouter

from app.core.database import execute_query, execute_query_postgres
from backend.api.deps import get_db, get_app_settings

router = APIRouter()


@router.get("/health")
def health():
    settings = get_app_settings()
    if settings.database_backend == "postgres":
        df = execute_query_postgres("SELECT COUNT(*) as cnt FROM customers")
        rows = int(df.iloc[0]["cnt"])
    else:
        db = get_db()
        rows = db.execute("SELECT COUNT(*) FROM customers").fetchone()[0]

    return {
        "status": "ok",
        "db_rows": rows,
        "version": "2.0.0",
        "backend": settings.database_backend,
    }
