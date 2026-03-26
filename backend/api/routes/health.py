"""Health check endpoint."""

from fastapi import APIRouter

from backend.api.deps import get_db

router = APIRouter()


@router.get("/health")
def health():
    db = get_db()
    rows = db.execute("SELECT COUNT(*) FROM customers").fetchone()[0]
    return {"status": "ok", "db_rows": rows, "version": "1.0.0"}
