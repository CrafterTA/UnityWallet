"""
Audit logging utilities for Unity Wallet API.

Example usage:

    # Basic audit logging
    from .audit import write_audit, AuditAction, AuditStatus
    
    write_audit(
        db=db,
        action=AuditAction.CREATE,
        resource="user",
        resource_id=str(user.id),
        status=AuditStatus.SUCCESS,
        request=request
    )
    
    # Convenience functions
    from .audit import audit_user_action, audit_transaction_action
    
    audit_user_action(db, AuditAction.LOGIN, user.id, request=request)
    audit_transaction_action(db, AuditAction.PAYMENT, tx.id, user.id, 
                           meta={"amount": "100.00", "asset": "USDC"})
    
    # Context manager for automatic error handling
    from .audit import AuditLogger
    
    with AuditLogger(db, AuditAction.CREATE, "user") as audit:
        user = create_user_logic()
        audit.resource_id = str(user.id)
        audit.meta = {"username": user.username}
        # Automatically logs SUCCESS or FAILED based on exceptions
"""

import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Union, Callable
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from .models import AuditLog, AuditAction, AuditStatus
from .logging import get_correlation_id, get_user_id, generate_correlation_id
import json

logger = logging.getLogger(__name__)


def extract_client_ip(request: Request) -> Optional[str]:
    """Extract client IP address from request, handling proxies."""
    # Check for forwarded IP headers (common with reverse proxies)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take the first IP in the chain (original client)
        return forwarded_for.split(",")[0].strip()
    
    # Check for real IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    
    # Fallback to direct client IP
    if request.client:
        return request.client.host
    
    return None


def extract_request_context(request: Optional[Request] = None) -> Dict[str, Any]:
    """Extract common request context for audit logging."""
    context = {
        "request_id": get_correlation_id(),
        "user_id": get_user_id(),
        "ip": None,
    }
    
    if request:
        context["ip"] = extract_client_ip(request)
        
        # Use X-Request-ID from request state if available, otherwise fall back to correlation ID
        request_id = get_request_id_from_request(request)
        if request_id:
            context["request_id"] = request_id
        
        # Add additional context from request if available
        context.update({
            "user_agent": request.headers.get("User-Agent"),
            "method": request.method,
            "path": str(request.url.path),
        })
    
    return context


def write_audit(
    db: Session,
    action: Union[AuditAction, str],
    resource: str,
    status: Union[AuditStatus, str],
    user_id: Optional[Union[str, "UUID"]] = None,
    resource_id: Optional[str] = None,
    request_id: Optional[str] = None,
    ip: Optional[str] = None,
    meta: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
    ts: Optional[datetime] = None
) -> Optional[AuditLog]:
    """
    Write an audit log entry to the database.
    
    Args:
        db: Database session
        action: Action performed (AuditAction enum or string)
        resource: Resource type (e.g., "user", "transaction", "account")
        status: Operation status (AuditStatus enum or string)
        user_id: User ID (optional, extracted from context if not provided)
        resource_id: ID of the specific resource affected
        request_id: Correlation/request ID (extracted from context if not provided)
        ip: Client IP address (extracted from request if not provided)
        meta: Additional metadata as dictionary
        request: FastAPI Request object for context extraction
        ts: Timestamp (defaults to current time)
    
    Returns:
        AuditLog instance if successful, None if failed
    """
    try:
        # Extract context if request is provided
        context = {}
        if request:
            context = extract_request_context(request)
        
        # Convert string enums to enum instances
        if isinstance(action, str):
            action = AuditAction(action)
        if isinstance(status, str):
            status = AuditStatus(status)
        
        # Use provided values or fall back to extracted context
        final_user_id = user_id or context.get("user_id") or get_user_id()
        final_request_id = request_id or context.get("request_id") or get_correlation_id()
        final_ip = ip or context.get("ip")
        final_ts = ts or datetime.now(timezone.utc)
        
        # Convert user_id to string if it's a UUID object
        if final_user_id and hasattr(final_user_id, '__str__'):
            final_user_id = str(final_user_id)
        
        # Prepare metadata
        final_meta = meta or {}
        if request:
            # Add request context to metadata if not already present
            request_meta = {
                "user_agent": context.get("user_agent"),
                "method": context.get("method"),
                "path": context.get("path"),
            }
            # Only add non-null values
            request_meta = {k: v for k, v in request_meta.items() if v is not None}
            final_meta.update(request_meta)
        
        # Create audit log entry
        audit_entry = AuditLog(
            ts=final_ts,
            user_id=final_user_id,
            action=action,
            resource=resource,
            resource_id=str(resource_id) if resource_id else None,
            status=status,
            request_id=final_request_id,
            ip=final_ip,
            meta=final_meta if final_meta else None
        )
        
        # Add to database session
        db.add(audit_entry)
        db.commit()
        
        # Log the audit action for debugging/monitoring
        logger.info(
            f"Audit log created: {action.value} {resource} {status.value}",
            extra={
                "audit_id": str(audit_entry.id),
                "user_id": final_user_id,
                "resource": resource,
                "resource_id": resource_id,
                "action": action.value,
                "status": status.value,
                "request_id": final_request_id,
                "ip": final_ip,
            }
        )
        
        return audit_entry
    
    except SQLAlchemyError as e:
        logger.error(
            f"Database error writing audit log: {e}",
            extra={
                "action": action.value if hasattr(action, 'value') else str(action),
                "resource": resource,
                "status": status.value if hasattr(status, 'value') else str(status),
                "user_id": user_id,
                "resource_id": resource_id,
                "error": str(e),
            }
        )
        db.rollback()
        return None
    
    except ValueError as e:
        logger.error(
            f"Invalid enum value in audit log: {e}",
            extra={
                "action": str(action),
                "status": str(status),
                "resource": resource,
                "user_id": user_id,
                "resource_id": resource_id,
                "error": str(e),
            }
        )
        return None
    
    except Exception as e:
        logger.error(
            f"Unexpected error writing audit log: {e}",
            extra={
                "action": str(action),
                "resource": resource,
                "status": str(status),
                "user_id": user_id,
                "resource_id": resource_id,
                "error": str(e),
            }
        )
        db.rollback()
        return None


def audit_user_action(
    db: Session,
    action: Union[AuditAction, str],
    user_id: Union[str, "UUID"],
    status: Union[AuditStatus, str] = AuditStatus.SUCCESS,
    meta: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None
) -> Optional[AuditLog]:
    """
    Convenience function for auditing user-related actions.
    
    Args:
        db: Database session
        action: Action performed
        user_id: User ID
        status: Operation status (defaults to SUCCESS)
        meta: Additional metadata
        request: FastAPI Request object
    
    Returns:
        AuditLog instance if successful, None if failed
    """
    return write_audit(
        db=db,
        action=action,
        resource="user",
        resource_id=str(user_id),
        status=status,
        user_id=user_id,
        meta=meta,
        request=request
    )


def audit_transaction_action(
    db: Session,
    action: Union[AuditAction, str],
    transaction_id: Union[str, "UUID"],
    user_id: Union[str, "UUID"],
    status: Union[AuditStatus, str] = AuditStatus.SUCCESS,
    meta: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None
) -> Optional[AuditLog]:
    """
    Convenience function for auditing transaction-related actions.
    
    Args:
        db: Database session
        action: Action performed
        transaction_id: Transaction ID
        user_id: User ID
        status: Operation status (defaults to SUCCESS)
        meta: Additional metadata (e.g., amount, asset_code)
        request: FastAPI Request object
    
    Returns:
        AuditLog instance if successful, None if failed
    """
    return write_audit(
        db=db,
        action=action,
        resource="transaction",
        resource_id=str(transaction_id),
        status=status,
        user_id=user_id,
        meta=meta,
        request=request
    )


def audit_account_action(
    db: Session,
    action: Union[AuditAction, str],
    account_id: Union[str, "UUID"],
    user_id: Union[str, "UUID"],
    status: Union[AuditStatus, str] = AuditStatus.SUCCESS,
    meta: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None
) -> Optional[AuditLog]:
    """
    Convenience function for auditing account-related actions.
    
    Args:
        db: Database session
        action: Action performed
        account_id: Account ID
        user_id: User ID
        status: Operation status (defaults to SUCCESS)
        meta: Additional metadata
        request: FastAPI Request object
    
    Returns:
        AuditLog instance if successful, None if failed
    """
    return write_audit(
        db=db,
        action=action,
        resource="account",
        resource_id=str(account_id),
        status=status,
        user_id=user_id,
        meta=meta,
        request=request
    )


def audit_auth_action(
    db: Session,
    action: Union[AuditAction, str],
    status: Union[AuditStatus, str],
    user_id: Optional[Union[str, "UUID"]] = None,
    meta: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None
) -> Optional[AuditLog]:
    """
    Convenience function for auditing authentication-related actions.
    
    Args:
        db: Database session
        action: Action performed (LOGIN, LOGOUT, PASSWORD_CHANGE, etc.)
        status: Operation status
        user_id: User ID (optional for failed login attempts)
        meta: Additional metadata (e.g., username, failure reason)
        request: FastAPI Request object
    
    Returns:
        AuditLog instance if successful, None if failed
    """
    return write_audit(
        db=db,
        action=action,
        resource="auth",
        resource_id=str(user_id) if user_id else None,
        status=status,
        user_id=user_id,
        meta=meta,
        request=request
    )


class AuditLogger:
    """
    Context manager for automatic audit logging.
    
    Usage:
        with AuditLogger(db, action="CREATE", resource="user") as audit:
            # Perform operations
            user = create_user(...)
            audit.resource_id = str(user.id)
            audit.meta = {"username": user.username}
            # Status defaults to SUCCESS unless exception occurs
    """
    
    def __init__(
        self,
        db: Session,
        action: Union[AuditAction, str],
        resource: str,
        user_id: Optional[Union[str, "UUID"]] = None,
        request: Optional[Request] = None
    ):
        self.db = db
        self.action = action
        self.resource = resource
        self.user_id = user_id
        self.request = request
        self.resource_id: Optional[str] = None
        self.meta: Optional[Dict[str, Any]] = None
        self.status: Union[AuditStatus, str] = AuditStatus.SUCCESS
        self._audit_entry: Optional[AuditLog] = None
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        # If an exception occurred, mark as failed
        if exc_type is not None:
            self.status = AuditStatus.FAILED
            if self.meta is None:
                self.meta = {}
            self.meta["error"] = str(exc_val) if exc_val else "Unknown error"
        
        # Write the audit log
        self._audit_entry = write_audit(
            db=self.db,
            action=self.action,
            resource=self.resource,
            resource_id=self.resource_id,
            status=self.status,
            user_id=self.user_id,
            meta=self.meta,
            request=self.request
        )
    
    @property
    def audit_entry(self) -> Optional[AuditLog]:
        """Get the created audit entry (available after context exit)."""
        return self._audit_entry


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Middleware to handle X-Request-ID for audit and debugging purposes."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get or generate request ID
        request_id = request.headers.get("X-Request-ID") or generate_correlation_id()
        
        # Store request ID in request state for audit functions to access
        request.state.request_id = request_id
        
        # Process request
        response = await call_next(request)
        
        # Add X-Request-ID header to response
        response.headers["X-Request-ID"] = request_id
        
        return response


def get_request_id_from_request(request: Optional[Request] = None) -> Optional[str]:
    """
    Extract request ID from FastAPI request state.
    
    Args:
        request: FastAPI Request object
    
    Returns:
        Request ID string if available, None otherwise
    """
    if request and hasattr(request, 'state') and hasattr(request.state, 'request_id'):
        return request.state.request_id
    return None
