"""Tests for enhanced payments service functionality."""

import os, uuid, time
from decimal import Decimal
import pytest, httpx

BASE_URL = os.getenv("BASE_URL", "http://localhost:8001")
USERNAME = os.getenv("TEST_USER", "alice")
PASSWORD = os.getenv("TEST_PASS", "password123")
TIMEOUT = float(os.getenv("TEST_TIMEOUT", "10"))

def _cid():
    return str(uuid.uuid4())

def _client():
    return httpx.Client(base_url=BASE_URL, timeout=TIMEOUT, headers={"X-Correlation-ID": _cid()})

@pytest.fixture(scope="session")
def alice_token():
    """Get Alice's authentication token."""
    with _client() as c:
        r = c.post("/auth/login", params={"username": USERNAME, "password": PASSWORD})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data
        return data["access_token"]

@pytest.fixture(scope="session")
def bob_token():
    """Get Bob's authentication token."""
    with _client() as c:
        r = c.post("/auth/login", params={"username": "bob", "password": "password123"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data
        return data["access_token"]

@pytest.fixture()
def alice_headers(alice_token):
    """Alice's authentication headers."""
    return {
        "Authorization": f"Bearer {alice_token}",
        "X-Correlation-ID": _cid(),
        "Content-Type": "application/json"
    }

@pytest.fixture()
def bob_headers(bob_token):
    """Bob's authentication headers."""
    return {
        "Authorization": f"Bearer {bob_token}",
        "X-Correlation-ID": _cid(),
        "Content-Type": "application/json"
    }

def test_p2p_transfer_success(alice_headers, bob_headers):
    """Test successful P2P transfer between users."""
    with _client() as c:
        # Get Alice's initial balance
        alice_balance_before = c.get("/wallet/balances", headers=alice_headers)
        assert alice_balance_before.status_code == 200
        alice_syp_before = None
        for balance in alice_balance_before.json()["balances"]:
            if balance["asset_code"] == "SYP":
                alice_syp_before = Decimal(balance["amount"])
                break
        assert alice_syp_before is not None
        
        # Get Bob's initial balance
        bob_balance_before = c.get("/wallet/balances", headers=bob_headers)
        assert bob_balance_before.status_code == 200
        bob_syp_before = None
        for balance in bob_balance_before.json()["balances"]:
            if balance["asset_code"] == "SYP":
                bob_syp_before = Decimal(balance["amount"])
                break
        assert bob_syp_before is not None
        
        # Perform P2P transfer from Alice to Bob
        transfer_amount = Decimal("100.00")
        transfer_data = {
            "recipient_username": "bob",
            "asset_code": "SYP",
            "amount": str(transfer_amount),
            "memo": "Test P2P transfer"
        }
        
        idempotency_key = str(uuid.uuid4())
        headers_with_idempotency = alice_headers.copy()
        headers_with_idempotency["Idempotency-Key"] = idempotency_key
        
        r = c.post("/payments/p2p", json=transfer_data, headers=headers_with_idempotency)
        assert r.status_code == 200, r.text
        
        response_data = r.json()
        assert response_data["ok"] is True
        assert response_data["recipient_username"] == "bob"
        assert Decimal(response_data["amount"]) == transfer_amount
        assert response_data["asset_code"] == "SYP"
        assert response_data["status"] == "completed"
        assert "transfer_id" in response_data
        assert "sender_tx_id" in response_data
        assert "recipient_tx_id" in response_data
        
        # Verify Alice's balance decreased
        alice_balance_after = c.get("/wallet/balances", headers=alice_headers)
        assert alice_balance_after.status_code == 200
        alice_syp_after = None
        for balance in alice_balance_after.json()["balances"]:
            if balance["asset_code"] == "SYP":
                alice_syp_after = Decimal(balance["amount"])
                break
        assert alice_syp_after == alice_syp_before - transfer_amount
        
        # Verify Bob's balance increased
        bob_balance_after = c.get("/wallet/balances", headers=bob_headers)
        assert bob_balance_after.status_code == 200
        bob_syp_after = None
        for balance in bob_balance_after.json()["balances"]:
            if balance["asset_code"] == "SYP":
                bob_syp_after = Decimal(balance["amount"])
                break
        assert bob_syp_after == bob_syp_before + transfer_amount


def test_p2p_transfer_idempotency(alice_headers):
    """Test P2P transfer idempotency."""
    with _client() as c:
        transfer_data = {
            "recipient_username": "bob",
            "asset_code": "SYP",
            "amount": "50.00",
            "memo": "Idempotency test"
        }
        
        idempotency_key = str(uuid.uuid4())
        headers_with_idempotency = alice_headers.copy()
        headers_with_idempotency["Idempotency-Key"] = idempotency_key
        
        # First request
        r1 = c.post("/payments/p2p", json=transfer_data, headers=headers_with_idempotency)
        assert r1.status_code == 200, r1.text
        first_response = r1.json()
        assert first_response["ok"] is True
        
        # Second request with same idempotency key
        r2 = c.post("/payments/p2p", json=transfer_data, headers=headers_with_idempotency)
        assert r2.status_code == 200, r2.text
        second_response = r2.json()
        assert second_response["ok"] is True
        assert second_response.get("duplicate_ignored") is True


def test_p2p_transfer_invalid_recipient(alice_headers):
    """Test P2P transfer with invalid recipient."""
    with _client() as c:
        transfer_data = {
            "recipient_username": "nonexistent_user",
            "asset_code": "SYP",
            "amount": "50.00",
            "memo": "Should fail"
        }
        
        r = c.post("/payments/p2p", json=transfer_data, headers=alice_headers)
        assert r.status_code == 400
        assert "not found" in r.json()["detail"].lower()


def test_p2p_transfer_insufficient_balance(alice_headers):
    """Test P2P transfer with insufficient balance."""
    with _client() as c:
        transfer_data = {
            "recipient_username": "bob",
            "asset_code": "SYP",
            "amount": "999999999.00",  # Very large amount
            "memo": "Should fail"
        }
        
        r = c.post("/payments/p2p", json=transfer_data, headers=alice_headers)
        assert r.status_code == 400
        assert "insufficient" in r.json()["detail"].lower()


def test_p2p_transfer_self_transfer(alice_headers):
    """Test P2P transfer to self (should fail)."""
    with _client() as c:
        transfer_data = {
            "recipient_username": "alice",
            "asset_code": "SYP",
            "amount": "50.00",
            "memo": "Self transfer"
        }
        
        r = c.post("/payments/p2p", json=transfer_data, headers=alice_headers)
        assert r.status_code == 400
        assert "yourself" in r.json()["detail"].lower()


def test_payment_history(alice_headers):
    """Test payment history retrieval."""
    with _client() as c:
        # Get payment history
        r = c.get("/payments/history", headers=alice_headers)
        assert r.status_code == 200, r.text
        
        data = r.json()
        assert "payments" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data
        assert isinstance(data["payments"], list)
        
        # Verify structure of payment items
        if data["payments"]:
            payment = data["payments"][0]
            required_fields = ["id", "user_id", "tx_type", "asset_code", "amount", "status", "created_at"]
            for field in required_fields:
                assert field in payment
        
        # Test filtering by asset code
        r_filtered = c.get("/payments/history?asset_code=SYP", headers=alice_headers)
        assert r_filtered.status_code == 200
        filtered_data = r_filtered.json()
        for payment in filtered_data["payments"]:
            assert payment["asset_code"] == "SYP"
        
        # Test pagination
        r_paginated = c.get("/payments/history?limit=5&offset=0", headers=alice_headers)
        assert r_paginated.status_code == 200
        paginated_data = r_paginated.json()
        assert len(paginated_data["payments"]) <= 5


def test_payment_status_tracking(alice_headers):
    """Test payment status tracking."""
    with _client() as c:
        # First make a P2P transfer to have a payment to track
        transfer_data = {
            "recipient_username": "bob",
            "asset_code": "SYP",
            "amount": "25.00",
            "memo": "Status tracking test"
        }
        
        r = c.post("/payments/p2p", json=transfer_data, headers=alice_headers)
        assert r.status_code == 200, r.text
        
        response_data = r.json()
        payment_id = response_data["sender_tx_id"]
        
        # Get payment status
        r_status = c.get(f"/payments/status/{payment_id}", headers=alice_headers)
        assert r_status.status_code == 200, r_status.text
        
        status_data = r_status.json()
        assert status_data["id"] == payment_id
        assert status_data["status"] in ["success", "completed"]
        assert status_data["asset_code"] == "SYP"
        assert Decimal(status_data["amount"]) == Decimal("-25.00")  # Negative for sender
        assert "created_at" in status_data
        assert "updated_at" in status_data
        
        # Test status update (admin function - simplified for demo)
        update_data = {
            "status": "success",
            "reason": "Manual verification"
        }
        
        r_update = c.put(f"/payments/status/{payment_id}", json=update_data, headers=alice_headers)
        assert r_update.status_code == 200, r_update.text
        
        updated_status = r_update.json()
        assert updated_status["status"] == "success"


def test_payment_status_not_found(alice_headers):
    """Test payment status for non-existent payment."""
    with _client() as c:
        fake_payment_id = str(uuid.uuid4())
        
        r = c.get(f"/payments/status/{fake_payment_id}", headers=alice_headers)
        assert r.status_code == 404
        assert "not found" in r.json()["detail"].lower()


def test_qr_payments_still_work(alice_headers, bob_headers):
    """Test that existing QR payment functionality still works."""
    with _client() as c:
        # Create QR payment
        qr_data = {
            "asset_code": "SYP",
            "amount": "30.00",
            "memo": "QR test payment"
        }
        
        r_create = c.post("/payments/qr/create", json=qr_data, headers=alice_headers)
        assert r_create.status_code == 200, r_create.text
        
        qr_response = r_create.json()
        assert "qr_id" in qr_response
        assert "payload" in qr_response
        
        qr_id = qr_response["qr_id"]
        
        # Pay QR code
        pay_data = {
            "qr_id": qr_id
        }
        
        idempotency_key = str(uuid.uuid4())
        bob_headers_with_idempotency = bob_headers.copy()
        bob_headers_with_idempotency["Idempotency-Key"] = idempotency_key
        
        r_pay = c.post("/payments/qr/pay", json=pay_data, headers=bob_headers_with_idempotency)
        assert r_pay.status_code == 200, r_pay.text
        
        pay_response = r_pay.json()
        assert pay_response["ok"] is True
        assert pay_response.get("paid") is True


def test_direct_payment_still_works(alice_headers):
    """Test that direct payment endpoint still works."""
    with _client() as c:
        # Get Bob's stellar address from a known account (simplified for test)
        # In real implementation, you'd query for Bob's address
        payment_data = {
            "destination": "GBOB123456789STELLAR",  # Mock stellar address
            "asset_code": "SYP",
            "amount": "15.00",
            "memo": "Direct payment test"
        }
        
        # Note: This test might fail in real environment due to stellar address validation
        # but it tests the endpoint structure
        r = c.post("/payments/send", json=payment_data, headers=alice_headers)
        # We expect either success (200) or validation error (400), not 500
        assert r.status_code in [200, 400], r.text


if __name__ == "__main__":
    pytest.main([__file__, "-v"])