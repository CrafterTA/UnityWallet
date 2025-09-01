"""Quotes service API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from ..common.database import get_db
from ..common.auth import get_current_user
from ..common.middleware import get_correlation_id
from ..common.logging import get_logger
from .schema import (
    QuoteRequest,
    QuoteResponse, 
    QuotesListResponse,
    QuotesHealthResponse
)
from .service import QuotesService

router = APIRouter(prefix="/quotes", tags=["Quotes"])
logger = get_logger("quotes_router")


@router.get("/", response_model=QuotesListResponse)
async def get_all_quotes(
    correlation_id: str = Depends(get_correlation_id),
    db: Session = Depends(get_db)
):
    """Get all available currency pairs and exchange rates."""
    try:
        service = QuotesService(db)
        result = service.get_all_quotes(correlation_id=correlation_id)
        
        logger.info(f"Retrieved all quotes", extra={
            "currency_pairs_count": len(result.currency_pairs),
            "correlation_id": correlation_id
        })
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to get all quotes", extra={
            "error": str(e),
            "correlation_id": correlation_id
        })
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{from_asset}/{to_asset}")
async def get_exchange_rate(
    from_asset: str,
    to_asset: str,
    correlation_id: str = Depends(get_correlation_id),
    db: Session = Depends(get_db)
):
    """Get exchange rate for a specific currency pair."""
    try:
        # Validate currency codes
        from_asset = from_asset.upper()
        to_asset = to_asset.upper()
        
        service = QuotesService(db)
        rate = service.get_rate(from_asset, to_asset, correlation_id=correlation_id)
        
        if rate is None:
            logger.warning(f"Exchange rate not found", extra={
                "from_asset": from_asset,
                "to_asset": to_asset,
                "correlation_id": correlation_id
            })
            raise HTTPException(
                status_code=404, 
                detail=f"Exchange rate not available for {from_asset}/{to_asset}"
            )
        
        logger.info(f"Retrieved exchange rate", extra={
            "from_asset": from_asset,
            "to_asset": to_asset,
            "rate": str(rate),
            "correlation_id": correlation_id
        })
        
        return {
            "from_asset": from_asset,
            "to_asset": to_asset,
            "rate": rate,
            "timestamp": "2025-09-01T00:00:00Z"  # Will be updated by middleware
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
        
    except ValueError as e:
        logger.warning(f"Invalid exchange rate request", extra={
            "from_asset": from_asset,
            "to_asset": to_asset,
            "error": str(e),
            "correlation_id": correlation_id
        })
        raise HTTPException(status_code=400, detail=str(e))
        
    except Exception as e:
        logger.error(f"Failed to get exchange rate", extra={
            "from_asset": from_asset,
            "to_asset": to_asset,
            "error": str(e),
            "correlation_id": correlation_id
        })
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/calculate", response_model=QuoteResponse)
async def calculate_quote(
    request: QuoteRequest,
    current_user=Depends(get_current_user),
    correlation_id: str = Depends(get_correlation_id),
    db: Session = Depends(get_db)
):
    """Calculate exchange quote with fees for authenticated users."""
    try:
        service = QuotesService(db)
        quote = service.calculate_quote(
            request=request,
            user_id=str(current_user.id),
            correlation_id=correlation_id
        )
        
        logger.info(f"Generated quote for user", extra={
            "user_id": str(current_user.id),
            "quote_id": quote.quote_id,
            "from_asset": request.from_asset,
            "to_asset": request.to_asset,
            "from_amount": str(request.amount),
            "to_amount": str(quote.to_amount),
            "correlation_id": correlation_id
        })
        
        return quote
        
    except ValueError as e:
        logger.warning(f"Invalid quote calculation request", extra={
            "user_id": str(current_user.id),
            "from_asset": request.from_asset,
            "to_asset": request.to_asset,
            "error": str(e),
            "correlation_id": correlation_id
        })
        raise HTTPException(status_code=400, detail=str(e))
        
    except Exception as e:
        logger.error(f"Failed to calculate quote", extra={
            "user_id": str(current_user.id),
            "from_asset": request.from_asset,
            "to_asset": request.to_asset,
            "error": str(e),
            "correlation_id": correlation_id
        })
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/health", response_model=QuotesHealthResponse)
async def get_quotes_health(
    correlation_id: str = Depends(get_correlation_id),
    db: Session = Depends(get_db)
):
    """Get health status of quotes service and rate providers."""
    try:
        service = QuotesService(db)
        health = service.get_service_health(correlation_id=correlation_id)
        
        logger.info(f"Retrieved quotes service health", extra={
            "service_status": health.service_status,
            "cache_status": health.cache_status,
            "providers_count": len(health.providers),
            "total_currency_pairs": health.total_currency_pairs,
            "correlation_id": correlation_id
        })
        
        return health
        
    except Exception as e:
        logger.error(f"Failed to get quotes service health", extra={
            "error": str(e),
            "correlation_id": correlation_id
        })
        raise HTTPException(status_code=500, detail="Internal server error")