"""Tests for transactions service."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_login():
    """Test user authentication - get JWT token for testing."""
    response = client.post("/auth/login?username=alice&password=password123")
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    return {"Authorization": f"Bearer {body['access_token']}"}


def test_transactions_list_endpoint():
    """Test transactions list endpoint."""
    auth_headers = test_login()
    
    # Test basic transaction list
    response = client.get("/transactions/", headers=auth_headers)
    assert response.status_code == 200
    
    body = response.json()
    assert "transactions" in body
    assert "pagination" in body
    assert isinstance(body["transactions"], list)
    
    # Check pagination metadata
    pagination = body["pagination"]
    assert "page" in pagination
    assert "per_page" in pagination
    assert "total_count" in pagination
    assert "total_pages" in pagination
    assert "has_next" in pagination
    assert "has_prev" in pagination


def test_transactions_list_with_pagination():
    """Test transactions list with pagination parameters."""
    auth_headers = test_login()
    
    response = client.get(
        "/transactions/?page=1&per_page=5", 
        headers=auth_headers
    )
    assert response.status_code == 200
    
    body = response.json()
    pagination = body["pagination"]
    assert pagination["page"] == 1
    assert pagination["per_page"] == 5


def test_transactions_list_with_filters():
    """Test transactions list with filtering."""
    auth_headers = test_login()
    
    # Test asset code filter
    response = client.get(
        "/transactions/?asset_code=SYP", 
        headers=auth_headers
    )
    assert response.status_code == 200
    
    # Test transaction type filter
    response = client.get(
        "/transactions/?tx_type=payment", 
        headers=auth_headers
    )
    assert response.status_code == 200


def test_transactions_search_endpoint():
    """Test transactions search endpoint."""
    auth_headers = test_login()
    
    response = client.get("/transactions/search", headers=auth_headers)
    assert response.status_code == 200
    
    body = response.json()
    assert "transactions" in body
    assert "pagination" in body


def test_transaction_summary_endpoint():
    """Test transaction summary endpoint."""
    auth_headers = test_login()
    
    response = client.get("/transactions/summary", headers=auth_headers)
    assert response.status_code == 200
    
    body = response.json()
    assert "total_transactions" in body
    assert "by_type" in body
    assert "by_status" in body


def test_transactions_unauthorized():
    """Test transactions endpoints require authentication."""
    # Test without authentication
    response = client.get("/transactions/")
    assert response.status_code == 401
    
    response = client.get("/transactions/summary")
    assert response.status_code == 401


def test_transactions_invalid_pagination():
    """Test invalid pagination parameters."""
    auth_headers = test_login()
    
    # Test invalid page number
    response = client.get("/transactions/?page=0", headers=auth_headers)
    assert response.status_code == 422  # Validation error
    
    # Test invalid per_page
    response = client.get("/transactions/?per_page=0", headers=auth_headers)
    assert response.status_code == 422  # Validation error


def test_transaction_by_id_not_found():
    """Test getting a transaction by ID that doesn't exist."""
    auth_headers = test_login()
    
    # Use a valid UUID format but non-existent transaction
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/transactions/{fake_id}", headers=auth_headers)
    assert response.status_code == 404


def test_transaction_by_id_invalid_format():
    """Test getting a transaction with invalid UUID format."""
    auth_headers = test_login()
    
    response = client.get("/transactions/invalid-uuid", headers=auth_headers)
    assert response.status_code == 400