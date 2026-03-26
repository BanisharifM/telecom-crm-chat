"""Pydantic models for chat API."""

from __future__ import annotations

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    question: str
    conversation_history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    success: bool
    question: str
    sql: str = ""
    explanation: str = ""
    columns: list[str] = []
    data: list[list] = []
    chart_type: str = "table"
    chart_config: dict = {}
    error: str = ""
    query_time_ms: float = 0
    rows_returned: int = 0
