"""Payments service business logic."""

from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from decimal import Decimal
from ..common.models import Account, Balance, Transaction, TransactionType, TransactionStatus, AuditAction, AuditStatus
from ..common.redis_client import get_redis_client
from ..common.logging import get_logger
from ..common.audit import write_audit
from fastapi import Request
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
        memo: Optional[str] = None,
        request: Request = None
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
            
            # Audit QR creation
            write_audit(
                db=self.db,
                action=AuditAction.CREATE,
                resource="qr_payment",
                status=AuditStatus.SUCCESS,
                user_id=user_id,
                resource_id=qr_id,
                request=request,
                meta={
                    "asset_code": asset_code,
                    "amount": str(amount),
                    "memo": memo,
                    "recipient_address": account.stellar_address
                }
            )
            
            return {
                "qr_id": qr_id,
                "payload": payload
            }
            
        except Exception as e:
            logger.error(f"QR creation failed for user {user_id}: {e}")
            
            # Audit QR creation failure
            write_audit(
                db=self.db,
                action=AuditAction.CREATE,
                resource="qr_payment",
                status=AuditStatus.ERROR,
                user_id=user_id,
                request=request,
                meta={
                    "asset_code": asset_code,
                    "amount": str(amount),
                    "memo": memo,
                    "error": str(e)
                }
            )
            
            raise
    
    def process_qr_payment(
        self,
        qr_id: str,
        payer_user_id: str,
        idempotency_key: str,
        correlation_id: Optional[str] = None,
        request: Request = None
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
            
            # Audit successful payment
            write_audit(
                db=self.db,
                action=AuditAction.PAYMENT,
                resource="qr_payment",
                status=AuditStatus.SUCCESS,
                user_id=payer_user_id,
                resource_id=qr_id,
                request=request,
                meta={
                    "asset_code": asset_code,
                    "amount": str(amount),
                    "recipient_user_id": recipient_user_id,
                    "memo": memo,
                    "payer_tx_id": str(payer_tx.id),
                    "recipient_tx_id": str(recipient_tx.id),
                    "correlation_id": correlation_id
                }
            )
            
            return result
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"QR payment failed: {e}")
            
            # Audit payment failure
            write_audit(
                db=self.db,
                action=AuditAction.PAYMENT,
                resource="qr_payment",
                status=AuditStatus.ERROR,
                user_id=payer_user_id,
                resource_id=qr_id,
                request=request,
                meta={
                    "error": str(e),
                    "correlation_id": correlation_id
                }
            )
            
            raise

    def process_p2p_transfer(
        self,
        sender_user_id: str,
        recipient_username: str,
        asset_code: str,
        amount: Decimal,
        memo: Optional[str] = None,
        idempotency_key: Optional[str] = None,
        correlation_id: Optional[str] = None,
        request: Request = None
    ) -> Dict[str, Any]:
        """Process P2P transfer between wallet users."""
        try:
            # Check idempotency if key provided
            if idempotency_key:
                existing_result = self.redis.get_idempotency_result(idempotency_key)
                if existing_result:
                    logger.info(f"Duplicate P2P transfer ignored: {idempotency_key}")
                    return {
                        "ok": True,
                        "duplicate_ignored": True
                    }
            
            # Find recipient by username
            from ..common.models import User
            recipient_user = (
                self.db.query(User)
                .filter(User.username == recipient_username)
                .first()
            )
            
            if not recipient_user:
                raise ValueError(f"User '{recipient_username}' not found")
            
            recipient_user_id = str(recipient_user.id)
            
            # Don't allow self-transfer
            if sender_user_id == recipient_user_id:
                raise ValueError("Cannot transfer to yourself")
            
            # Get sender account and balance
            sender_account = (
                self.db.query(Account)
                .filter(Account.user_id == sender_user_id, Account.asset_code == asset_code)
                .first()
            )
            
            if not sender_account:
                raise ValueError(f"Sender has no {asset_code} account")
            
            sender_balance = (
                self.db.query(Balance)
                .filter(Balance.account_id == sender_account.id, Balance.asset_code == asset_code)
                .first()
            )
            
            if not sender_balance or sender_balance.amount < amount:
                raise ValueError("Insufficient balance")
            
            # Get recipient account and balance
            recipient_account = (
                self.db.query(Account)
                .filter(Account.user_id == recipient_user_id, Account.asset_code == asset_code)
                .first()
            )
            
            if not recipient_account:
                raise ValueError(f"Recipient has no {asset_code} account")
            
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
            
            # Store idempotency key if provided
            if idempotency_key:
                temp_result = {"processing": True}
                self.redis.set_idempotency_key(idempotency_key, temp_result)
            
            # Generate transfer ID
            transfer_id = str(uuid.uuid4())
            
            # Create sender transaction (debit)
            sender_tx = Transaction(
                id=uuid.uuid4(),
                user_id=sender_user_id,
                tx_type=TransactionType.P2P_TRANSFER,
                asset_code=asset_code,
                amount=-amount,  # Negative for debit
                status=TransactionStatus.PENDING,
                destination=recipient_username,  # Store username for P2P
                memo=memo
            )
            
            # Create recipient transaction (credit)
            recipient_tx = Transaction(
                id=uuid.uuid4(),
                user_id=recipient_user_id,
                tx_type=TransactionType.P2P_TRANSFER,
                asset_code=asset_code,
                amount=amount,  # Positive for credit
                status=TransactionStatus.PENDING,
                memo=memo
            )
            
            self.db.add_all([sender_tx, recipient_tx])
            self.db.flush()
            
            # Update balances
            sender_balance.amount -= amount
            recipient_balance.amount += amount
            
            # Update transaction statuses
            sender_tx.status = TransactionStatus.SUCCESS
            recipient_tx.status = TransactionStatus.SUCCESS
            
            self.db.commit()
            
            # Create successful result
            result = {
                "ok": True,
                "transfer_id": transfer_id,
                "recipient_username": recipient_username,
                "amount": amount,
                "asset_code": asset_code,
                "status": "completed",
                "sender_tx_id": str(sender_tx.id),
                "recipient_tx_id": str(recipient_tx.id)
            }
            
            # Store successful result for idempotency
            if idempotency_key:
                self.redis.set_idempotency_key(idempotency_key, result)
            
            logger.info(f"P2P transfer processed successfully", extra={
                "transfer_id": transfer_id,
                "sender_user_id": sender_user_id,
                "recipient_username": recipient_username,
                "asset_code": asset_code,
                "amount": str(amount),
                "correlation_id": correlation_id
            })
            
            # Audit successful transfer
            write_audit(
                db=self.db,
                action=AuditAction.PAYMENT,
                resource="p2p_transfer",
                status=AuditStatus.SUCCESS,
                user_id=sender_user_id,
                resource_id=transfer_id,
                request=request,
                meta={
                    "asset_code": asset_code,
                    "amount": str(amount),
                    "recipient_username": recipient_username,
                    "recipient_user_id": recipient_user_id,
                    "memo": memo,
                    "sender_tx_id": str(sender_tx.id),
                    "recipient_tx_id": str(recipient_tx.id),
                    "correlation_id": correlation_id
                }
            )
            
            return result
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"P2P transfer failed: {e}")
            
            # Audit transfer failure
            write_audit(
                db=self.db,
                action=AuditAction.PAYMENT,
                resource="p2p_transfer",
                status=AuditStatus.ERROR,
                user_id=sender_user_id,
                request=request,
                meta={
                    "error": str(e),
                    "recipient_username": recipient_username,
                    "asset_code": asset_code,
                    "amount": str(amount),
                    "correlation_id": correlation_id
                }
            )
            
            raise

    def get_payment_history(
        self,
        user_id: str,
        asset_code: Optional[str] = None,
        transaction_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get payment history for a user with filtering options."""
        try:
            from ..common.models import Transaction
            from datetime import datetime
            
            # Build query
            query = self.db.query(Transaction).filter(Transaction.user_id == user_id)
            
            # Apply filters
            if asset_code:
                query = query.filter(Transaction.asset_code == asset_code)
                
            if transaction_type:
                query = query.filter(Transaction.tx_type == transaction_type)
                
            if start_date:
                try:
                    start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                    query = query.filter(Transaction.created_at >= start_dt)
                except ValueError:
                    raise ValueError(f"Invalid start_date format: {start_date}")
                    
            if end_date:
                try:
                    end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                    query = query.filter(Transaction.created_at <= end_dt)
                except ValueError:
                    raise ValueError(f"Invalid end_date format: {end_date}")
            
            # Get total count before applying pagination
            total = query.count()
            
            # Apply ordering and pagination
            transactions = (
                query
                .order_by(Transaction.created_at.desc())
                .offset(offset)
                .limit(limit)
                .all()
            )
            
            # Convert to response format
            payment_items = []
            for tx in transactions:
                payment_items.append({
                    "id": str(tx.id),
                    "user_id": str(tx.user_id),
                    "tx_type": tx.tx_type.value,
                    "asset_code": tx.asset_code,
                    "amount": tx.amount,
                    "status": tx.status.value,
                    "destination": tx.destination,
                    "memo": tx.memo,
                    "created_at": tx.created_at.isoformat()
                })
            
            logger.info(f"Payment history retrieved", extra={
                "user_id": user_id,
                "total_records": total,
                "returned_records": len(payment_items),
                "filters": {
                    "asset_code": asset_code,
                    "transaction_type": transaction_type,
                    "start_date": start_date,
                    "end_date": end_date
                }
            })
            
            return {
                "payments": payment_items,
                "total": total,
                "limit": limit,
                "offset": offset
            }
            
        except Exception as e:
            logger.error(f"Failed to retrieve payment history for user {user_id}: {e}")
            raise

    def get_payment_status(
        self,
        payment_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Get status of a specific payment."""
        try:
            from ..common.models import Transaction
            
            # Find the transaction
            transaction = (
                self.db.query(Transaction)
                .filter(
                    Transaction.id == payment_id,
                    Transaction.user_id == user_id
                )
                .first()
            )
            
            if not transaction:
                raise ValueError("Payment not found or access denied")
            
            logger.info(f"Payment status retrieved", extra={
                "payment_id": payment_id,
                "user_id": user_id,
                "status": transaction.status.value
            })
            
            return {
                "id": str(transaction.id),
                "tx_type": transaction.tx_type.value,
                "asset_code": transaction.asset_code,
                "amount": transaction.amount,
                "status": transaction.status.value,
                "destination": transaction.destination,
                "memo": transaction.memo,
                "created_at": transaction.created_at.isoformat(),
                "updated_at": transaction.updated_at.isoformat() if transaction.updated_at else transaction.created_at.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get payment status for {payment_id}: {e}")
            raise
    
    def update_payment_status(
        self,
        payment_id: str,
        new_status: str,
        admin_user_id: str,
        reason: Optional[str] = None,
        request: Request = None
    ) -> Dict[str, Any]:
        """Update payment status (admin function)."""
        try:
            from ..common.models import Transaction, TransactionStatus
            from datetime import datetime
            
            # Validate status
            try:
                status_enum = TransactionStatus(new_status)
            except ValueError:
                raise ValueError(f"Invalid status: {new_status}")
            
            # Find the transaction
            transaction = (
                self.db.query(Transaction)
                .filter(Transaction.id == payment_id)
                .first()
            )
            
            if not transaction:
                raise ValueError("Payment not found")
            
            old_status = transaction.status.value
            
            # Update status and timestamp
            transaction.status = status_enum
            transaction.updated_at = datetime.utcnow()
            
            self.db.commit()
            
            logger.info(f"Payment status updated", extra={
                "payment_id": payment_id,
                "old_status": old_status,
                "new_status": new_status,
                "admin_user_id": admin_user_id,
                "reason": reason
            })
            
            # Audit status change
            write_audit(
                db=self.db,
                action=AuditAction.UPDATE,
                resource="payment_status",
                status=AuditStatus.SUCCESS,
                user_id=admin_user_id,
                resource_id=payment_id,
                request=request,
                meta={
                    "old_status": old_status,
                    "new_status": new_status,
                    "reason": reason,
                    "payment_user_id": str(transaction.user_id)
                }
            )
            
            return {
                "id": str(transaction.id),
                "tx_type": transaction.tx_type.value,
                "asset_code": transaction.asset_code,
                "amount": transaction.amount,
                "status": transaction.status.value,
                "destination": transaction.destination,
                "memo": transaction.memo,
                "created_at": transaction.created_at.isoformat(),
                "updated_at": transaction.updated_at.isoformat()
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update payment status for {payment_id}: {e}")
            
            # Audit status change failure
            write_audit(
                db=self.db,
                action=AuditAction.UPDATE,
                resource="payment_status",
                status=AuditStatus.ERROR,
                user_id=admin_user_id,
                resource_id=payment_id,
                request=request,
                meta={
                    "error": str(e),
                    "attempted_status": new_status,
                    "reason": reason
                }
            )
            
            raise
