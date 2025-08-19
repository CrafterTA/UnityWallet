"""Redis client configuration and utilities."""

import redis
import json
from typing import Any, Optional, Union
from .config import settings
import logging

logger = logging.getLogger(__name__)

class RedisClient:
    """Redis client wrapper with utility methods."""
    
    def __init__(self):
        """Initialize Redis client."""
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        self._test_connection()
    
    def _test_connection(self) -> None:
        """Test Redis connection."""
        try:
            self.redis.ping()
            logger.info("Redis connection established successfully")
        except redis.ConnectionError as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set a key-value pair with optional TTL."""
        try:
            serialized_value = json.dumps(value) if not isinstance(value, str) else value
            return self.redis.set(key, serialized_value, ex=ttl)
        except Exception as e:
            logger.error(f"Error setting Redis key {key}: {e}")
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """Get value by key."""
        try:
            value = self.redis.get(key)
            if value is None:
                return None
            
            # Try to deserialize JSON, fall back to string
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        except Exception as e:
            logger.error(f"Error getting Redis key {key}: {e}")
            return None
    
    def delete(self, key: str) -> bool:
        """Delete a key."""
        try:
            return bool(self.redis.delete(key))
        except Exception as e:
            logger.error(f"Error deleting Redis key {key}: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """Check if key exists."""
        try:
            return bool(self.redis.exists(key))
        except Exception as e:
            logger.error(f"Error checking Redis key existence {key}: {e}")
            return False
    
    def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment a counter."""
        try:
            return self.redis.incr(key, amount)
        except Exception as e:
            logger.error(f"Error incrementing Redis key {key}: {e}")
            return None

    
    def setex(self, key: str, time: int, value: Any) -> bool:
        """Set key with expiration time."""
        try:
            serialized_value = json.dumps(value) if not isinstance(value, str) else str(value)
            return self.redis.setex(key, time, serialized_value)
        except Exception as e:
            logger.error(f"Error setting Redis key {key} with expiration: {e}")
            return False
    
    def incr(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment key value."""
        try:
            return self.redis.incr(key, amount)
        except Exception as e:
            logger.error(f"Error incrementing Redis key {key}: {e}")
            return None
    
    def set_hash(self, name: str, mapping: dict, ttl: Optional[int] = None) -> bool:
        """Set hash fields."""
        try:
            result = self.redis.hset(name, mapping=mapping)
            if ttl:
                self.redis.expire(name, ttl)
            return bool(result)
        except Exception as e:
            logger.error(f"Error setting Redis hash {name}: {e}")
            return False
    
    def get_hash(self, name: str) -> Optional[dict]:
        """Get all hash fields."""
        try:
            return self.redis.hgetall(name)
        except Exception as e:
            logger.error(f"Error getting Redis hash {name}: {e}")
            return None
    
    def rate_limit_check(self, key: str, limit: int, window: int) -> bool:
        """Check rate limit using sliding window."""
        try:
            current = self.redis.get(key)
            if current is None:
                self.redis.setex(key, window, 1)
                return True
            
            if int(current) >= limit:
                return False
            
            self.redis.incr(key)
            return True
        except Exception as e:
            logger.error(f"Error checking rate limit for key {key}: {e}")
            return False

    def set_qr_payload(self, qr_id: str, payload: dict, ttl: int = 300) -> bool:
        """Set QR code payload with TTL (default 5 minutes)."""
        try:
            key = f"qr:{qr_id}"
            return self.set(key, payload, ttl)
        except Exception as e:
            logger.error(f"Error setting QR payload {qr_id}: {e}")
            return False
    
    def get_qr_payload(self, qr_id: str) -> Optional[dict]:
        """Get QR code payload."""
        try:
            key = f"qr:{qr_id}"
            return self.get(key)
        except Exception as e:
            logger.error(f"Error getting QR payload {qr_id}: {e}")
            return None
    
    def delete_qr_payload(self, qr_id: str) -> bool:
        """Delete QR code payload."""
        try:
            key = f"qr:{qr_id}"
            return self.delete(key)
        except Exception as e:
            logger.error(f"Error deleting QR payload {qr_id}: {e}")
            return False
    
    def set_idempotency_key(self, idempotency_key: str, result: dict, ttl: int = 3600) -> bool:
        """Set idempotency key result with TTL (default 1 hour)."""
        try:
            key = f"idempotency:{idempotency_key}"
            return self.set(key, result, ttl)
        except Exception as e:
            logger.error(f"Error setting idempotency key {idempotency_key}: {e}")
            return False
    
    def get_idempotency_result(self, idempotency_key: str) -> Optional[dict]:
        """Get idempotency key result."""
        try:
            key = f"idempotency:{idempotency_key}"
            return self.get(key)
        except Exception as e:
            logger.error(f"Error getting idempotency result {idempotency_key}: {e}")
            return None

# Global Redis client instance
redis_client = RedisClient()

def get_redis_client() -> RedisClient:
    """Get Redis client instance."""
    return redis_client