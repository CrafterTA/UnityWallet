"""Redis client setup and utilities for Unity Wallet."""

import redis
import json
from typing import Any, Optional, Dict, Union
from .config import settings
from .logging import get_logger

logger = get_logger("redis")


class RedisClient:
    """Redis client wrapper with Unity Wallet specific functionality."""
    
    def __init__(self):
        """Initialize Redis connection."""
        self._client = None
        self._connect()
    
    def _connect(self) -> None:
        """Establish Redis connection."""
        try:
            self._client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )
            # Test connection
            self._client.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    @property
    def client(self) -> redis.Redis:
        """Get Redis client instance."""
        if not self._client:
            self._connect()
        return self._client
    
    def set_with_ttl(self, key: str, value: Union[str, Dict, Any], ttl: int) -> bool:
        """Set key with TTL in seconds."""
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            return self.client.setex(key, ttl, value)
        except Exception as e:
            logger.error(f"Redis SET failed for key {key}: {e}")
            return False
    
    def get_json(self, key: str) -> Optional[Dict]:
        """Get and deserialize JSON value."""
        try:
            value = self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis GET failed for key {key}: {e}")
            return None
    
    def get(self, key: str) -> Optional[str]:
        """Get string value."""
        try:
            return self.client.get(key)
        except Exception as e:
            logger.error(f"Redis GET failed for key {key}: {e}")
            return None
    
    def delete(self, *keys: str) -> int:
        """Delete keys."""
        try:
            return self.client.delete(*keys)
        except Exception as e:
            logger.error(f"Redis DELETE failed: {e}")
            return 0
    
    def incr_with_ttl(self, key: str, ttl: int) -> int:
        """Increment counter with TTL."""
        try:
            pipe = self.client.pipeline()
            pipe.incr(key)
            pipe.expire(key, ttl)
            result = pipe.execute()
            return result[0]
        except Exception as e:
            logger.error(f"Redis INCR failed for key {key}: {e}")
            return 0
    
    def exists(self, key: str) -> bool:
        """Check if key exists."""
        try:
            return self.client.exists(key) > 0
        except Exception as e:
            logger.error(f"Redis EXISTS failed for key {key}: {e}")
            return False
    
    # Rate limiting helpers
    def check_rate_limit(self, identifier: str, path: str, limit: int, window: int) -> Dict[str, Any]:
        """Check rate limit for identifier and path."""
        key = f"rate:{identifier}:{path}"
        try:
            current = self.incr_with_ttl(key, window)
            remaining = max(0, limit - current)
            reset_time = self.client.ttl(key)
            
            return {
                "allowed": current <= limit,
                "current": current,
                "limit": limit,
                "remaining": remaining,
                "reset_time": reset_time
            }
        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            return {"allowed": True, "current": 0, "limit": limit, "remaining": limit, "reset_time": window}
    
    # Session management
    def set_session(self, user_id: str, session_data: Dict, ttl: Optional[int] = None) -> bool:
        """Set user session."""
        ttl = ttl or settings.SESSION_CACHE_TTL
        key = f"sess:{user_id}"
        return self.set_with_ttl(key, session_data, ttl)
    
    def get_session(self, user_id: str) -> Optional[Dict]:
        """Get user session."""
        key = f"sess:{user_id}"
        return self.get_json(key)
    
    def delete_session(self, user_id: str) -> int:
        """Delete user session."""
        key = f"sess:{user_id}"
        return self.delete(key)
    
    # QR code management
    def set_qr_payload(self, qr_id: str, payload: Dict, ttl: Optional[int] = None) -> bool:
        """Set QR code payload."""
        ttl = ttl or settings.QR_CACHE_TTL
        key = f"qr:{qr_id}"
        return self.set_with_ttl(key, payload, ttl)
    
    def get_qr_payload(self, qr_id: str) -> Optional[Dict]:
        """Get QR code payload."""
        key = f"qr:{qr_id}"
        return self.get_json(key)
    
    def delete_qr_payload(self, qr_id: str) -> int:
        """Delete QR code payload."""
        key = f"qr:{qr_id}"
        return self.delete(key)
    
    # Idempotency management
    def set_idempotency_key(self, key: str, result: Dict, ttl: Optional[int] = None) -> bool:
        """Set idempotency key result."""
        ttl = ttl or settings.IDEMPOTENCY_CACHE_TTL
        idem_key = f"idem:{key}"
        return self.set_with_ttl(idem_key, result, ttl)
    
    def get_idempotency_result(self, key: str) -> Optional[Dict]:
        """Get idempotency key result."""
        idem_key = f"idem:{key}"
        return self.get_json(idem_key)
    
    # Quote and path caching
    def set_quote(self, pair: str, quote_data: Dict, ttl: Optional[int] = None) -> bool:
        """Cache quote for trading pair."""
        ttl = ttl or settings.QUOTE_CACHE_TTL
        key = f"quote:{pair}"
        return self.set_with_ttl(key, quote_data, ttl)
    
    def get_quote(self, pair: str) -> Optional[Dict]:
        """Get cached quote."""
        key = f"quote:{pair}"
        return self.get_json(key)
    
    def set_path(self, sell_asset: str, buy_asset: str, path_data: Dict, ttl: Optional[int] = None) -> bool:
        """Cache path for assets."""
        ttl = ttl or settings.PATH_CACHE_TTL
        key = f"path:{sell_asset}->{buy_asset}"
        return self.set_with_ttl(key, path_data, ttl)
    
    def get_path(self, sell_asset: str, buy_asset: str) -> Optional[Dict]:
        """Get cached path."""
        key = f"path:{sell_asset}->{buy_asset}"
        return self.get_json(key)


# Global Redis client instance
redis_client = RedisClient()


def get_redis_client() -> RedisClient:
    """Get Redis client instance."""
    return redis_client