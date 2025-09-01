"""Quotes service business logic."""

import json
import uuid
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy.orm import Session

from ..common.redis_client import get_redis_client
from ..common.logging import get_logger
from ..common.audit import write_audit
from ..common.models import AuditAction, AuditStatus
from .schema import CurrencyPair, QuoteRequest, QuoteResponse, QuotesListResponse, RateProviderHealth, QuotesHealthResponse

logger = get_logger("quotes_service")


class RateProvider:
    """Base class for rate providers."""
    
    def __init__(self, name: str):
        self.name = name
        self.redis = get_redis_client()
    
    def get_rate(self, from_asset: str, to_asset: str) -> Optional[Decimal]:
        """Get exchange rate for currency pair."""
        raise NotImplementedError
    
    def get_all_rates(self) -> Dict[str, Dict[str, Decimal]]:
        """Get all available exchange rates."""
        raise NotImplementedError
    
    def is_healthy(self) -> bool:
        """Check if provider is healthy."""
        raise NotImplementedError


class StaticRateProvider(RateProvider):
    """Static rate provider for SYP/USD 1:1 conversion."""
    
    def __init__(self):
        super().__init__("static")
        self.rates = {
            "SYP": {"USD": Decimal("1.0")},
            "USD": {"SYP": Decimal("1.0")}
        }
    
    def get_rate(self, from_asset: str, to_asset: str) -> Optional[Decimal]:
        """Get static 1:1 rate for SYP/USD pair."""
        try:
            if from_asset == to_asset:
                return Decimal("1.0")
            
            return self.rates.get(from_asset, {}).get(to_asset)
        except Exception as e:
            logger.error(f"Error getting rate from static provider", extra={"error": str(e)})
            return None
    
    def get_all_rates(self) -> Dict[str, Dict[str, Decimal]]:
        """Get all static rates."""
        return self.rates.copy()
    
    def is_healthy(self) -> bool:
        """Static provider is always healthy."""
        return True


class QuotesService:
    """Service for currency exchange quotes and rates."""
    
    def __init__(self, db: Session):
        self.db = db
        self.redis = get_redis_client()
        self.providers = [StaticRateProvider()]
        self.fee_percentage = Decimal("0.001")  # 0.1% fee
        self.quote_ttl = 30  # Quote valid for 30 seconds
        self.cache_ttl = 300  # Cache rates for 5 minutes
    
    def get_all_quotes(self, correlation_id: Optional[str] = None) -> QuotesListResponse:
        """Get all available currency pairs and rates."""
        try:
            # Try to get from cache first
            cache_key = "quotes:all"
            cached_data = self.redis.redis.get(cache_key)
            
            if cached_data:
                logger.debug("Retrieved quotes from cache")
                data = json.loads(cached_data)
                
                # Convert decimal strings back to Decimal objects
                currency_pairs = []
                for pair_data in data["currency_pairs"]:
                    pair_data["rate"] = Decimal(pair_data["rate"])
                    pair_data["last_updated"] = datetime.fromisoformat(pair_data["last_updated"])
                    currency_pairs.append(CurrencyPair(**pair_data))
                
                return QuotesListResponse(
                    currency_pairs=currency_pairs,
                    last_updated=datetime.fromisoformat(data["last_updated"]),
                    provider_status=data["provider_status"]
                )
            
            # Get fresh rates from providers
            currency_pairs = []
            provider_status = {}
            current_time = datetime.utcnow()
            
            for provider in self.providers:
                try:
                    if provider.is_healthy():
                        rates = provider.get_all_rates()
                        provider_status[provider.name] = "healthy"
                        
                        for from_asset, to_rates in rates.items():
                            for to_asset, rate in to_rates.items():
                                currency_pairs.append(CurrencyPair(
                                    from_asset=from_asset,
                                    to_asset=to_asset,
                                    rate=rate,
                                    last_updated=current_time,
                                    provider=provider.name
                                ))
                    else:
                        provider_status[provider.name] = "unhealthy"
                        
                except Exception as e:
                    logger.error(f"Error getting rates from provider {provider.name}", extra={"error": str(e)})
                    provider_status[provider.name] = "error"
            
            response = QuotesListResponse(
                currency_pairs=currency_pairs,
                last_updated=current_time,
                provider_status=provider_status
            )
            
            # Cache the response
            cache_data = {
                "currency_pairs": [
                    {
                        **pair.dict(),
                        "rate": str(pair.rate),
                        "last_updated": pair.last_updated.isoformat()
                    } for pair in currency_pairs
                ],
                "last_updated": current_time.isoformat(),
                "provider_status": provider_status
            }
            
            self.redis.redis.setex(
                cache_key,
                self.cache_ttl,
                json.dumps(cache_data)
            )
            
            logger.info(f"Retrieved {len(currency_pairs)} currency pairs from providers")
            return response
            
        except Exception as e:
            logger.error(f"Error getting all quotes", extra={
                "error": str(e),
                "correlation_id": correlation_id
            })
            raise
    
    def get_rate(self, from_asset: str, to_asset: str, correlation_id: Optional[str] = None) -> Optional[Decimal]:
        """Get exchange rate for specific currency pair."""
        try:
            # Check cache first
            cache_key = f"quotes:{from_asset}/{to_asset}"
            cached_rate = self.redis.redis.get(cache_key)
            
            if cached_rate:
                return Decimal(cached_rate)
            
            # Get from providers
            for provider in self.providers:
                if provider.is_healthy():
                    rate = provider.get_rate(from_asset, to_asset)
                    if rate is not None:
                        # Cache the rate
                        self.redis.redis.setex(cache_key, self.cache_ttl, str(rate))
                        return rate
            
            logger.warning(f"No rate found for {from_asset}/{to_asset}")
            return None
            
        except Exception as e:
            logger.error(f"Error getting rate for {from_asset}/{to_asset}", extra={
                "error": str(e),
                "correlation_id": correlation_id
            })
            return None
    
    def calculate_quote(
        self, 
        request: QuoteRequest, 
        user_id: Optional[str] = None,
        correlation_id: Optional[str] = None
    ) -> QuoteResponse:
        """Calculate exchange quote with fees."""
        try:
            # Get exchange rate
            rate = self.get_rate(request.from_asset, request.to_asset)
            if rate is None:
                raise ValueError(f"Exchange rate not available for {request.from_asset}/{request.to_asset}")
            
            # Calculate amounts
            fee_amount = Decimal("0")
            if request.include_fees:
                fee_amount = (request.amount * self.fee_percentage).quantize(
                    Decimal("0.0000001"), rounding=ROUND_HALF_UP
                )
            
            # Amount after fee
            amount_after_fee = request.amount - fee_amount
            
            # Convert to target currency
            to_amount = (amount_after_fee * rate).quantize(
                Decimal("0.0000001"), rounding=ROUND_HALF_UP
            )
            
            # Generate quote
            quote_id = str(uuid.uuid4())
            current_time = datetime.utcnow()
            expires_at = current_time + timedelta(seconds=self.quote_ttl)
            
            quote = QuoteResponse(
                quote_id=quote_id,
                from_asset=request.from_asset,
                to_asset=request.to_asset,
                from_amount=request.amount,
                to_amount=to_amount,
                exchange_rate=rate,
                fee_amount=fee_amount,
                fee_percentage=self.fee_percentage,
                expires_at=expires_at,
                created_at=current_time,
                provider="static"  # Currently only static provider
            )
            
            # Cache the quote for potential execution
            quote_cache_key = f"quotes:quote_id:{quote_id}"
            quote_data = quote.dict()
            # Convert Decimal to string for JSON serialization
            for key, value in quote_data.items():
                if isinstance(value, Decimal):
                    quote_data[key] = str(value)
                elif isinstance(value, datetime):
                    quote_data[key] = value.isoformat()
            
            self.redis.redis.setex(
                quote_cache_key,
                self.quote_ttl,
                json.dumps(quote_data)
            )
            
            # Audit log
            if user_id:
                write_audit(
                    db=self.db,
                    action=AuditAction.CREATE,
                    resource="quote",
                    resource_id=quote_id,
                    status=AuditStatus.SUCCESS,
                    user_id=user_id,
                    request_id=correlation_id,
                    meta={
                        "from_asset": request.from_asset,
                        "to_asset": request.to_asset,
                        "from_amount": str(request.amount),
                        "to_amount": str(to_amount),
                        "rate": str(rate)
                    }
                )
            
            logger.info(f"Generated quote {quote_id}", extra={
                "quote_id": quote_id,
                "from_asset": request.from_asset,
                "to_asset": request.to_asset,
                "amount": str(request.amount),
                "user_id": user_id,
                "correlation_id": correlation_id
            })
            
            return quote
            
        except Exception as e:
            # Audit log for failed quote
            if user_id:
                write_audit(
                    db=self.db,
                    action=AuditAction.CREATE,
                    resource="quote",
                    resource_id=None,
                    status=AuditStatus.ERROR,
                    user_id=user_id,
                    request_id=correlation_id,
                    meta={
                        "error": str(e),
                        "from_asset": request.from_asset,
                        "to_asset": request.to_asset,
                        "amount": str(request.amount)
                    }
                )
            
            logger.error(f"Error calculating quote", extra={
                "error": str(e),
                "from_asset": request.from_asset,
                "to_asset": request.to_asset,
                "user_id": user_id,
                "correlation_id": correlation_id
            })
            raise
    
    def get_service_health(self, correlation_id: Optional[str] = None) -> QuotesHealthResponse:
        """Get health status of quotes service and providers."""
        try:
            provider_health = []
            healthy_providers = 0
            
            for provider in self.providers:
                try:
                    is_healthy = provider.is_healthy()
                    if is_healthy:
                        healthy_providers += 1
                        
                    provider_health.append(RateProviderHealth(
                        provider_name=provider.name,
                        status="healthy" if is_healthy else "unhealthy",
                        last_updated=datetime.utcnow(),
                        error_message=None
                    ))
                except Exception as e:
                    provider_health.append(RateProviderHealth(
                        provider_name=provider.name,
                        status="error",
                        last_updated=datetime.utcnow(),
                        error_message=str(e)
                    ))
            
            # Check Redis cache status
            try:
                self.redis.redis.ping()
                cache_status = "healthy"
            except Exception:
                cache_status = "unhealthy"
            
            # Overall service status
            if healthy_providers > 0 and cache_status == "healthy":
                service_status = "healthy"
            elif healthy_providers > 0:
                service_status = "degraded"
            else:
                service_status = "unhealthy"
            
            # Get total currency pairs
            try:
                quotes = self.get_all_quotes(correlation_id)
                total_pairs = len(quotes.currency_pairs)
                last_refresh = quotes.last_updated
            except Exception:
                total_pairs = 0
                last_refresh = datetime.utcnow()
            
            return QuotesHealthResponse(
                service_status=service_status,
                cache_status=cache_status,
                providers=provider_health,
                total_currency_pairs=total_pairs,
                last_refresh=last_refresh
            )
            
        except Exception as e:
            logger.error(f"Error getting service health", extra={
                "error": str(e),
                "correlation_id": correlation_id
            })
            raise