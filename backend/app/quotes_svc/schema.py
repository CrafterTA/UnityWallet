"""Quotes service Pydantic schemas."""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict
from datetime import datetime
from decimal import Decimal
from enum import Enum


class CurrencyPair(BaseModel):
    """Currency pair representation."""
    from_asset: str = Field(..., min_length=3, max_length=12, description="Source currency code")
    to_asset: str = Field(..., min_length=3, max_length=12, description="Target currency code")
    rate: Decimal = Field(..., gt=0, description="Exchange rate")
    last_updated: datetime = Field(..., description="When rate was last updated")
    provider: str = Field(..., description="Rate provider name")


class QuoteRequest(BaseModel):
    """Request model for calculating exchange quotes."""
    from_asset: str = Field(..., min_length=3, max_length=12, description="Source currency code")
    to_asset: str = Field(..., min_length=3, max_length=12, description="Target currency code")
    amount: Decimal = Field(..., gt=0, description="Amount to exchange")
    include_fees: bool = Field(default=True, description="Include transaction fees in calculation")
    
    @validator('from_asset', 'to_asset')
    def validate_currency_codes(cls, v):
        """Ensure currency codes are uppercase."""
        return v.upper()


class QuoteResponse(BaseModel):
    """Response model for exchange quotes."""
    quote_id: str = Field(..., description="Unique quote identifier")
    from_asset: str = Field(..., description="Source currency code")
    to_asset: str = Field(..., description="Target currency code")
    from_amount: Decimal = Field(..., description="Input amount")
    to_amount: Decimal = Field(..., description="Output amount after conversion")
    exchange_rate: Decimal = Field(..., description="Exchange rate used")
    fee_amount: Decimal = Field(..., description="Fee amount in source currency")
    fee_percentage: Decimal = Field(..., description="Fee as percentage")
    expires_at: datetime = Field(..., description="Quote expiration time")
    created_at: datetime = Field(..., description="Quote creation time")
    provider: str = Field(..., description="Rate provider used")


class QuotesListResponse(BaseModel):
    """Response model for listing all available quotes."""
    currency_pairs: List[CurrencyPair] = Field(..., description="Available currency pairs")
    last_updated: datetime = Field(..., description="When quotes were last refreshed")
    provider_status: Dict[str, str] = Field(..., description="Status of each rate provider")


class RateProviderHealth(BaseModel):
    """Health status of rate providers."""
    provider_name: str = Field(..., description="Name of the rate provider")
    status: str = Field(..., description="Provider status (healthy, degraded, unavailable)")
    last_updated: datetime = Field(..., description="Last successful rate update")
    error_message: Optional[str] = Field(None, description="Error message if provider is down")


class QuotesHealthResponse(BaseModel):
    """Response model for quotes service health check."""
    service_status: str = Field(..., description="Overall service status")
    cache_status: str = Field(..., description="Redis cache status")
    providers: List[RateProviderHealth] = Field(..., description="Individual provider health")
    total_currency_pairs: int = Field(..., description="Number of available currency pairs")
    last_refresh: datetime = Field(..., description="Last cache refresh time")