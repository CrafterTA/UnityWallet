"""Unit tests for the idempotency helper module."""

import json
import pytest
import time
from unittest.mock import Mock, patch, MagicMock
from decimal import Decimal

from fastapi import HTTPException
import redis

from app.common.idemp import (
    with_idempotency,
    idempotency_guard,
    check_idempotency_key,
    store_idempotency_result,
    IdempotencyError,
    DuplicateRequestError
)
from app.common.redis_client import RedisClient
from app.common.config import settings


class TestWithIdempotencyDecorator:
    """Test the with_idempotency decorator."""
    
    @pytest.fixture
    def mock_redis_client(self):
        """Create a mock Redis client."""
        client = Mock(spec=RedisClient)
        client.get.return_value = None  # No existing key by default
        client.set.return_value = True  # Successful set by default
        return client
    
    def test_first_request_succeeds(self, mock_redis_client):
        """Test that the first request executes normally and stores result."""
        @with_idempotency(redis_client=mock_redis_client, key="test_key", ttl=3600)
        def test_function():
            return {"success": True, "data": "test"}
        
        result = test_function()
        
        assert result == {"success": True, "data": "test"}
        mock_redis_client.get.assert_called_once_with("idempotency:test_key")
        mock_redis_client.set.assert_called_once_with("idempotency:test_key", {"success": True, "data": "test"}, ttl=3600)
    
    def test_duplicate_request_returns_existing_result(self, mock_redis_client):
        """Test that duplicate requests return the existing result."""
        existing_result = {"success": True, "transaction_id": "tx_123"}
        mock_redis_client.get.return_value = existing_result
        
        @with_idempotency(redis_client=mock_redis_client, key="test_key")
        def test_function():
            return {"should_not_execute": True}
        
        result = test_function()
        
        assert result == {"success": True, "transaction_id": "tx_123", "duplicate_ignored": True}
        mock_redis_client.get.assert_called_once_with("idempotency:test_key")
        mock_redis_client.set.assert_not_called()  # Should not store new result
    
    def test_duplicate_request_raises_409_when_configured(self, mock_redis_client):
        """Test that duplicate requests raise 409 when return_existing=False."""
        mock_redis_client.get.return_value = {"existing": "result"}
        
        @with_idempotency(redis_client=mock_redis_client, key="test_key", return_existing=False)
        def test_function():
            return {"should_not_execute": True}
        
        with pytest.raises(HTTPException) as exc_info:
            test_function()
        
        assert exc_info.value.status_code == 409
        assert "Duplicate request detected" in exc_info.value.detail
    
    def test_idempotency_key_from_function_parameter(self, mock_redis_client):
        """Test using idempotency_key from function parameters."""
        @with_idempotency(redis_client=mock_redis_client, ttl=1800)
        def test_function(user_id: str, idempotency_key: str):
            return {"user_id": user_id, "processed": True}
        
        result = test_function("user123", idempotency_key="key456")
        
        assert result == {"user_id": "user123", "processed": True}
        mock_redis_client.get.assert_called_once_with("idempotency:key456")
        mock_redis_client.set.assert_called_once_with("idempotency:key456", {"user_id": "user123", "processed": True}, ttl=1800)
    
    def test_missing_idempotency_key_raises_error(self, mock_redis_client):
        """Test that missing idempotency key raises IdempotencyError."""
        @with_idempotency(redis_client=mock_redis_client)
        def test_function():
            return {"data": "test"}
        
        with pytest.raises(IdempotencyError) as exc_info:
            test_function()
        
        assert "Idempotency key must be provided" in str(exc_info.value)
    
    def test_redis_failure_graceful_degradation(self, mock_redis_client):
        """Test graceful degradation when Redis fails."""
        mock_redis_client.get.side_effect = redis.ConnectionError("Redis unavailable")
        
        @with_idempotency(redis_client=mock_redis_client, key="test_key")
        def test_function():
            return {"success": True, "fallback": True}
        
        result = test_function()
        
        assert result == {"success": True, "fallback": True}
        mock_redis_client.get.assert_called_once_with("idempotency:test_key")
    
    def test_uses_default_ttl_from_settings(self, mock_redis_client):
        """Test that default TTL from settings is used when not specified."""
        @with_idempotency(redis_client=mock_redis_client, key="test_key")
        def test_function():
            return {"data": "test"}
        
        test_function()
        
        mock_redis_client.set.assert_called_once_with("idempotency:test_key", {"data": "test"}, ttl=settings.IDEMPOTENCY_CACHE_TTL)
    
    def test_redis_set_failure_logs_warning(self, mock_redis_client, caplog):
        """Test that Redis set failure is logged as warning."""
        mock_redis_client.set.return_value = False
        
        @with_idempotency(redis_client=mock_redis_client, key="test_key")
        def test_function():
            return {"data": "test"}
        
        result = test_function()
        
        assert result == {"data": "test"}
        assert "Failed to store idempotency result" in caplog.text


class TestIdempotencyGuard:
    """Test the idempotency_guard context manager."""
    
    @pytest.fixture
    def mock_redis_client(self):
        """Create a mock Redis client."""
        client = Mock(spec=RedisClient)
        client.get.return_value = None  # No existing key by default
        client.set.return_value = True  # Successful set by default
        return client
    
    def test_new_request_provides_guard_object(self, mock_redis_client):
        """Test that new requests get a guard object."""
        with idempotency_guard("test_key", redis_client=mock_redis_client) as guard:
            assert guard is not None
            assert hasattr(guard, 'store_result')
            
            # Store a result
            result = {"success": True}
            success = guard.store_result(result)
            assert success is True
            
            mock_redis_client.set.assert_called_once_with("idempotency:test_key", result, ttl=settings.IDEMPOTENCY_CACHE_TTL)
    
    def test_duplicate_request_yields_none(self, mock_redis_client):
        """Test that duplicate requests yield None."""
        mock_redis_client.get.return_value = {"existing": "result"}
        
        with idempotency_guard("test_key", redis_client=mock_redis_client) as guard:
            assert guard is None
        
        mock_redis_client.get.assert_called_once_with("idempotency:test_key")
    
    def test_duplicate_request_raises_error_when_configured(self, mock_redis_client):
        """Test that duplicate requests raise DuplicateRequestError when configured."""
        mock_redis_client.get.return_value = {"existing": "result"}
        
        with pytest.raises(DuplicateRequestError) as exc_info:
            with idempotency_guard("test_key", redis_client=mock_redis_client, raise_on_duplicate=True):
                pass
        
        assert "Duplicate request for key: test_key" in str(exc_info.value)
    
    def test_redis_failure_graceful_degradation(self, mock_redis_client):
        """Test graceful degradation when Redis fails."""
        mock_redis_client.get.side_effect = redis.ConnectionError("Redis unavailable")
        
        with idempotency_guard("test_key", redis_client=mock_redis_client) as guard:
            assert guard is not None
            # Should still allow storing results (though it may fail)
            guard.store_result({"fallback": True})
    
    def test_custom_ttl(self, mock_redis_client):
        """Test using custom TTL."""
        with idempotency_guard("test_key", redis_client=mock_redis_client, ttl=7200) as guard:
            guard.store_result({"data": "test"})
            
        mock_redis_client.set.assert_called_once_with("idempotency:test_key", {"data": "test"}, ttl=7200)


class TestUtilityFunctions:
    """Test utility functions for manual idempotency management."""
    
    @pytest.fixture
    def mock_redis_client(self):
        """Create a mock Redis client."""
        client = Mock(spec=RedisClient)
        return client
    
    def test_check_idempotency_key_existing(self, mock_redis_client):
        """Test checking an existing idempotency key."""
        expected_result = {"transaction_id": "tx_123", "amount": "100.00"}
        mock_redis_client.get.return_value = expected_result
        
        result = check_idempotency_key("test_key", redis_client=mock_redis_client)
        
        assert result == expected_result
        mock_redis_client.get.assert_called_once_with("idempotency:test_key")
    
    def test_check_idempotency_key_non_existing(self, mock_redis_client):
        """Test checking a non-existing idempotency key."""
        mock_redis_client.get.return_value = None
        
        result = check_idempotency_key("test_key", redis_client=mock_redis_client)
        
        assert result is None
        mock_redis_client.get.assert_called_once_with("idempotency:test_key")
    
    def test_check_idempotency_key_redis_error(self, mock_redis_client):
        """Test Redis error when checking idempotency key."""
        mock_redis_client.get.side_effect = redis.ConnectionError("Redis unavailable")
        
        with pytest.raises(IdempotencyError) as exc_info:
            check_idempotency_key("test_key", redis_client=mock_redis_client)
        
        assert "Failed to check idempotency key" in str(exc_info.value)
    
    def test_store_idempotency_result_success(self, mock_redis_client):
        """Test successfully storing an idempotency result."""
        mock_redis_client.set.return_value = True
        result_data = {"success": True, "transaction_id": "tx_456"}
        
        success = store_idempotency_result("test_key", result_data, ttl=1800, redis_client=mock_redis_client)
        
        assert success is True
        mock_redis_client.set.assert_called_once_with("idempotency:test_key", result_data, ttl=1800)
    
    def test_store_idempotency_result_failure(self, mock_redis_client):
        """Test failure when storing idempotency result."""
        mock_redis_client.set.return_value = False
        
        success = store_idempotency_result("test_key", {"data": "test"}, redis_client=mock_redis_client)
        
        assert success is False
    
    def test_store_idempotency_result_default_ttl(self, mock_redis_client):
        """Test using default TTL when storing result."""
        mock_redis_client.set.return_value = True
        
        store_idempotency_result("test_key", {"data": "test"}, redis_client=mock_redis_client)
        
        mock_redis_client.set.assert_called_once_with("idempotency:test_key", {"data": "test"}, ttl=settings.IDEMPOTENCY_CACHE_TTL)


class TestIntegrationScenarios:
    """Test realistic integration scenarios."""
    
    @pytest.fixture
    def mock_redis_client(self):
        """Create a mock Redis client."""
        client = Mock(spec=RedisClient)
        client.get.return_value = None
        client.set.return_value = True
        return client
    
    def test_payment_processing_scenario(self, mock_redis_client):
        """Test a realistic payment processing scenario."""
        @with_idempotency(redis_client=mock_redis_client, ttl=3600)
        def process_payment(user_id: str, amount: Decimal, recipient: str, idempotency_key: str):
            # Simulate payment processing
            return {
                "success": True,
                "transaction_id": f"tx_{idempotency_key}",
                "user_id": user_id,
                "amount": str(amount),
                "recipient": recipient
            }
        
        # First request
        result1 = process_payment("user123", Decimal("100.50"), "recipient456", idempotency_key="payment_789")
        
        assert result1["success"] is True
        assert result1["transaction_id"] == "tx_payment_789"
        assert result1["amount"] == "100.50"
        
        # Verify Redis interaction
        mock_redis_client.get.assert_called_with("idempotency:payment_789")
        mock_redis_client.set.assert_called_with("idempotency:payment_789", result1, ttl=3600)
        
        # Simulate duplicate request
        mock_redis_client.reset_mock()
        mock_redis_client.get.return_value = result1
        
        result2 = process_payment("user123", Decimal("100.50"), "recipient456", idempotency_key="payment_789")
        
        assert result2["duplicate_ignored"] is True
        assert result2["transaction_id"] == "tx_payment_789"
        mock_redis_client.set.assert_not_called()  # Should not store again
    
    def test_currency_swap_scenario(self, mock_redis_client):
        """Test a currency swap scenario with context manager."""
        def process_swap(user_id: str, from_currency: str, to_currency: str, amount: Decimal, swap_key: str):
            with idempotency_guard(swap_key, redis_client=mock_redis_client, ttl=1800) as guard:
                if guard is None:
                    return {"duplicate": True, "message": "Swap already processed"}
                
                # Simulate swap processing
                result = {
                    "success": True,
                    "swap_id": f"swap_{swap_key}",
                    "user_id": user_id,
                    "from_currency": from_currency,
                    "to_currency": to_currency,
                    "amount": str(amount),
                    "rate": "1.0"
                }
                
                guard.store_result(result)
                return result
        
        result = process_swap("user123", "SYP", "USD", Decimal("1000"), "swap_456")
        
        assert result["success"] is True
        assert result["swap_id"] == "swap_swap_456"
        mock_redis_client.set.assert_called_once()
    
    def test_qr_payment_scenario_with_409_response(self, mock_redis_client):
        """Test QR payment scenario that returns 409 for duplicates."""
        @with_idempotency(redis_client=mock_redis_client, return_existing=False)
        def process_qr_payment(qr_id: str, payer_id: str, idempotency_key: str):
            return {
                "success": True,
                "qr_id": qr_id,
                "payer_id": payer_id,
                "payment_id": f"pay_{idempotency_key}"
            }
        
        # First request succeeds
        result = process_qr_payment("qr123", "user456", idempotency_key="qr_pay_789")
        assert result["success"] is True
        
        # Duplicate request raises 409
        mock_redis_client.get.return_value = result
        
        with pytest.raises(HTTPException) as exc_info:
            process_qr_payment("qr123", "user456", idempotency_key="qr_pay_789")
        
        assert exc_info.value.status_code == 409
        assert "Duplicate request detected" in exc_info.value.detail


class TestSwapEndpointIdempotency:
    """Test idempotency behavior at the API level for swap endpoint."""
    
    @pytest.fixture
    def client(self):
        """Create a test client for the FastAPI app."""
        from fastapi.testclient import TestClient
        from app.main import app
        return TestClient(app)
    
    @pytest.fixture
    def auth_headers(self, client):
        """Get authentication headers for test user."""
        # Login to get token
        login_response = client.post(
            "/auth/login",
            params={"username": "alice", "password": "password123"}
        )
        assert login_response.status_code == 200, login_response.text
        token = login_response.json()["access_token"]
        
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def test_swap_idempotency_first_request_succeeds(self, client, auth_headers):
        """Test that first swap request with idempotency key succeeds."""
        import uuid
        
        idempotency_key = f"test_swap_{uuid.uuid4()}"
        headers = auth_headers.copy()
        headers["Idempotency-Key"] = idempotency_key
        
        swap_payload = {
            "sell_asset": "SYP",
            "buy_asset": "USD", 
            "amount": 10.0
        }
        
        response = client.post("/wallet/swap", headers=headers, json=swap_payload)
        
        # First request should succeed
        assert response.status_code == 200, response.text
        data = response.json()
        assert data.get("ok") is True
        assert "swapped" in data
        assert "rate" in data
    
    def test_swap_idempotency_duplicate_returns_409(self, client, auth_headers):
        """Test that duplicate swap request returns 409 Conflict."""
        import uuid
        
        idempotency_key = f"test_swap_{uuid.uuid4()}"
        headers = auth_headers.copy()
        headers["Idempotency-Key"] = idempotency_key
        
        swap_payload = {
            "sell_asset": "USD",
            "buy_asset": "SYP", 
            "amount": 5.0
        }
        
        # First request
        response1 = client.post("/wallet/swap", headers=headers, json=swap_payload)
        assert response1.status_code == 200, response1.text
        
        # Duplicate request with same idempotency key
        response2 = client.post("/wallet/swap", headers=headers, json=swap_payload)
        assert response2.status_code == 409, f"Expected 409, got {response2.status_code}: {response2.text}"
        assert "Duplicate request detected" in response2.text
    
    def test_swap_missing_idempotency_key_fails(self, client, auth_headers):
        """Test that swap request without Idempotency-Key header fails."""
        swap_payload = {
            "sell_asset": "SYP",
            "buy_asset": "USD", 
            "amount": 1.0
        }
        
        response = client.post("/wallet/swap", headers=auth_headers, json=swap_payload)
        
        # Should fail without idempotency key (422 Unprocessable Entity for missing required header)
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"
        assert "Idempotency-Key" in response.text or "idempotency" in response.text.lower()
    
    def test_swap_different_users_same_key_allowed(self, client):
        """Test that different users can use the same idempotency key."""
        import uuid
        
        idempotency_key = f"shared_key_{uuid.uuid4()}"
        
        # Get Alice's token
        alice_login = client.post("/auth/login", params={"username": "alice", "password": "password123"})
        alice_token = alice_login.json()["access_token"]
        alice_headers = {
            "Authorization": f"Bearer {alice_token}",
            "Content-Type": "application/json",
            "Idempotency-Key": idempotency_key
        }
        
        # Get Bob's token
        bob_login = client.post("/auth/login", params={"username": "bob", "password": "password123"})
        bob_token = bob_login.json()["access_token"]
        bob_headers = {
            "Authorization": f"Bearer {bob_token}",
            "Content-Type": "application/json",
            "Idempotency-Key": idempotency_key  # Same key as Alice
        }
        
        swap_payload = {
            "sell_asset": "SYP",
            "buy_asset": "USD",
            "amount": 2.0
        }
        
        # Alice makes swap
        alice_response = client.post("/wallet/swap", headers=alice_headers, json=swap_payload)
        assert alice_response.status_code == 200, alice_response.text
        
        # Bob makes swap with same idempotency key - should succeed because different user
        bob_response = client.post("/wallet/swap", headers=bob_headers, json=swap_payload)
        assert bob_response.status_code == 200, bob_response.text
        
        # Different swap results should be generated
        alice_data = alice_response.json()
        bob_data = bob_response.json()
        assert alice_data.get("ok") is True
        assert bob_data.get("ok") is True
        # Both should be successful but separate operations
    
    def test_swap_idempotency_different_amounts_same_key(self, client, auth_headers):
        """Test that same key with different amounts still triggers idempotency."""
        import uuid
        
        idempotency_key = f"test_swap_{uuid.uuid4()}"
        headers = auth_headers.copy()
        headers["Idempotency-Key"] = idempotency_key
        
        # First request with amount 5.0
        payload1 = {
            "sell_asset": "SYP",
            "buy_asset": "USD",
            "amount": 5.0
        }
        response1 = client.post("/wallet/swap", headers=headers, json=payload1)
        assert response1.status_code == 200, response1.text
        
        # Second request with different amount but same key - should be rejected
        payload2 = {
            "sell_asset": "SYP", 
            "buy_asset": "USD",
            "amount": 10.0  # Different amount
        }
        response2 = client.post("/wallet/swap", headers=headers, json=payload2)
        assert response2.status_code == 409, f"Expected 409, got {response2.status_code}: {response2.text}"
        assert "Duplicate request detected" in response2.text


if __name__ == "__main__":
    pytest.main([__file__, "-v"])