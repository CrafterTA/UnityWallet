"""Payments service business logic."""

from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from decimal import Decimal
from ..common.models import Account, Balance, Transaction, TransactionType, TransactionStatus
from ..common.redis_client import get_redis_client
from ..common.logging import get_logger
import uuid
import json

logger = get_logger("payments_service")


class PaymentsService:
    """Service for QR code payments with idempotency."""
    
    def __init__(self, db: Session):
        self.db = db
        self.redis = get_redis_client()
    
    def create_qr_payment(
        self,
        user_id: str,
        asset_code: str,
        amount: Decimal,
        memo: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create QR code for payment request."""
        try:
            # Get user account
            account = (
                self.db.query(Account)
                .filter(Account.user_id == user_id, Account.asset_code == asset_code)
                .first()
            )
            
            if not account:
                raise ValueError(f"No account found for asset {asset_code}")
            
            # Generate QR ID
            qr_id = str(uuid.uuid4())
            
            # Create payload
            payload = {
                "qr_id": qr_id,
                "recipient_user_id": user_id,
                "recipient_address": account.stellar_address,
                "asset_code": asset_code,
                "amount": str(amount),
                "memo": memo,
                "created_at": str(uuid.uuid1().time)
            }
            
            # Store in Redis with TTL
            success = self.redis.set_qr_payload(qr_id, payload)
            
            if not success:
                raise Exception("Failed to store QR payload")
            
            logger.info(f"QR payment created: {qr_id}", extra={
                "qr_id": qr_id,
                "user_id": user_id,
                "asset_code": asset_code,
                "amount": str(amount)
            })
            
            return {
                "qr_id": qr_id,
                "payload": payload
            }
            
        except Exception as e:
            logger.error(f"QR creation failed for user {user_id}: {e}")
            raise
    
    def process_qr_payment(
        self,
        qr_id: str,
        payer_user_id: str,
        idempotency_key: str,
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process QR code payment with idempotency."""
        try:
            # Check idempotency
            existing_result = self.redis.get_idempotency_result(idempotency_key)
            if existing_result:
                logger.info(f"Duplicate payment ignored: {idempotency_key}")
                return {
                    "ok": True,
                    "duplicate_ignored": True
                }
            
            # Get QR payload
            qr_payload = self.redis.get_qr_payload(qr_id)
            if not qr_payload:
                raise ValueError("QR code not found or expired")
            
            recipient_user_id = qr_payload["recipient_user_id"]
            asset_code = qr_payload["asset_code"]
            amount = Decimal(qr_payload["amount"])
            memo = qr_payload.get("memo")
            
            # Don't allow self-payment
            if payer_user_id == recipient_user_id:
                raise ValueError("Cannot pay yourself")
            
            # Get payer account and balance
            payer_account = (
                self.db.query(Account)
                .filter(Account.user_id == payer_user_id, Account.asset_code == asset_code)
                .first()
            )
            
            if not payer_account:
                raise ValueError(f"Payer has no {asset_code} account")
            
            payer_balance = (
                self.db.query(Balance)
                .filter(Balance.account_id == payer_account.id, Balance.asset_code == asset_code)
                .first()
            )
            
            if not payer_balance or payer_balance.amount < amount:
                raise ValueError("Insufficient balance")
            
            # Get recipient balance
            recipient_account = (
                self.db.query(Account)
                .filter(Account.user_id == recipient_user_id, Account.asset_code == asset_code)
                .first()
            )
            
            recipient_balance = (
                self.db.query(Balance)
                .filter(Balance.account_id == recipient_account.id, Balance.asset_code == asset_code)
                .first()
            )
            
            if not recipient_balance:
                # Create recipient balance if it doesn't exist
                recipient_balance = Balance(
                    id=uuid.uuid4(),
                    account_id=recipient_account.id,
                    asset_code=asset_code,
                    amount=Decimal("0")
                )
                self.db.add(recipient_balance)
            
            # Store idempotency key before processing
            temp_result = {"processing": True}
            self.redis.set_idempotency_key(idempotency_key, temp_result)
            
            # Create payer transaction (debit)
            payer_tx = Transaction(
                id=uuid.uuid4(),
                user_id=payer_user_id,
                tx_type=TransactionType.PAYMENT,
                asset_code=asset_code,
                amount=-amount,  # Negative for debit
                status=TransactionStatus.PENDING,
                destination=qr_payload["recipient_address"],
                memo=memo
            )
            
            # Create recipient transaction (credit)
            recipient_tx = Transaction(
                id=uuid.uuid4(),
                user_id=recipient_user_id,
                tx_type=TransactionType.PAYMENT,
                asset_code=asset_code,
                amount=amount,  # Positive for credit
                status=TransactionStatus.PENDING,
                memo=memo
            )
            
            self.db.add_all([payer_tx, recipient_tx])
            self.db.flush()
            
            # Update balances
            payer_balance.amount -= amount
            recipient_balance.amount += amount
            
            # Update transaction statuses
            payer_tx.status = TransactionStatus.SUCCESS
            recipient_tx.status = TransactionStatus.SUCCESS
            
            self.db.commit()
            
            # Store successful result
            result = {
                "ok": True,
                "paid": True,
                "payer_tx_id": str(payer_tx.id),
                "recipient_tx_id": str(recipient_tx.id)
            }
            
            self.redis.set_idempotency_key(idempotency_key, result)
            
            # Clean up QR payload after successful payment
            self.redis.delete_qr_payload(qr_id)
            
            logger.info(f"QR payment processed successfully", extra={
                "qr_id": qr_id,
                "payer_user_id": payer_user_id,
                "recipient_user_id": recipient_user_id,
                "asset_code": asset_code,
                "amount": str(amount),
                "correlation_id": correlation_id
            })
            
            return result
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"QR payment failed: {e}")
            raise