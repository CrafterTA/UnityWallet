"""Pydantic schemas for payments service."""

from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal


class QRCreateRequest(BaseModel):
    """QR code creation request."""
    asset_code: str = Field(..., description="Asset code")
    amount: Decimal = Field(..., gt=0, description="Payment amount")
    memo: Optional[str] = Field(None, max_length=28, description="Payment memo")


class QRCreateResponse(BaseModel):
    """QR code creation response."""
    qr_id: str
    payload: dict


class QRPayRequest(BaseModel):
    """QR code payment request."""
    qr_id: str = Field(..., description="QR code ID")


class QRPayResponse(BaseModel):
    """QR code payment response."""
    ok: bool
    paid: Optional[bool] = None
    duplicate_ignored: Optional[bool] = None


class PaymentRequest(BaseModel):
    """Payment request schema."""
    destination: str = Field(..., description="Stellar address of recipient")
    asset_code: str = Field(..., description="Asset code (SYP, USD)")
    amount: Decimal = Field(..., gt=0, description="Amount to send")
    memo: Optional[str] = Field(None, max_length=28, description="Payment memo")


class PaymentResponse(BaseModel):
    """Payment response schema."""
    ok: bool
    tx_id: str
    stellar: dict


class P2PTransferRequest(BaseModel):
    """P2P transfer request between wallet users."""
    recipient_username: str = Field(..., description="Username of recipient")
    asset_code: str = Field(..., description="Asset code (SYP, USD)")
    amount: Decimal = Field(..., gt=0, description="Amount to transfer")
    memo: Optional[str] = Field(None, max_length=100, description="Transfer memo")


class P2PTransferResponse(BaseModel):
    """P2P transfer response."""
    ok: bool
    transfer_id: str
    recipient_username: str
    amount: Decimal
    asset_code: str
    status: str
    
    class Config:
        json_encoders = {
            Decimal: str
        }


class PaymentHistoryFilter(BaseModel):
    """Payment history filter parameters."""
    asset_code: Optional[str] = Field(None, description="Filter by asset code")
    transaction_type: Optional[str] = Field(None, description="Filter by transaction type")
    limit: int = Field(default=50, ge=1, le=100, description="Number of records to return")
    offset: int = Field(default=0, ge=0, description="Number of records to skip")
    start_date: Optional[str] = Field(None, description="Start date (ISO format)")
    end_date: Optional[str] = Field(None, description="End date (ISO format)")


class PaymentHistoryItem(BaseModel):
    """Single payment history item."""
    id: str
    user_id: str
    tx_type: str
    asset_code: str
    amount: Decimal
    status: str
    destination: Optional[str] = None
    memo: Optional[str] = None
    created_at: str
    
    class Config:
        json_encoders = {
            Decimal: str
        }


class PaymentHistoryResponse(BaseModel):
    """Payment history response with pagination."""
    payments: List[PaymentHistoryItem]
    total: int
    limit: int
    offset: int


class PaymentStatusResponse(BaseModel):
    """Payment status response."""
    id: str
    tx_type: str
    asset_code: str
    amount: Decimal
    status: str
    destination: Optional[str] = None
    memo: Optional[str] = None
    created_at: str
    updated_at: str
    
    class Config:
        json_encoders = {
            Decimal: str
        }


class PaymentStatusUpdate(BaseModel):
    """Payment status update request (admin only)."""
    status: str = Field(..., description="New payment status")
    reason: Optional[str] = Field(None, description="Reason for status change")