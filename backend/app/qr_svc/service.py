"""QR code service business logic"""
from sqlalchemy.orm import Session
from ..common.models import User, Account, Balance, Transaction, TransactionType, TransactionStatus, AuditAction, AuditStatus
from ..common.database import get_redis
from ..common.audit import write_audit
from .schema import QRCreateRequest, QRCreateResponse, QRPayRequest, QRPayResponse
from fastapi import HTTPException, status, Request
from decimal import Decimal
from datetime import datetime, timedelta
import json
import uuid
import logging

logger = logging.getLogger(__name__)


class QRService:
    """QR code payment service"""
    
    def __init__(self, db: Session):
        self.db = db
        self.redis = get_redis()
    
    def create_qr_code(self, user: User, request: QRCreateRequest, http_request: Request = None) -> QRCreateResponse:
        """Create a QR code for payment request"""
        logger.info(f"Creating QR code for user {user.username}: {request.amount} {request.asset_code}")
        
        # Check if user has account for this asset
        account = self.db.query(Account).filter(
            Account.user_id == user.id,
            Account.asset_code == request.asset_code
        ).first()
        
        if not account:
            # Audit QR creation failure
            write_audit(
                db=self.db,
                action=AuditAction.CREATE,
                resource="qr_code",
                status=AuditStatus.ERROR,
                user_id=str(user.id),
                request=http_request,
                meta={
                    "asset_code": request.asset_code,
                    "amount": str(request.amount),
                    "error": f"No {request.asset_code} account found"
                }
            )
            
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No {request.asset_code} account found"
            )
        
        # Generate QR ID
        qr_id = str(uuid.uuid4())
        
        # Set expiration (24 hours from now)
        created_at = datetime.utcnow()
        expires_at = created_at + timedelta(hours=24)
        
        # Store QR data in Redis with expiration
        qr_data = {
            "qr_id": qr_id,
            "user_id": str(user.id),
            "asset_code": request.asset_code,
            "amount": str(request.amount),
            "created_at": created_at.isoformat(),
            "expires_at": expires_at.isoformat(),
            "used": False
        }
        
        # Store in Redis with 24 hour expiration
        self.redis.setex(f"qr:{qr_id}", 86400, json.dumps(qr_data))
        
        logger.info(f"QR code {qr_id} created successfully")
        
        # Audit QR creation
        write_audit(
            db=self.db,
            action=AuditAction.CREATE,
            resource="qr_code",
            status=AuditStatus.SUCCESS,
            user_id=str(user.id),
            resource_id=qr_id,
            request=http_request,
            meta={
                "asset_code": request.asset_code,
                "amount": str(request.amount),
                "expires_at": expires_at.isoformat(),
                "stellar_address": account.stellar_address
            }
        )
        
        return QRCreateResponse(
            qr_id=qr_id,
            asset_code=request.asset_code,
            amount=request.amount,
            created_at=created_at,
            expires_at=expires_at
        )
    
    def pay_qr_code(self, user: User, request: QRPayRequest, idempotency_key: str = None, http_request: Request = None) -> QRPayResponse:
        """Pay a QR code"""
        logger.info(f"Processing QR payment from user {user.username} for QR {request.qr_id}")
        
        # Check for idempotency if key provided
        if idempotency_key:
            idem_key = f"idem:{idempotency_key}"
            existing_result = self.redis.get(idem_key)
            if existing_result:
                result = json.loads(existing_result)
                result["duplicate_ignored"] = True
                return QRPayResponse(**result)
        
        # Get QR data from Redis
        qr_data_str = self.redis.get(f"qr:{request.qr_id}")
        if not qr_data_str:
            # Audit QR payment failure
            write_audit(
                db=self.db,
                action=AuditAction.PAYMENT,
                resource="qr_code",
                status=AuditStatus.ERROR,
                user_id=str(user.id),
                resource_id=request.qr_id,
                request=http_request,
                meta={
                    "error": "QR code not found or expired",
                    "idempotency_key": idempotency_key
                }
            )
            
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="QR code not found or expired"
            )
        
        qr_data = json.loads(qr_data_str)
        
        # Check if QR code is already used
        if qr_data.get("used", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="QR code already used"
            )
        
        # Check if user is trying to pay their own QR code
        if str(user.id) == qr_data["user_id"]:
            # Audit QR payment failure
            write_audit(
                db=self.db,
                action=AuditAction.PAYMENT,
                resource="qr_code",
                status=AuditStatus.ERROR,
                user_id=str(user.id),
                resource_id=request.qr_id,
                request=http_request,
                meta={
                    "error": "Cannot pay your own QR code",
                    "asset_code": qr_data["asset_code"],
                    "amount": qr_data["amount"],
                    "idempotency_key": idempotency_key
                }
            )
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot pay your own QR code"
            )
        
        # Check if payer has account and sufficient balance
        payer_account = self.db.query(Account).filter(
            Account.user_id == user.id,
            Account.asset_code == qr_data["asset_code"]
        ).first()
        
        if not payer_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No {qr_data['asset_code']} account found"
            )
        
        payer_balance = self.db.query(Balance).filter(Balance.account_id == payer_account.id).first()
        amount = Decimal(qr_data["amount"])
        
        if not payer_balance or payer_balance.amount < amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient balance"
            )
        
        # Get recipient account  
        from uuid import UUID
        recipient_user_id = UUID(qr_data["user_id"])
        recipient_account = self.db.query(Account).filter(
            Account.user_id == recipient_user_id,
            Account.asset_code == qr_data["asset_code"]
        ).first()
        
        if not recipient_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipient account not found"
            )
        
        recipient_balance = self.db.query(Balance).filter(Balance.account_id == recipient_account.id).first()
        
        # Create transaction
        transaction = Transaction(
            user_id=user.id,
            tx_type=TransactionType.PAYMENT,
            asset_code=qr_data["asset_code"],
            amount=amount,
            status=TransactionStatus.SUCCESS,
            destination=recipient_account.stellar_address,
            memo="QR Payment",
            stellar_tx_hash=f"qr_payment_{request.qr_id}"
        )
        
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        
        # Update balances
        payer_balance.amount -= amount
        recipient_balance.amount += amount
        
        # Mark QR code as used
        qr_data["used"] = True
        self.redis.setex(f"qr:{request.qr_id}", 86400, json.dumps(qr_data))
        
        self.db.commit()
        
        result = QRPayResponse(
            success=True,
            transaction_id=transaction.id,
            message="Payment successful"
        )
        
        # Store idempotency result if key provided
        if idempotency_key:
            idem_key = f"idem:{idempotency_key}"
            self.redis.setex(idem_key, 3600, json.dumps({
                "success": True,
                "transaction_id": transaction.id,
                "message": "Payment successful"
            }))
        
        logger.info(f"QR payment successful: {amount} {qr_data['asset_code']}")
        
        # Audit successful QR payment
        write_audit(
            db=self.db,
            action=AuditAction.PAYMENT,
            resource="qr_code",
            status=AuditStatus.SUCCESS,
            user_id=str(user.id),
            resource_id=request.qr_id,
            request=http_request,
            meta={
                "asset_code": qr_data["asset_code"],
                "amount": str(amount),
                "recipient_user_id": qr_data["user_id"],
                "transaction_id": str(transaction.id),
                "idempotency_key": idempotency_key
            }
        )
        
        return result