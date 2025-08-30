"""Wallet service API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..common.database import get_db
from ..common.auth import get_current_user
from ..common.middleware import get_correlation_id
from .schema import BalancesResponse, PaymentRequest, PaymentResponse, SwapRequest, SwapResponse
from .service import WalletService

router = APIRouter(prefix="/wallet", tags=["Wallet"])


@router.get("/balances", response_model=BalancesResponse)
async def get_balances(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user wallet balances."""
    try:
        service = WalletService(db)
        balances = service.get_balances(str(current_user.id))
        return BalancesResponse(balances=balances)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/payment", response_model=PaymentResponse)
async def process_payment(
    payment: PaymentRequest,
    correlation_id: str = Depends(get_correlation_id),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process payment transaction."""
    try:
        service = WalletService(db)
        result = service.process_payment(
            user_id=str(current_user.id),
            destination=payment.destination,
            asset_code=payment.asset_code,
            amount=payment.amount,
            memo=payment.memo,
            correlation_id=correlation_id
        )
        return PaymentResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/swap", response_model=SwapResponse)
async def process_swap(
    swap: SwapRequest,
    correlation_id: str = Depends(get_correlation_id),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process asset swap transaction."""
    try:
        service = WalletService(db)
        result = service.process_swap(
            user_id=str(current_user.id),
            sell_asset=swap.sell_asset,
            buy_asset=swap.buy_asset,
            amount=swap.amount,
            correlation_id=correlation_id
        )
        return SwapResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))