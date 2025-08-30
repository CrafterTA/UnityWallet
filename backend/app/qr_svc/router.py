"""QR code service router"""
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from typing import Optional
from ..common.database import get_db
from ..common.auth import get_current_user
from ..common.models import User
from .service import QRService
from .schema import QRCreateRequest, QRCreateResponse, QRPayRequest, QRPayResponse

router = APIRouter(prefix="/qr", tags=["QR Codes"])


@router.post("/create", response_model=QRCreateResponse, status_code=201)
async def create_qr_code(
    request: QRCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a QR code for payment request
    
    - **asset_code**: Asset to request (e.g., SYP, USD)
    - **amount**: Amount to request
    
    Creates a QR code that others can pay.
    """
    qr_service = QRService(db)
    return qr_service.create_qr_code(current_user, request)


@router.post("/pay", response_model=QRPayResponse)
async def pay_qr_code(
    request: QRPayRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key")
):
    """
    Pay a QR code
    
    - **qr_id**: ID of the QR code to pay
    
    Pays the amount specified in the QR code.
    Supports idempotency via Idempotency-Key header.
    """
    qr_service = QRService(db)
    return qr_service.pay_qr_code(current_user, request, idempotency_key)