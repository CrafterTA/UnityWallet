"""Analytics service API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..common.database import get_db
from ..common.auth import get_current_user
from .schema import (
    SpendingResponse, SpendingCategoryBreakdown, SpendingTrendAnalysis, SpendingAnomalyInsight,
    InsightsResponse, CreditScoreResponse, AlertsResponse
)
from .service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/spend", response_model=SpendingResponse)
async def get_spending_analytics(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get enhanced 30-day spending analytics with ML insights."""
    try:
        service = AnalyticsService(db)
        spending_data = service.get_30d_spending(str(current_user.id))
        return SpendingResponse(**spending_data)
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


@router.post("/classify")
async def classify_transaction(
    request: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Classify a transaction using ML."""
    try:
        service = AnalyticsService(db)
        result = service.classify_transaction(
            description=request.get('description', ''),
            mcc=request.get('mcc', ''),
            merchant_name=request.get('merchant_name', '')
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/credit-score/detailed")
async def get_detailed_credit_score(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed credit score with reason codes."""
    try:
        service = AnalyticsService(db)
        result = service.get_detailed_credit_score(str(current_user.id))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/anomalies")
async def detect_anomalies(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Detect spending anomalies for user."""
    try:
        service = AnalyticsService(db)
        result = service.detect_anomalies(str(current_user.id))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/classify-batch")
async def classify_transactions_batch(
    request: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Classify multiple transactions using ML."""
    try:
        transactions = request.get('transactions', [])
        if not transactions:
            raise HTTPException(status_code=400, detail="No transactions provided")
        
        service = AnalyticsService(db)
        results = service.classify_transactions_batch(transactions)
        return {'classifications': results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
