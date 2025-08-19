"""Pydantic schemas for payments service."""

from pydantic import BaseModel, Field
from typing import Optional
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