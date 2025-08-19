"""Analytics service API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..common.database import get_db
from ..common.auth import get_current_user
from .schema import SpendingResponse, InsightsResponse, CreditScoreResponse, AlertsResponse
from .service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/spend", response_model=SpendingResponse)
async def get_spending_analytics(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get 30-day spending analytics."""
    try:
        service = AnalyticsService(db)
        spending = service.get_30d_spending(str(current_user.id))
        return SpendingResponse(last_30d_spend=spending)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights", response_model=InsightsResponse)
async def get_insights(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user insights and recommendations."""
    try:
        service = AnalyticsService(db)
        insights = service.get_insights(str(current_user.id))
        return InsightsResponse(insights=insights)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/credit-score", response_model=CreditScoreResponse)
async def get_credit_score(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's credit score."""
    try:
        service = AnalyticsService(db)
        score = service.get_credit_score(str(current_user.id))
        return CreditScoreResponse(score=score)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts", response_model=AlertsResponse)
async def get_alerts(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user alerts and notifications."""
    try:
        service = AnalyticsService(db)
        alerts = service.get_alerts(str(current_user.id))
        return AlertsResponse(alerts=alerts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))