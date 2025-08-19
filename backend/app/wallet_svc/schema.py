"""Pydantic schemas for wallet service."""

from pydantic import BaseModel, Field, validator
from typing import List, Optional
from decimal import Decimal
import uuid


class BalanceResponse(BaseModel):
    """Balance information response."""
    asset_code: str
    amount: Decimal
    
    class Config:
        json_encoders = {
            Decimal: str
        }


class BalancesResponse(BaseModel):
    """Balances list response."""
    balances: List[BalanceResponse]


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
    
    
class SwapRequest(BaseModel):
    """Swap request schema."""
    sell_asset: str = Field(..., description="Asset to sell")
    buy_asset: str = Field(..., description="Asset to buy") 
    amount: Decimal = Field(..., gt=0, description="Amount to swap")


class SwapResponse(BaseModel):
    """Swap response schema."""
    ok: bool
    swapped: Decimal
    rate: Decimal
    
    class Config:
        json_encoders = {
            Decimal: str
        }