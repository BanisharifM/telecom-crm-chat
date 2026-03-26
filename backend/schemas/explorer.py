"""Pydantic models for data explorer API."""

from __future__ import annotations

from pydantic import BaseModel


class FilterOptions(BaseModel):
    states: list[str]
    international_plans: list[str] = ["Yes", "No"]
    voice_mail_plans: list[str] = ["Yes", "No"]
    churn_statuses: list[str] = ["All", "Churned", "Active"]


class ExplorerResponse(BaseModel):
    columns: list[str]
    data: list[list]
    total_rows: int
    filtered_rows: int
    churned: int
    churn_rate: float
