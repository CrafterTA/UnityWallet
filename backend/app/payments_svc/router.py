"""Payments service API routes."""

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from typing import Optional
from ..common.database import get_db
from ..common.auth import get_current_user
from ..common.middleware import get_correlation_id
from .schema import QRCreateRequest, QRCreateResponse, QRPayRequest, QRPayResponse, PaymentRequest, PaymentResponse, P2PTransferRequest, P2PTransferResponse, PaymentHistoryFilter, PaymentHistoryResponse, PaymentStatusResponse, PaymentStatusUpdate
from ..wallet_svc.service import WalletService
from .service import PaymentsService

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/qr/create", response_model=QRCreateResponse)
async def create_qr_payment(
    qr_request: QRCreateRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create QR code for payment request."""
    try:
        service = PaymentsService(db)
        result = service.create_qr_payment(
            user_id=str(current_user.id),
            asset_code=qr_request.asset_code,
            amount=qr_request.amount,
            memo=qr_request.memo,
            request=request
        )
        return QRCreateResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/qr/pay", response_model=QRPayResponse)
async def pay_qr_code(
    pay_request: QRPayRequest,
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    correlation_id: str = Depends(get_correlation_id),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Pay using QR code with idempotency support."""
    try:
        service = PaymentsService(db)
        result = service.process_qr_payment(
            qr_id=pay_request.qr_id,
            payer_user_id=str(current_user.id),
            idempotency_key=idempotency_key,
            correlation_id=correlation_id,
            request=request
        )
        return QRPayResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send", response_model=PaymentResponse)
async def send_payment(
    payment: PaymentRequest,
    request: Request,
    correlation_id: str = Depends(get_correlation_id),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send payment to destination address."""
    try:
        # Use wallet service for payment processing
        wallet_service = WalletService(db)
        result = wallet_service.process_payment(
            user_id=str(current_user.id),
            destination=payment.destination,
            asset_code=payment.asset_code,
            amount=payment.amount,
            memo=payment.memo,
            correlation_id=correlation_id,
            request=request
        )
        return PaymentResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/p2p", response_model=P2PTransferResponse)
async def p2p_transfer(
    transfer_request: P2PTransferRequest,
    request: Request,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    correlation_id: str = Depends(get_correlation_id),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send P2P transfer between wallet users."""
    try:
        service = PaymentsService(db)
        result = service.process_p2p_transfer(
            sender_user_id=str(current_user.id),
            recipient_username=transfer_request.recipient_username,
            asset_code=transfer_request.asset_code,
            amount=transfer_request.amount,
            memo=transfer_request.memo,
            idempotency_key=idempotency_key,
            correlation_id=correlation_id,
            request=request
        )
        return P2PTransferResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=PaymentHistoryResponse)
async def get_payment_history(
    asset_code: Optional[str] = None,
    transaction_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment history for the authenticated user with filtering options."""
    try:
        service = PaymentsService(db)
        result = service.get_payment_history(
            user_id=str(current_user.id),
            asset_code=asset_code,
            transaction_type=transaction_type,
            limit=limit,
            offset=offset,
            start_date=start_date,
            end_date=end_date
        )
        return PaymentHistoryResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{payment_id}", response_model=PaymentStatusResponse)
async def get_payment_status(
    payment_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get status of a specific payment."""
    try:
        service = PaymentsService(db)
        result = service.get_payment_status(
            payment_id=payment_id,
            user_id=str(current_user.id)
        )
        return PaymentStatusResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/status/{payment_id}", response_model=PaymentStatusResponse)
async def update_payment_status(
    payment_id: str,
    status_update: PaymentStatusUpdate,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update payment status (admin only - for now any authenticated user can use this for demo)."""
    try:
        service = PaymentsService(db)
        result = service.update_payment_status(
            payment_id=payment_id,
            new_status=status_update.status,
            admin_user_id=str(current_user.id),
            reason=status_update.reason,
            request=request
        )
        return PaymentStatusResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))