"""Pydantic schemas for analytics service."""

from pydantic import BaseModel
from typing import List
from decimal import Decimal


class SpendingResponse(BaseModel):
    """30-day spending analytics response."""
    last_30d_spend: Decimal
    
    class Config:
        json_encoders = {
            Decimal: str
        }


class InsightItem(BaseModel):
    """Individual insight item."""
    title: str
    value: str


class InsightsResponse(BaseModel):
    """Insights response."""
    insights: List[InsightItem]


class CreditScoreResponse(BaseModel):
    """Credit score response."""
    score: int


class AlertItem(BaseModel):
    """Individual alert item."""
    type: str
    message: str
    created_at: str


class AlertsResponse(BaseModel):
    """Alerts response."""
    alerts: List[AlertItem]