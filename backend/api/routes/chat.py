"""Chat endpoint — natural language to SQL query pipeline."""

from fastapi import APIRouter

from app.core.query_service import process_question
from backend.api.deps import get_app_settings, get_client, get_db
from backend.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(req: ChatRequest):
    """Process a natural language question and return data + chart config."""
    db = get_db()
    client = get_client()
    settings = get_app_settings()

    history = [{"role": m.role, "content": m.content} for m in req.conversation_history]

    result = process_question(
        question=req.question,
        client=client,
        conn=db,
        settings=settings,
        conversation_history=history,
    )

    columns: list[str] = []
    data: list[list] = []
    if result.data is not None and not result.data.empty:
        columns = result.data.columns.tolist()
        # Convert to JSON-safe types
        data = result.data.fillna("").values.tolist()
        for i, row in enumerate(data):
            data[i] = [
                v.item() if hasattr(v, "item") else v  # numpy -> python
                for v in row
            ]

    return ChatResponse(
        success=result.success,
        question=result.question,
        sql=result.sql,
        explanation=result.explanation,
        columns=columns,
        data=data,
        chart_type=result.chart_type,
        chart_config=result.chart_config,
        error=result.error,
        query_time_ms=result.query_time_ms,
        rows_returned=result.rows_returned,
    )
