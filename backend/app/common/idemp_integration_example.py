"""Example showing how to integrate the new idempotency helper with existing services.

This demonstrates how the QR service could be updated to use the new
idempotency helper instead of manual idempotency handling.
"""

import json
import logging
from decimal import Decimal
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

# Import the new idempotency helper
from .idemp import with_idempotency, idempotency_guard
from .models import User, Account, Balance, Transaction, TransactionType, TransactionStatus
from .redis_client import get_redis_client

logger = logging.getLogger(__name__)


class ModernizedQRService:
    """Example of QR service updated to use the new idempotency helper."""
    
    def __init__(self, db: Session):
        self.db = db
        self.redis = get_redis_client()
    
    @with_idempotency(ttl=3600, return_existing=True)
    def pay_qr_code_modern(
        self, 
        user: User, 
        qr_id: str, 
        idempotency_key: str
    ) -> dict:
        """Modern QR payment processing using the idempotency decorator.
        
        This version is much simpler than the original because:
        1. No manual idempotency checking - handled by decorator
        2. No manual result storage - handled by decorator  
        3. Duplicate requests automatically return existing result with duplicate_ignored=True
        4. Redis failures are handled gracefully by the helper
        """
        logger.info(f"Processing QR payment from user {user.username} for QR {qr_id}")
        
        # Get QR data from Redis
        qr_data_str = self.redis.get(f"qr:{qr_id}")
        if not qr_data_str:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="QR code not found or expired"
            )
        
        qr_data = json.loads(qr_data_str) if isinstance(qr_data_str, str) else qr_data_str
        
        # Check if QR code is already used
        if qr_data.get("used", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="QR code already used"
            )
        
        # Check if user is trying to pay their own QR code
        if str(user.id) == qr_data["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot pay your own QR code"
            )
        
        # Business logic for payment processing
        amount = Decimal(qr_data["amount"])
        
        # Validate payer has sufficient balance
        payer_account = self._get_user_account(user.id, qr_data["asset_code"])
        payer_balance = self._get_account_balance(payer_account.id)
        
        if payer_balance.amount < amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient balance"
            )
        
        # Get recipient account
        from uuid import UUID
        recipient_user_id = UUID(qr_data["user_id"])
        recipient_account = self._get_user_account(recipient_user_id, qr_data["asset_code"])
        recipient_balance = self._get_account_balance(recipient_account.id)
        
        # Process the payment
        transaction = self._create_transaction(
            user=user,
            asset_code=qr_data["asset_code"],
            amount=amount,
            destination=recipient_account.stellar_address,
            qr_id=qr_id
        )
        
        # Update balances
        payer_balance.amount -= amount
        recipient_balance.amount += amount
        
        # Mark QR code as used
        qr_data["used"] = True
        self.redis.setex(f"qr:{qr_id}", 86400, json.dumps(qr_data))
        
        self.db.commit()
        
        # Return the result (will be automatically cached by the decorator)
        return {
            "success": True,
            "transaction_id": transaction.id,
            "message": "Payment successful",
            "amount": str(amount),
            "asset_code": qr_data["asset_code"]
        }
    
    def pay_qr_code_with_context_manager(
        self,
        user: User,
        qr_id: str,
        idempotency_key: str
    ) -> dict:
        """Alternative implementation using the context manager approach."""
        
        with idempotency_guard(idempotency_key, ttl=3600) as guard:
            if guard is None:
                # This is a duplicate request
                logger.info(f"Duplicate QR payment request for key: {idempotency_key}")
                return {
                    "success": True,
                    "duplicate": True,
                    "message": "Payment was already processed"
                }
            
            # Process payment (same business logic as above)
            logger.info(f"Processing new QR payment for key: {idempotency_key}")
            
            # ... business logic here (same as above method) ...
            # For brevity, I'll just return a simulated result
            
            result = {
                "success": True,
                "transaction_id": f"tx_{idempotency_key}",
                "message": "Payment successful",
                "qr_id": qr_id,
                "payer_id": str(user.id)
            }
            
            # Store the result for future duplicate detection
            guard.store_result(result)
            
            return result
    
    def _get_user_account(self, user_id, asset_code: str) -> Account:
        """Helper method to get user account for asset."""
        account = self.db.query(Account).filter(
            Account.user_id == user_id,
            Account.asset_code == asset_code
        ).first()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No {asset_code} account found"
            )
        
        return account
    
    def _get_account_balance(self, account_id) -> Balance:
        """Helper method to get account balance."""
        balance = self.db.query(Balance).filter(Balance.account_id == account_id).first()
        
        if not balance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account balance not found"
            )
        
        return balance
    
    def _create_transaction(
        self, 
        user: User, 
        asset_code: str, 
        amount: Decimal, 
        destination: str, 
        qr_id: str
    ) -> Transaction:
        """Helper method to create transaction record."""
        transaction = Transaction(
            user_id=user.id,
            tx_type=TransactionType.PAYMENT,
            asset_code=asset_code,
            amount=amount,
            status=TransactionStatus.SUCCESS,
            destination=destination,
            memo="QR Payment",
            stellar_tx_hash=f"qr_payment_{qr_id}"
        )
        
        self.db.add(transaction)
        self.db.flush()  # Get the ID without committing
        
        return transaction


# Example showing comparison between old and new approaches
class IdempotencyComparison:
    """Shows the difference between manual and helper-based idempotency."""
    
    def __init__(self, db: Session):
        self.db = db
        self.redis = get_redis_client()
    
    def old_manual_approach(self, user_id: str, amount: Decimal, idempotency_key: str) -> dict:
        """Old approach with manual idempotency handling (like current QR service)."""
        
        # Manual idempotency check
        idem_key = f"idem:{idempotency_key}"
        existing_result = self.redis.get(idem_key)
        if existing_result:
            result = json.loads(existing_result) if isinstance(existing_result, str) else existing_result
            result["duplicate_ignored"] = True
            return result
        
        # Process the operation
        result = {
            "success": True,
            "transaction_id": f"tx_{idempotency_key}",
            "user_id": user_id,
            "amount": str(amount)
        }
        
        # Manual result storage
        self.redis.setex(idem_key, 3600, json.dumps(result))
        
        return result
    
    @with_idempotency(ttl=3600)
    def new_helper_approach(self, user_id: str, amount: Decimal, idempotency_key: str) -> dict:
        """New approach using the idempotency helper - much simpler!"""
        
        # Just the business logic - idempotency is handled automatically
        return {
            "success": True,
            "transaction_id": f"tx_{idempotency_key}",
            "user_id": user_id,
            "amount": str(amount)
        }


# Integration with FastAPI endpoints
def example_fastapi_integration():
    """Example of how to use the helper in FastAPI endpoints."""
    
    # This would be in your router file
    from fastapi import APIRouter, Depends, Header
    from sqlalchemy.orm import Session
    from typing import Optional
    
    router = APIRouter()
    
    @router.post("/qr/pay")
    async def pay_qr_code(
        qr_id: str,
        current_user: User = Depends(),  # Your auth dependency
        db: Session = Depends(),  # Your DB dependency  
        idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key")
    ):
        """FastAPI endpoint using the idempotency helper."""
        
        if not idempotency_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Idempotency-Key header is required"
            )
        
        service = ModernizedQRService(db)
        return service.pay_qr_code_modern(
            user=current_user,
            qr_id=qr_id,
            idempotency_key=idempotency_key
        )


if __name__ == "__main__":
    # Example usage
    print("Examples of how the new idempotency helper simplifies existing code:")
    print("1. Decorator approach: Automatic handling with @with_idempotency")
    print("2. Context manager: Fine-grained control with idempotency_guard")
    print("3. Manual utilities: check_idempotency_key() and store_idempotency_result()")
    print("4. Graceful degradation: Service remains available even if Redis fails")
    print("5. Comprehensive logging: Built-in debugging and monitoring support")