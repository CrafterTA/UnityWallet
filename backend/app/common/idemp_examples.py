"""Examples demonstrating the usage of the idempotency helper.

This file shows different ways to use the idempotency protection for
side-effecting operations in the Unity Wallet backend.
"""

from decimal import Decimal
from typing import Dict, Any
from uuid import UUID

from .idemp import with_idempotency, idempotency_guard, check_idempotency_key, store_idempotency_result
from .redis_client import get_redis_client


# Example 1: Using decorator with idempotency_key parameter
@with_idempotency(ttl=3600)  # 1 hour TTL
def process_payment(user_id: str, recipient_id: str, amount: Decimal, asset_code: str, idempotency_key: str) -> Dict[str, Any]:
    """Process a payment with idempotency protection.
    
    The decorator automatically handles:
    - Checking for duplicate requests using the idempotency_key
    - Returning existing result for duplicates (with duplicate_ignored=True)
    - Storing the result for future duplicate detection
    """
    # Simulate payment processing logic
    transaction_id = f"tx_{idempotency_key}"
    
    # Your business logic here
    result = {
        "success": True,
        "transaction_id": transaction_id,
        "user_id": user_id,
        "recipient_id": recipient_id,
        "amount": str(amount),
        "asset_code": asset_code,
        "status": "completed"
    }
    
    return result


# Example 2: Using decorator with explicit key
@with_idempotency(key="currency_swap_operation", ttl=1800, return_existing=False)
def process_currency_swap(user_id: str, from_asset: str, to_asset: str, amount: Decimal) -> Dict[str, Any]:
    """Process currency swap with explicit idempotency key.
    
    This example:
    - Uses a fixed idempotency key (suitable when function parameters uniquely identify the operation)
    - Returns HTTP 409 Conflict for duplicate requests instead of the existing result
    - Has a 30-minute TTL
    """
    swap_id = f"swap_{user_id}_{from_asset}_{to_asset}_{amount}"
    
    result = {
        "success": True,
        "swap_id": swap_id,
        "user_id": user_id,
        "from_asset": from_asset,
        "to_asset": to_asset,
        "amount": str(amount),
        "exchange_rate": "1.0",
        "status": "completed"
    }
    
    return result


# Example 3: Using context manager for more control
def process_qr_payment(qr_id: str, payer_id: str, idempotency_key: str) -> Dict[str, Any]:
    """Process QR payment using context manager for fine-grained control."""
    
    with idempotency_guard(idempotency_key, ttl=3600) as guard:
        if guard is None:
            # This is a duplicate request
            return {
                "success": True,
                "duplicate": True,
                "message": "Payment was already processed"
            }
        
        # Process the payment (your business logic here)
        payment_result = {
            "success": True,
            "payment_id": f"pay_{idempotency_key}",
            "qr_id": qr_id,
            "payer_id": payer_id,
            "status": "completed",
            "timestamp": "2024-01-01T12:00:00Z"
        }
        
        # Store the result for future duplicate detection
        guard.store_result(payment_result)
        
        return payment_result


# Example 4: Manual idempotency management
def process_loyalty_transaction(user_id: str, points: int, operation: str, idempotency_key: str) -> Dict[str, Any]:
    """Process loyalty points transaction with manual idempotency management."""
    
    # Check if this request was already processed
    existing_result = check_idempotency_key(idempotency_key)
    if existing_result:
        return {
            **existing_result,
            "duplicate_ignored": True
        }
    
    # Process the loyalty transaction
    if operation == "earn":
        # Earn points logic
        result = {
            "success": True,
            "transaction_id": f"loyalty_{idempotency_key}",
            "user_id": user_id,
            "points_earned": points,
            "operation": operation,
            "new_balance": 1000 + points  # Simulated
        }
    elif operation == "burn":
        # Burn points logic
        result = {
            "success": True,
            "transaction_id": f"loyalty_{idempotency_key}",
            "user_id": user_id,
            "points_burned": points,
            "operation": operation,
            "new_balance": 1000 - points  # Simulated
        }
    else:
        result = {"success": False, "error": "Invalid operation"}
    
    # Store the result for future duplicate detection
    store_idempotency_result(idempotency_key, result, ttl=3600)
    
    return result


# Example 5: Integration with existing QR service pattern
class ModernQRService:
    """Example of how to integrate idempotency helper with existing service classes."""
    
    def __init__(self, db_session, redis_client=None):
        self.db = db_session
        self.redis = redis_client or get_redis_client()
    
    @with_idempotency(ttl=3600)
    def pay_qr_code(self, user: Any, qr_id: str, idempotency_key: str) -> Dict[str, Any]:
        """Modern QR payment processing with built-in idempotency."""
        
        # Your existing QR payment logic here
        result = {
            "success": True,
            "transaction_id": f"qr_pay_{idempotency_key}",
            "qr_id": qr_id,
            "payer_id": str(user.id),
            "message": "Payment successful"
        }
        
        return result
    
    def create_qr_with_manual_idempotency(self, user: Any, amount: Decimal, asset_code: str) -> Dict[str, Any]:
        """Example of manual idempotency for QR creation."""
        
        # Create a unique key based on user and request parameters
        idempotency_key = f"qr_create_{user.id}_{amount}_{asset_code}"
        
        # Check for existing QR code
        existing_qr = check_idempotency_key(idempotency_key)
        if existing_qr:
            return {
                **existing_qr,
                "duplicate_ignored": True
            }
        
        # Create new QR code
        qr_id = f"qr_{user.id}_{amount}_{asset_code}"
        result = {
            "success": True,
            "qr_id": qr_id,
            "amount": str(amount),
            "asset_code": asset_code,
            "expires_at": "2024-01-02T12:00:00Z"
        }
        
        # Store with 24-hour TTL (typical for QR codes)
        store_idempotency_result(idempotency_key, result, ttl=86400)
        
        return result


# Example 6: Error handling patterns
@with_idempotency(ttl=3600)
def risky_operation_with_proper_error_handling(operation_id: str, idempotency_key: str) -> Dict[str, Any]:
    """Example showing proper error handling with idempotency.
    
    Important: Only successful operations should be cached for idempotency.
    Failed operations should not be cached so they can be retried.
    """
    
    try:
        # Simulate some risky business logic
        if operation_id == "fail":
            raise ValueError("Simulated business logic error")
        
        # Successful operation
        result = {
            "success": True,
            "operation_id": operation_id,
            "result": "Operation completed successfully"
        }
        
        return result
        
    except ValueError as e:
        # Business logic errors - don't cache these for idempotency
        # Let the decorator handle it by re-raising
        raise
    
    except Exception as e:
        # Unexpected errors - also don't cache
        raise


# Usage examples:
if __name__ == "__main__":
    # These would typically be called from FastAPI endpoints
    
    # Example 1: Payment processing
    payment_result = process_payment(
        user_id="user123",
        recipient_id="user456", 
        amount=Decimal("100.50"),
        asset_code="USD",
        idempotency_key="payment_abc123"
    )
    print("Payment result:", payment_result)
    
    # Example 3: QR payment with context manager
    qr_result = process_qr_payment(
        qr_id="qr_def456",
        payer_id="user789",
        idempotency_key="qr_payment_xyz789"
    )
    print("QR payment result:", qr_result)