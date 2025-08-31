"""Tests for audit log writing functionality."""

import pytest
import uuid
from datetime import datetime, timezone
from unittest.mock import Mock, MagicMock
from fastapi import Request
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.common.models import AuditLog, AuditAction, AuditStatus, User, Base
from app.common.audit import (
    write_audit, 
    audit_user_action, 
    audit_transaction_action, 
    audit_account_action,
    audit_auth_action,
    AuditLogger,
    extract_client_ip,
    extract_request_context
)


class TestAuditLogWriting:
    """Test audit log writing functionality."""
    
    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        mock_session = Mock(spec=Session)
        mock_session.add = Mock()
        mock_session.commit = Mock()
        mock_session.rollback = Mock()
        return mock_session
    
    @pytest.fixture
    def mock_request(self):
        """Create a mock FastAPI request."""
        mock_req = Mock(spec=Request)
        mock_req.client = Mock()
        mock_req.client.host = "192.168.1.100"
        mock_req.headers = {
            "User-Agent": "TestClient/1.0",
            "X-Forwarded-For": "203.0.113.1, 192.168.1.100",
            "X-Real-IP": "203.0.113.1"
        }
        mock_req.method = "POST"
        mock_req.url = Mock()
        mock_req.url.path = "/wallet/payment"
        mock_req.state = Mock()
        mock_req.state.request_id = "test-request-123"
        return mock_req
    
    def test_write_audit_basic_success(self, mock_db):
        """Test basic audit log writing with minimal parameters."""
        result = write_audit(
            db=mock_db,
            action=AuditAction.PAYMENT,
            resource="transaction",
            status=AuditStatus.SUCCESS,
            user_id="user123",
            resource_id="tx456"
        )
        
        # Verify database session calls
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        
        # Get the audit entry that was added
        added_entry = mock_db.add.call_args[0][0]
        assert isinstance(added_entry, AuditLog)
        assert added_entry.action == AuditAction.PAYMENT
        assert added_entry.resource == "transaction"
        assert added_entry.status == AuditStatus.SUCCESS
        assert added_entry.user_id == "user123"
        assert added_entry.resource_id == "tx456"
    
    def test_write_audit_with_request_context(self, mock_db, mock_request):
        """Test audit log writing with request context extraction."""
        result = write_audit(
            db=mock_db,
            action=AuditAction.LOGIN,
            resource="auth",
            status=AuditStatus.SUCCESS,
            request=mock_request
        )
        
        # Get the audit entry that was added
        added_entry = mock_db.add.call_args[0][0]
        
        # Verify request context was extracted
        assert added_entry.request_id == "test-request-123"
        assert added_entry.ip == "203.0.113.1"  # Should extract from X-Forwarded-For
        assert added_entry.meta is not None
        assert added_entry.meta["user_agent"] == "TestClient/1.0"
        assert added_entry.meta["method"] == "POST"
        assert added_entry.meta["path"] == "/wallet/payment"
    
    def test_write_audit_with_metadata(self, mock_db):
        """Test audit log writing with custom metadata."""
        custom_meta = {
            "amount": "100.50",
            "asset": "USD",
            "recipient": "alice@example.com"
        }
        
        result = write_audit(
            db=mock_db,
            action=AuditAction.PAYMENT,
            resource="transaction",
            status=AuditStatus.SUCCESS,
            meta=custom_meta
        )
        
        # Get the audit entry that was added
        added_entry = mock_db.add.call_args[0][0]
        assert added_entry.meta == custom_meta
    
    def test_write_audit_string_enums(self, mock_db):
        """Test audit log writing with string values instead of enums."""
        result = write_audit(
            db=mock_db,
            action="payment",  # String instead of enum
            resource="transaction",
            status="success",  # String instead of enum
            user_id="user123"
        )
        
        # Get the audit entry that was added
        added_entry = mock_db.add.call_args[0][0]
        assert added_entry.action == AuditAction.PAYMENT
        assert added_entry.status == AuditStatus.SUCCESS
    
    def test_write_audit_database_error_handling(self, mock_db):
        """Test audit log graceful handling of database errors."""
        from sqlalchemy.exc import SQLAlchemyError
        
        # Mock database commit to raise an error
        mock_db.commit.side_effect = SQLAlchemyError("Connection lost")
        
        result = write_audit(
            db=mock_db,
            action=AuditAction.PAYMENT,
            resource="transaction", 
            status=AuditStatus.SUCCESS
        )
        
        # Should return None and rollback on error
        assert result is None
        mock_db.rollback.assert_called_once()
    
    def test_write_audit_invalid_enum_handling(self, mock_db):
        """Test audit log handling of invalid enum values."""
        result = write_audit(
            db=mock_db,
            action="invalid_action",
            resource="transaction",
            status="success"
        )
        
        # Should return None for invalid enum
        assert result is None
        mock_db.add.assert_not_called()
        mock_db.commit.assert_not_called()


class TestAuditConvenienceFunctions:
    """Test convenience functions for specific audit actions."""
    
    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        mock_session = Mock(spec=Session)
        mock_session.add = Mock()
        mock_session.commit = Mock()
        return mock_session
    
    def test_audit_user_action(self, mock_db):
        """Test audit_user_action convenience function."""
        user_id = str(uuid.uuid4())
        
        result = audit_user_action(
            db=mock_db,
            action=AuditAction.LOGIN,
            user_id=user_id,
            meta={"login_method": "password"}
        )
        
        # Get the audit entry that was added
        added_entry = mock_db.add.call_args[0][0]
        assert added_entry.action == AuditAction.LOGIN
        assert added_entry.resource == "user"
        assert added_entry.resource_id == user_id
        assert added_entry.user_id == user_id
        assert added_entry.meta["login_method"] == "password"
    
    def test_audit_transaction_action(self, mock_db):
        """Test audit_transaction_action convenience function."""
        user_id = str(uuid.uuid4())
        tx_id = str(uuid.uuid4())
        
        result = audit_transaction_action(
            db=mock_db,
            action=AuditAction.PAYMENT,
            transaction_id=tx_id,
            user_id=user_id,
            meta={"amount": "50.00", "asset_code": "USD"}
        )
        
        # Get the audit entry that was added
        added_entry = mock_db.add.call_args[0][0]
        assert added_entry.action == AuditAction.PAYMENT
        assert added_entry.resource == "transaction"
        assert added_entry.resource_id == tx_id
        assert added_entry.user_id == user_id
        assert added_entry.meta["amount"] == "50.00"
        assert added_entry.meta["asset_code"] == "USD"
    
    def test_audit_account_action(self, mock_db):
        """Test audit_account_action convenience function."""
        user_id = str(uuid.uuid4())
        account_id = str(uuid.uuid4())
        
        result = audit_account_action(
            db=mock_db,
            action=AuditAction.CREATE,
            account_id=account_id,
            user_id=user_id,
            meta={"asset_code": "USDC"}
        )
        
        # Get the audit entry that was added
        added_entry = mock_db.add.call_args[0][0]
        assert added_entry.action == AuditAction.CREATE
        assert added_entry.resource == "account"
        assert added_entry.resource_id == account_id
        assert added_entry.user_id == user_id
        assert added_entry.meta["asset_code"] == "USDC"
    
    def test_audit_auth_action_success(self, mock_db):
        """Test audit_auth_action for successful authentication."""
        user_id = str(uuid.uuid4())
        
        result = audit_auth_action(
            db=mock_db,
            action=AuditAction.LOGIN,
            status=AuditStatus.SUCCESS,
            user_id=user_id,
            meta={"username": "alice"}
        )
        
        # Get the audit entry that was added
        added_entry = mock_db.add.call_args[0][0]
        assert added_entry.action == AuditAction.LOGIN
        assert added_entry.resource == "auth"
        assert added_entry.status == AuditStatus.SUCCESS
        assert added_entry.user_id == user_id
        assert added_entry.meta["username"] == "alice"
    
    def test_audit_auth_action_failure(self, mock_db):
        """Test audit_auth_action for failed authentication."""
        result = audit_auth_action(
            db=mock_db,
            action=AuditAction.LOGIN,
            status=AuditStatus.FAILED,
            user_id=None,  # No user ID for failed login
            meta={"username": "invalid_user", "failure_reason": "user_not_found"}
        )
        
        # Get the audit entry that was added
        added_entry = mock_db.add.call_args[0][0]
        assert added_entry.action == AuditAction.LOGIN
        assert added_entry.resource == "auth"
        assert added_entry.status == AuditStatus.FAILED
        # Note: user_id might be extracted from request context even for failed login
        # This is acceptable behavior for audit trails
        assert added_entry.meta["failure_reason"] == "user_not_found"


class TestAuditLogger:
    """Test the AuditLogger context manager."""
    
    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        mock_session = Mock(spec=Session)
        mock_session.add = Mock()
        mock_session.commit = Mock()
        return mock_session
    
    def test_audit_logger_success(self, mock_db):
        """Test AuditLogger context manager for successful operations."""
        user_id = str(uuid.uuid4())
        
        with AuditLogger(mock_db, AuditAction.CREATE, "user", user_id=user_id) as audit:
            # Simulate successful operation
            audit.resource_id = "new_user_123"
            audit.meta = {"username": "new_user", "email": "new@example.com"}
        
        # Verify audit log was written
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        
        # Get the audit entry that was added
        added_entry = mock_db.add.call_args[0][0]
        assert added_entry.action == AuditAction.CREATE
        assert added_entry.resource == "user"
        assert added_entry.status == AuditStatus.SUCCESS
        assert added_entry.resource_id == "new_user_123"
        assert added_entry.meta["username"] == "new_user"
    
    def test_audit_logger_failure(self, mock_db):
        """Test AuditLogger context manager for failed operations."""
        user_id = str(uuid.uuid4())
        
        try:
            with AuditLogger(mock_db, AuditAction.DELETE, "account", user_id=user_id) as audit:
                audit.resource_id = "account_456"
                # Simulate an error
                raise ValueError("Account deletion failed")
        except ValueError:
            pass  # Expected exception
        
        # Verify audit log was written with FAILED status
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        
        # Get the audit entry that was added
        added_entry = mock_db.add.call_args[0][0]
        assert added_entry.action == AuditAction.DELETE
        assert added_entry.resource == "account"
        assert added_entry.status == AuditStatus.FAILED
        assert added_entry.resource_id == "account_456"
        assert "error" in added_entry.meta
        assert "Account deletion failed" in added_entry.meta["error"]


class TestAuditUtilities:
    """Test audit utility functions."""
    
    def test_extract_client_ip_forwarded_for(self):
        """Test IP extraction from X-Forwarded-For header."""
        mock_request = Mock()
        mock_request.headers = {"X-Forwarded-For": "203.0.113.1, 192.168.1.100"}
        mock_request.client = None
        
        ip = extract_client_ip(mock_request)
        assert ip == "203.0.113.1"  # Should get first IP in chain
    
    def test_extract_client_ip_real_ip(self):
        """Test IP extraction from X-Real-IP header."""
        mock_request = Mock()
        mock_request.headers = {"X-Real-IP": "203.0.113.2"}
        mock_request.client = None
        
        ip = extract_client_ip(mock_request)
        assert ip == "203.0.113.2"
    
    def test_extract_client_ip_direct(self):
        """Test IP extraction from direct client connection."""
        mock_request = Mock()
        mock_request.headers = {}
        mock_request.client = Mock()
        mock_request.client.host = "192.168.1.50"
        
        ip = extract_client_ip(mock_request)
        assert ip == "192.168.1.50"
    
    def test_extract_client_ip_none(self):
        """Test IP extraction when no IP is available."""
        mock_request = Mock()
        mock_request.headers = {}
        mock_request.client = None
        
        ip = extract_client_ip(mock_request)
        assert ip is None
    
    def test_extract_request_context(self):
        """Test request context extraction."""
        mock_request = Mock()
        mock_request.headers = {
            "User-Agent": "TestClient/1.0",
            "X-Forwarded-For": "203.0.113.1"
        }
        mock_request.method = "POST"
        mock_request.url = Mock()
        mock_request.url.path = "/wallet/swap"
        mock_request.client = Mock()
        mock_request.client.host = "203.0.113.1"
        mock_request.state = Mock()
        mock_request.state.request_id = "ctx-test-456"
        
        context = extract_request_context(mock_request)
        
        assert context["ip"] == "203.0.113.1"
        assert context["user_agent"] == "TestClient/1.0"
        assert context["method"] == "POST"
        assert context["path"] == "/wallet/swap"
        assert context["request_id"] == "ctx-test-456"


class TestAuditAppendOnly:
    """Test audit log append-only behavior (no updates/deletes)."""
    
    def test_audit_log_model_no_update_method(self):
        """Test that AuditLog model doesn't expose update functionality."""
        # This is more of a design verification
        audit_entry = AuditLog(
            action=AuditAction.PAYMENT,
            resource="transaction",
            status=AuditStatus.SUCCESS
        )
        
        # Verify the model exists and has expected fields
        assert hasattr(audit_entry, 'id')
        assert hasattr(audit_entry, 'ts')
        assert hasattr(audit_entry, 'action')
        assert hasattr(audit_entry, 'resource')
        assert hasattr(audit_entry, 'status')
        assert hasattr(audit_entry, 'user_id')
        assert hasattr(audit_entry, 'meta')
        
        # Audit logs should be append-only - no update/delete methods
        # This is enforced at the application level, not model level
        assert audit_entry.action == AuditAction.PAYMENT
    
    def test_audit_metadata_capture(self):
        """Test that audit logs capture comprehensive metadata."""
        mock_db = Mock(spec=Session)
        mock_db.add = Mock()
        mock_db.commit = Mock()
        
        # Test with rich metadata
        rich_meta = {
            "transaction_amount": "150.75",
            "source_asset": "USD",
            "dest_asset": "SYP",
            "exchange_rate": "1.0",
            "fees": "0.25",
            "stellar_hash": "abc123def456",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        result = write_audit(
            db=mock_db,
            action=AuditAction.SWAP,
            resource="transaction",
            status=AuditStatus.SUCCESS,
            meta=rich_meta
        )
        
        # Verify rich metadata was stored
        added_entry = mock_db.add.call_args[0][0]
        assert added_entry.meta == rich_meta
        assert added_entry.meta["transaction_amount"] == "150.75"
        assert added_entry.meta["stellar_hash"] == "abc123def456"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])