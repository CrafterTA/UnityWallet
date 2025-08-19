"""Payments service API routes."""

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from ..common.database import get_db
from ..common.auth import get_current_user
from ..common.middleware import get_correlation_id
from .schema import QRCreateRequest, QRCreateResponse, QRPayRequest, QRPayResponse
from .service import PaymentsService

router = APIRouter(prefix="/qr", tags=["Payments"])


@router.post("/create", response_model=QRCreateResponse)
async def create_qr_payment(
    request: QRCreateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create QR code for payment request."""
    try:
        service = PaymentsService(db)
        result = service.create_qr_payment(
            user_id=str(current_user.id),
            asset_code=request.asset_code,
            amount=request.amount,
            memo=request.memo
        )
        return QRCreateResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pay", response_model=QRPayResponse)
async def pay_qr_code(
    request: QRPayRequest,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    correlation_id: str = Depends(get_correlation_id),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Pay using QR code with idempotency support."""
    try:
        service = PaymentsService(db)
        result = service.process_qr_payment(
            qr_id=request.qr_id,
            payer_user_id=str(current_user.id),
            idempotency_key=idempotency_key,
            correlation_id=correlation_id
        )
        return QRPayResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))