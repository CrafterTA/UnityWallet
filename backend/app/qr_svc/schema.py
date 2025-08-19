"""QR code service schemas"""
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from uuid import UUID
from datetime import datetime


class QRCreateRequest(BaseModel):
    asset_code: str
    amount: Decimal


class QRCreateResponse(BaseModel):
    qr_id: str
    asset_code: str
    amount: Decimal
    created_at: datetime
    expires_at: datetime


class QRPayRequest(BaseModel):
    qr_id: str


class QRPayResponse(BaseModel):
    success: bool
    transaction_id: Optional[UUID] = None
    message: str
    duplicate_ignored: Optional[bool] = False