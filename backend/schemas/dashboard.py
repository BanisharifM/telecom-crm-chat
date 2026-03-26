"""Pydantic models for dashboard API."""

from __future__ import annotations

from pydantic import BaseModel


class KPIResponse(BaseModel):
    total_customers: int
    total_churned: int
    churn_rate: float
    num_states: int
    avg_account_length: float


class InsightsResponse(BaseModel):
    insights: list[str]


class ChartData(BaseModel):
    id: str
    title: str
    chart_type: str
    columns: list[str]
    data: list[list]
    chart_config: dict


class ChartsResponse(BaseModel):
    charts: list[ChartData]
