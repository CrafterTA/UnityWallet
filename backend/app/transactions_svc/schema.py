"""Transaction service Pydantic schemas."""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from enum import Enum


class TransactionTypeFilter(str, Enum):
    """Transaction type filter options."""
    PAYMENT = "payment"
    SWAP = "swap" 
    EARN = "earn"
    BURN = "burn"
    P2P_TRANSFER = "p2p_transfer"


class TransactionStatusFilter(str, Enum):
    """Transaction status filter options."""
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"


class TransactionResponse(BaseModel):
    """Single transaction response model."""
    id: str
    tx_type: str
    asset_code: str
    amount: Decimal
    status: str
    created_at: datetime
    stellar_tx_hash: Optional[str] = None
    destination: Optional[str] = None
    memo: Optional[str] = None
    sell_asset: Optional[str] = None
    buy_asset: Optional[str] = None
    rate: Optional[Decimal] = None
    
    class Config:
        from_attributes = True


class PaginationMeta(BaseModel):
    """Pagination metadata."""
    page: int
    per_page: int
    total_count: int
    total_pages: int
    has_next: bool
    has_prev: bool


class TransactionListResponse(BaseModel):
    """Paginated transaction list response."""
    transactions: List[TransactionResponse]
    pagination: PaginationMeta


class TransactionSearchRequest(BaseModel):
    """Transaction search request parameters."""
    # Pagination
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    per_page: int = Field(default=20, ge=1, le=100, description="Items per page")
    
    # Filtering
    tx_type: Optional[TransactionTypeFilter] = Field(default=None, description="Filter by transaction type")
    status: Optional[TransactionStatusFilter] = Field(default=None, description="Filter by transaction status")
    asset_code: Optional[str] = Field(default=None, min_length=1, max_length=12, description="Filter by asset code")
    
    # Date range filtering
    from_date: Optional[datetime] = Field(default=None, description="Filter from date (inclusive)")
    to_date: Optional[datetime] = Field(default=None, description="Filter to date (inclusive)")
    
    # Amount range filtering  
    min_amount: Optional[Decimal] = Field(default=None, ge=0, description="Minimum amount filter")
    max_amount: Optional[Decimal] = Field(default=None, ge=0, description="Maximum amount filter")
    
    # Text search
    search_query: Optional[str] = Field(default=None, min_length=1, max_length=200, description="Search in memo, destination, or transaction hash")
    
    # Ordering
    sort_by: Optional[str] = Field(default="created_at", pattern="^(created_at|amount)$", description="Sort field")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$", description="Sort order")
    
    @validator('to_date')
    def validate_date_range(cls, v, values):
        """Ensure to_date is after from_date if both are provided."""
        if v and 'from_date' in values and values['from_date']:
            if v <= values['from_date']:
                raise ValueError('to_date must be after from_date')
        return v
    
    @validator('max_amount')
    def validate_amount_range(cls, v, values):
        """Ensure max_amount is greater than min_amount if both are provided."""
        if v and 'min_amount' in values and values['min_amount']:
            if v <= values['min_amount']:
                raise ValueError('max_amount must be greater than min_amount')
        return v