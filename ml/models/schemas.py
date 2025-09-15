"""
Pydantic models for ML service API
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

class TransactionType(str, Enum):
    PAYMENT = "payment"
    SWAP = "swap"
    ONBOARD = "onboard"
    CREATE_ACCOUNT = "create_account"
    CHANGE_TRUST = "change_trust"

class AssetInfo(BaseModel):
    code: str
    issuer: Optional[str] = None
    
    def __str__(self):
        return f"{self.code}:{self.issuer}" if self.issuer else self.code

class TransactionRecord(BaseModel):
    """Cấu trúc dữ liệu giao dịch để phân tích"""
    hash: str
    account: str  # public key
    transaction_type: TransactionType
    amount: Optional[float] = None
    asset: Optional[AssetInfo] = None
    destination: Optional[str] = None
    source: Optional[str] = None
    fee: float
    timestamp: datetime
    success: bool = True
    memo: Optional[str] = None

class WalletBalance(BaseModel):
    """Thông tin số dư ví tại một thời điểm"""
    account: str
    asset: AssetInfo
    balance: float
    timestamp: datetime

class FeatureEngineering(BaseModel):
    """Các tính năng được tính toán từ lịch sử giao dịch"""
    account: str
    period_start: datetime
    period_end: datetime
    
    # Số giao dịch
    total_transactions: int
    transactions_per_month: float
    payment_count: int
    swap_count: int
    
    # Biến động số dư
    balance_volatility: Dict[str, float]  # asset -> volatility
    max_balance: Dict[str, float]
    min_balance: Dict[str, float]
    avg_balance: Dict[str, float]
    
    # Nợ/Tài sản (debt to asset ratio)
    debt_to_asset_ratio: Optional[float] = None
    
    # Tần suất hoàn tiền (reverse transaction pattern)
    refund_frequency: float
    refund_amount_ratio: float
    
    # Patterns
    peak_transaction_hours: List[int]  # giờ có nhiều giao dịch nhất
    frequent_destinations: List[str]   # địa chỉ gửi tiền thường xuyên
    
    # Risk metrics
    large_transaction_count: int       # số giao dịch lớn
    large_transaction_threshold: float # ngưỡng giao dịch lớn
    
class AnomalyDetection(BaseModel):
    """Kết quả phát hiện bất thường"""
    account: str
    timestamp: datetime
    anomaly_type: str
    confidence_score: float  # 0-1
    description: str
    transaction_hash: Optional[str] = None
    recommended_action: str

class AnalyticsRequest(BaseModel):
    """Request để phân tích wallet"""
    public_key: str
    days_back: Optional[int] = 90
    include_balance_history: bool = True

class ChatbotRequest(BaseModel):
    """Request cho chatbot"""
    public_key: str
    message: str
    context: Optional[Dict[str, Any]] = None

class ChatbotResponse(BaseModel):
    """Response từ chatbot"""
    response: str
    suggestions: Optional[List[str]] = None
    data: Optional[Dict[str, Any]] = None

class TimeSeriesData(BaseModel):
    """Dữ liệu time series cho charts"""
    timestamps: List[datetime]
    values: List[float]
    label: str

class AnalyticsResponse(BaseModel):
    """Response chứa tất cả analytics data"""
    account: str
    features: FeatureEngineering
    anomalies: List[AnomalyDetection]
    balance_history: Dict[str, TimeSeriesData]  # asset -> time series
    transaction_summary: Dict[str, Any]
