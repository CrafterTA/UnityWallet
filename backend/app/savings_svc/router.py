"""Savings goals API routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..common.auth import get_current_user
from ..common.database import get_db
from ..common.logging import get_logger
from .service import SavingsService
from .schema import SavingsGoalsResponse, SavingsGoalCreateRequest, SavingsGoalUpdateRequest

router = APIRouter(prefix="/savings", tags=["Savings"])
logger = get_logger("savings_router")


@router.get("/goals", response_model=SavingsGoalsResponse)
async def get_savings_goals(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user savings goals with progress analysis"""
    try:
        service = SavingsService(db)
        goals_data = service.get_savings_goals(str(current_user.id))
        return SavingsGoalsResponse(**goals_data)
    except Exception as e:
        logger.error(f"Failed to get savings goals", extra={
            "user_id": str(current_user.id),
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail="Failed to retrieve savings goals")


@router.post("/goals")
async def create_savings_goal(
    request: SavingsGoalCreateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new savings goal (placeholder for future enhancement)"""
    try:
        service = SavingsService(db)
        result = service.create_savings_goal(
            str(current_user.id),
            request.name,
            request.target_amount,
            request.target_date
        )
        return result
    except Exception as e:
        logger.error(f"Failed to create savings goal", extra={
            "user_id": str(current_user.id),
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail="Failed to create savings goal")


@router.put("/goals/{goal_id}")
async def update_savings_goal(
    goal_id: str,
    request: SavingsGoalUpdateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing savings goal (placeholder for future enhancement)"""
    try:
        service = SavingsService(db)
        updates = request.dict(exclude_unset=True)
        result = service.update_savings_goal(str(current_user.id), goal_id, **updates)
        return result
    except Exception as e:
        logger.error(f"Failed to update savings goal", extra={
            "user_id": str(current_user.id),
            "goal_id": goal_id,
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail="Failed to update savings goal")