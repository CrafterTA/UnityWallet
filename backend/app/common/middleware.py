"""Middleware for CORS, correlation ID, and rate limiting"""
from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import time
import uuid
from typing import Callable
from .config import settings
from .logging import set_correlation_id, get_correlation_id, log_api_request, get_logger
from .redis_client import get_redis_client
import logging

logger = get_logger("middleware")

class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Middleware to handle correlation IDs"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get or generate correlation ID
        correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        
        # Store in request state
        request.state.correlation_id = correlation_id
        
        # Set in logging context
        set_correlation_id(correlation_id)
        
        # Process request
        start_time = time.time()
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        
        # Add headers
        response.headers["X-Correlation-ID"] = correlation_id
        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
        
        # Log API request
        user_id = getattr(request.state, 'user_id', None)
        log_api_request(
            logger,
            request.method,
            request.url.path,
            user_id=user_id,
            correlation_id=correlation_id,
            status_code=response.status_code,
            response_time=process_time
        )
        
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using Redis"""
    
    def __init__(self, app):
        super().__init__(app)
        self.redis_client = get_redis_client()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for health check and docs
        if request.url.path in ["/", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        # Determine rate limit identifier
        api_key = request.headers.get("X-Api-Key")
        user_id = getattr(request.state, "user_id", None)
        client_ip = request.client.host if request.client else "unknown"
        
        # Use API key, then user ID, then IP
        identifier = api_key or str(user_id) if user_id else client_ip
        path = request.url.path
        
        try:
            # Check rate limit using Redis client
            rate_check = self.redis_client.check_rate_limit(
                identifier, 
                path, 
                settings.RATE_LIMIT_PER_MINUTE, 
                60
            )
            
            if not rate_check["allowed"]:
                logger.warning(f"Rate limit exceeded for {identifier} on {path}")
                return Response(
                    content='{"error": "Rate limit exceeded"}',
                    status_code=429,
                    media_type="application/json",
                    headers={
                        "X-RateLimit-Limit": str(rate_check["limit"]),
                        "X-RateLimit-Remaining": str(rate_check["remaining"]),
                        "X-RateLimit-Reset": str(rate_check["reset_time"]),
                    }
                )
            
            # Process request
            response = await call_next(request)
            
            # Add rate limit headers
            response.headers["X-RateLimit-Limit"] = str(rate_check["limit"])
            response.headers["X-RateLimit-Remaining"] = str(rate_check["remaining"])
            
            return response
            
        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            # If rate limiting fails, allow the request to proceed
            return await call_next(request)

def setup_middleware(app: FastAPI):
    """Setup all middleware for the FastAPI application"""
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=settings.CORS_ALLOW_HEADERS,
    )
    
    # Rate limiting middleware (before correlation ID)
    app.add_middleware(RateLimitMiddleware)
    
    # Correlation ID and timing middleware
    app.add_middleware(CorrelationIdMiddleware)


def get_correlation_id(request: Request) -> str:
    """Get correlation ID from request state."""
    return getattr(request.state, 'correlation_id', str(uuid.uuid4()))