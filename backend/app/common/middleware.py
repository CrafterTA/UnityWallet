"""Middleware for CORS, correlation ID, and rate limiting"""
from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import time
import redis
from typing import Callable
from .config import settings
from .logging import set_correlation_id, get_correlation_id, generate_correlation_id
from .database import get_redis
import logging

logger = logging.getLogger(__name__)

class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Middleware to handle correlation IDs"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get or generate correlation ID
        correlation_id = request.headers.get("X-Correlation-ID") or generate_correlation_id()
        
        # Set in context
        set_correlation_id(correlation_id)
        
        # Process request
        response = await call_next(request)
        
        # Add correlation ID to response headers
        response.headers["X-Correlation-ID"] = correlation_id
        
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using Redis"""
    
    def __init__(self, app):
        super().__init__(app)
        self.redis_client = get_redis()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)
        
        # Determine rate limit identifier
        api_key = request.headers.get("X-Api-Key")
        user_id = getattr(request.state, "user_id", None)  # Set by auth
        client_ip = request.client.host if request.client else "unknown"
        
        # Use API key, then user ID, then IP
        identifier = api_key or str(user_id) if user_id else client_ip
        
        # Create rate limit key
        path = request.url.path
        bucket = int(time.time()) // settings.RATE_LIMIT_WINDOW
        rate_key = f"rate:{identifier}:{path}:{bucket}"
        
        try:
            # Get current count
            current_count = self.redis_client.get(rate_key)
            
            if current_count is None:
                # First request in this window
                self.redis_client.setex(rate_key, settings.RATE_LIMIT_WINDOW, 1)
                current_count = 1
            else:
                current_count = int(current_count)
                
                if current_count >= settings.RATE_LIMIT_REQUESTS:
                    logger.warning(f"Rate limit exceeded for {identifier} on {path}")
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Rate limit exceeded"
                    )
                
                # Increment count
                self.redis_client.incr(rate_key)
                current_count += 1
            
            # Add rate limit headers to response
            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(settings.RATE_LIMIT_REQUESTS)
            response.headers["X-RateLimit-Remaining"] = str(max(0, settings.RATE_LIMIT_REQUESTS - current_count))
            response.headers["X-RateLimit-Reset"] = str((bucket + 1) * settings.RATE_LIMIT_WINDOW)
            
            return response
            
        except redis.RedisError as e:
            logger.error(f"Redis error in rate limiting: {e}")
            # If Redis fails, allow the request to proceed
            return await call_next(request)

def setup_middleware(app: FastAPI):
    """Setup all middleware for the FastAPI application"""
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Correlation ID middleware
    app.add_middleware(CorrelationIdMiddleware)
    
    # Rate limiting middleware
    app.add_middleware(RateLimitMiddleware)