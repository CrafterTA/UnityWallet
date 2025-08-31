"""Idempotency helper for preventing duplicate operations.

This module provides utilities to implement idempotency protection for side-effecting
operations like payments and swaps. It uses Redis for distributed idempotency key
tracking and returns 409 Conflict status for duplicate requests.
"""

import json
import logging
from typing import Any, Dict, Optional, Callable, Union
from contextlib import contextmanager
from functools import wraps

from fastapi import HTTPException, status
from redis import Redis
from redis.exceptions import RedisError

from .redis_client import RedisClient, get_redis_client
from .config import settings

logger = logging.getLogger(__name__)


class IdempotencyError(Exception):
    """Exception raised for idempotency-related errors."""
    pass


class DuplicateRequestError(IdempotencyError):
    """Exception raised when a duplicate request is detected."""
    pass


def with_idempotency(
    redis_client: Optional[RedisClient] = None,
    key: Optional[str] = None,
    ttl: int = None,
    return_existing: bool = True
) -> Callable:
    """Decorator for idempotency protection using Redis.
    
    This decorator prevents duplicate execution of side-effecting operations by:
    1. Checking if the idempotency key exists in Redis
    2. Returning 409 Conflict (or existing result) if key exists
    3. Setting the key in Redis after successful execution
    4. Storing the result for potential duplicate requests
    
    Args:
        redis_client: Redis client instance. Uses global client if None.
        key: Idempotency key. If None, expects 'idempotency_key' parameter in decorated function.
        ttl: Time-to-live in seconds. Uses IDEMPOTENCY_CACHE_TTL from config if None.
        return_existing: If True, return existing result. If False, raise 409 HTTP exception.
    
    Returns:
        Decorated function that implements idempotency protection.
        
    Raises:
        HTTPException: 409 Conflict when duplicate request detected (if return_existing=False)
        IdempotencyError: For Redis connection or other idempotency-related issues
        
    Example:
        @with_idempotency(ttl=3600)
        def process_payment(user_id: str, amount: Decimal, idempotency_key: str):
            # Payment processing logic here
            return {"success": True, "transaction_id": "tx_123"}
            
        # Or with explicit key:
        @with_idempotency(key="payment_123", ttl=3600)
        def process_specific_payment():
            return {"success": True}
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            # Get Redis client
            client = redis_client or get_redis_client()
            
            # Determine idempotency key
            idem_key = key
            if idem_key is None:
                idem_key = kwargs.get('idempotency_key')
                if idem_key is None:
                    raise IdempotencyError(
                        "Idempotency key must be provided either as decorator parameter "
                        "or as 'idempotency_key' function parameter"
                    )
            
            # Use configured TTL if not specified
            cache_ttl = ttl if ttl is not None else settings.IDEMPOTENCY_CACHE_TTL
            
            # Create Redis key with prefix
            redis_key = f"idempotency:{idem_key}"
            
            try:
                # Check if key already exists (duplicate request)
                existing_result = client.get(redis_key)
                if existing_result is not None:
                    logger.info(f"Duplicate request detected for key: {idem_key}")
                    
                    if return_existing:
                        # Return the existing result
                        if isinstance(existing_result, dict):
                            existing_result["duplicate_ignored"] = True
                        logger.info(f"Returning existing result for idempotency key: {idem_key}")
                        return existing_result
                    else:
                        # Raise 409 Conflict
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail=f"Duplicate request detected for idempotency key: {idem_key}"
                        )
                
                # Execute the original function
                logger.info(f"Executing function for new idempotency key: {idem_key}")
                result = func(*args, **kwargs)
                
                # Store the result in Redis with TTL
                if not client.set(redis_key, result, ttl=cache_ttl):
                    logger.warning(f"Failed to store idempotency result for key: {idem_key}")
                else:
                    logger.info(f"Stored idempotency result for key: {idem_key} with TTL: {cache_ttl}s")
                
                return result
                
            except RedisError as e:
                logger.error(f"Redis error during idempotency check for key {idem_key}: {e}")
                # In case of Redis failure, allow the operation to proceed
                # This ensures service availability even when Redis is down
                logger.warning("Proceeding with operation due to Redis failure (degraded mode)")
                return func(*args, **kwargs)
            
            except HTTPException:
                # Re-raise HTTP exceptions (like 409 Conflict)
                raise
            
            except Exception as e:
                logger.error(f"Unexpected error during idempotency processing for key {idem_key}: {e}")
                raise IdempotencyError(f"Idempotency processing failed: {str(e)}") from e
                
        return wrapper
    return decorator


@contextmanager
def idempotency_guard(
    key: str,
    redis_client: Optional[RedisClient] = None,
    ttl: Optional[int] = None,
    raise_on_duplicate: bool = False
):
    """Context manager for idempotency protection.
    
    This provides a more explicit way to implement idempotency protection
    when decorator approach is not suitable.
    
    Args:
        key: Idempotency key
        redis_client: Redis client instance. Uses global client if None.
        ttl: Time-to-live in seconds. Uses IDEMPOTENCY_CACHE_TTL from config if None.
        raise_on_duplicate: If True, raise DuplicateRequestError on duplicates.
                          If False, yield None for duplicates.
    
    Yields:
        None if duplicate request (and raise_on_duplicate=False)
        Context manager proceeds normally for new requests
        
    Raises:
        DuplicateRequestError: When duplicate detected and raise_on_duplicate=True
        IdempotencyError: For Redis connection or other issues
        
    Example:
        with idempotency_guard("payment_123", ttl=3600) as guard:
            if guard is None:
                return {"duplicate": True}  # Handle duplicate
            
            # Process payment
            result = process_payment()
            guard.store_result(result)
            return result
    """
    client = redis_client or get_redis_client()
    cache_ttl = ttl if ttl is not None else settings.IDEMPOTENCY_CACHE_TTL
    redis_key = f"idempotency:{key}"
    
    class IdempotencyGuard:
        def __init__(self):
            self.key = key
            self.redis_key = redis_key
            self.client = client
            self.ttl = cache_ttl
            
        def store_result(self, result: Any) -> bool:
            """Store the result in Redis for future duplicate requests."""
            try:
                success = self.client.set(self.redis_key, result, ttl=self.ttl)
                if success:
                    logger.info(f"Stored idempotency result for key: {self.key}")
                else:
                    logger.warning(f"Failed to store idempotency result for key: {self.key}")
                return success
            except Exception as e:
                logger.error(f"Error storing idempotency result for key {self.key}: {e}")
                return False
    
    try:
        # Check for existing key
        existing_result = client.get(redis_key)
        if existing_result is not None:
            logger.info(f"Duplicate request detected in context manager for key: {key}")
            
            if raise_on_duplicate:
                raise DuplicateRequestError(f"Duplicate request for key: {key}")
            else:
                yield None  # Signal duplicate to caller
                return
        
        # New request - yield the guard object
        logger.info(f"Processing new request with idempotency key: {key}")
        yield IdempotencyGuard()
        
    except RedisError as e:
        logger.error(f"Redis error in idempotency guard for key {key}: {e}")
        # Graceful degradation - proceed without idempotency protection
        logger.warning("Proceeding without idempotency protection due to Redis failure")
        yield IdempotencyGuard()
        
    except DuplicateRequestError:
        # Re-raise duplicate request errors
        raise
        
    except Exception as e:
        logger.error(f"Unexpected error in idempotency guard for key {key}: {e}")
        raise IdempotencyError(f"Idempotency guard failed: {str(e)}") from e


def check_idempotency_key(
    key: str,
    redis_client: Optional[RedisClient] = None
) -> Optional[Any]:
    """Check if an idempotency key exists and return its value.
    
    This is a utility function for manual idempotency checking without
    the overhead of decorators or context managers.
    
    Args:
        key: Idempotency key to check
        redis_client: Redis client instance. Uses global client if None.
        
    Returns:
        Stored result if key exists, None if key doesn't exist
        
    Raises:
        IdempotencyError: For Redis connection issues
        
    Example:
        existing = check_idempotency_key("payment_123")
        if existing:
            return {"duplicate": True, "original_result": existing}
    """
    client = redis_client or get_redis_client()
    redis_key = f"idempotency:{key}"
    
    try:
        result = client.get(redis_key)
        if result is not None:
            logger.info(f"Found existing idempotency result for key: {key}")
        return result
        
    except RedisError as e:
        logger.error(f"Redis error checking idempotency key {key}: {e}")
        raise IdempotencyError(f"Failed to check idempotency key: {str(e)}") from e
        
    except Exception as e:
        logger.error(f"Unexpected error checking idempotency key {key}: {e}")
        raise IdempotencyError(f"Idempotency check failed: {str(e)}") from e


def store_idempotency_result(
    key: str,
    result: Any,
    ttl: Optional[int] = None,
    redis_client: Optional[RedisClient] = None
) -> bool:
    """Store a result for an idempotency key.
    
    This is a utility function for manual idempotency result storage.
    
    Args:
        key: Idempotency key
        result: Result to store
        ttl: Time-to-live in seconds. Uses IDEMPOTENCY_CACHE_TTL from config if None.
        redis_client: Redis client instance. Uses global client if None.
        
    Returns:
        True if stored successfully, False otherwise
        
    Example:
        result = process_payment()
        store_idempotency_result("payment_123", result, ttl=3600)
    """
    client = redis_client or get_redis_client()
    cache_ttl = ttl if ttl is not None else settings.IDEMPOTENCY_CACHE_TTL
    redis_key = f"idempotency:{key}"
    
    try:
        success = client.set(redis_key, result, ttl=cache_ttl)
        if success:
            logger.info(f"Stored idempotency result for key: {key} with TTL: {cache_ttl}s")
        else:
            logger.warning(f"Failed to store idempotency result for key: {key}")
        return success
        
    except Exception as e:
        logger.error(f"Error storing idempotency result for key {key}: {e}")
        return False