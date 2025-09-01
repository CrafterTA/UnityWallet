"""Budget API routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..common.auth import get_current_user
from ..common.database import get_db
from ..common.logging import get_logger
from .service import BudgetService
from .schema import BudgetsResponse, BudgetCreateRequest, BudgetUpdateRequest

router = APIRouter(prefix="/budgets", tags=["Budgets"])
logger = get_logger("budgets_router")


@router.get("/", response_model=BudgetsResponse)
async def get_budgets(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user budgets with spending analysis"""
    try:
        service = BudgetService(db)
        budgets_data = service.get_budgets(str(current_user.id))
        return BudgetsResponse(**budgets_data)
    except Exception as e:
        logger.error(f"Failed to get budgets", extra={
            "user_id": str(current_user.id),
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail="Failed to retrieve budgets")


@router.post("/")
async def create_budget(
    request: BudgetCreateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new budget (placeholder for future enhancement)"""
    try:
        service = BudgetService(db)
        result = service.create_budget(
            str(current_user.id), 
            request.category, 
            request.limit, 
            request.period
        )
        return result
    except Exception as e:
        logger.error(f"Failed to create budget", extra={
            "user_id": str(current_user.id),
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail="Failed to create budget")


@router.put("/{category}")
async def update_budget(
    category: str,
    request: BudgetUpdateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing budget (placeholder for future enhancement)"""
    try:
        service = BudgetService(db)
        updates = request.dict(exclude_unset=True)
        result = service.update_budget(str(current_user.id), category, **updates)
        return result
    except Exception as e:
        logger.error(f"Failed to update budget", extra={
            "user_id": str(current_user.id),
            "category": category,
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail="Failed to update budget")