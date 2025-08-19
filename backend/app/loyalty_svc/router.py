"""Loyalty service API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..common.database import get_db
from ..common.auth import get_current_user
from ..common.middleware import get_correlation_id
from .schema import LoyaltyRequest, LoyaltyResponse
from .service import LoyaltyService

router = APIRouter(prefix="/loyalty", tags=["Loyalty"])


@router.post("/earn", response_model=LoyaltyResponse)
async def earn_loyalty_points(
    request: LoyaltyRequest,
    correlation_id: str = Depends(get_correlation_id),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Earn loyalty points."""
    try:
        service = LoyaltyService(db)
        result = service.earn_points(
            user_id=str(current_user.id),
            points=request.points,
            correlation_id=correlation_id
        )
        return LoyaltyResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/burn", response_model=LoyaltyResponse)  
async def burn_loyalty_points(
    request: LoyaltyRequest,
    correlation_id: str = Depends(get_correlation_id),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Burn/spend loyalty points."""
    try:
        service = LoyaltyService(db)
        result = service.burn_points(
            user_id=str(current_user.id),
            points=request.points,
            correlation_id=correlation_id
        )
        return LoyaltyResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))