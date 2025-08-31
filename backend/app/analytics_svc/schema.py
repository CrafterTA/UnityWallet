"""Pydantic schemas for analytics service."""

from pydantic import BaseModel
from typing import List
from decimal import Decimal


class SpendingCategoryBreakdown(BaseModel):
    """Spending breakdown by category."""
    category: str
    amount: Decimal
    percentage: float
    transaction_count: int
    avg_amount: Decimal
    
    class Config:
        json_encoders = {
            Decimal: str
        }


class SpendingTrendAnalysis(BaseModel):
    """Spending trend analysis."""
    period: str  # e.g., "week1", "week2", etc.
    amount: Decimal
    change_from_previous: float  # percentage change
    
    class Config:
        json_encoders = {
            Decimal: str
        }


class SpendingAnomalyInsight(BaseModel):
    """Anomaly insights in spending."""
    type: str
    description: str
    severity: str
    detected_count: int


class SpendingResponse(BaseModel):
    """Enhanced 30-day spending analytics response with ML insights."""
    # Backward compatibility - keep original field
    last_30d_spend: Decimal
    
    # ML-powered enhancements
    category_breakdown: List[SpendingCategoryBreakdown] = []
    trend_analysis: List[SpendingTrendAnalysis] = []
    anomaly_insights: List[SpendingAnomalyInsight] = []
    
    # Summary metrics
    avg_transaction_amount: Decimal = Decimal("0")
    total_transactions: int = 0
    most_active_category: str = "Others"
    spending_pattern_score: float = 0.0  # 0-1 score for spending regularity
    anomaly_rate: float = 0.0  # percentage of transactions flagged as anomalous
    
    # Comparison insights
    vs_previous_30d: float = 0.0  # percentage change from previous 30 days
    vs_user_average: float = 0.0  # percentage vs user's historical average
    
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


class TransactionClassificationRequest(BaseModel):
    """Request for transaction classification."""
    description: str
    mcc: str = ""
    merchant_name: str = ""


class TransactionClassificationResponse(BaseModel):
    """Response for transaction classification."""
    category: str
    confidence: float
    method: str


class TransactionBatchRequest(BaseModel):
    """Request for batch transaction classification."""
    transactions: List[dict]


class TransactionBatchResponse(BaseModel):
    """Response for batch transaction classification."""
    classifications: List[TransactionClassificationResponse]


class DetailedCreditScoreResponse(BaseModel):
    """Detailed credit score response with reason codes."""
    credit_score: int
    probability: float = None
    grade: str
    reason_codes: List[dict] = []
    score_range: tuple = None
    generated_at: str = None
    model_version: str = None


class AnomalyDetectionResponse(BaseModel):
    """Response for anomaly detection."""
    anomalies: List[dict]
    total_checked: int
    anomaly_rate: float = None
    detected_at: str = None
