"""Savings goals service Pydantic schemas"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class SavingsGoal(BaseModel):
    """Individual savings goal"""
    id: str = Field(..., description="Goal unique identifier")
    name: str = Field(..., description="Goal name")
    target_amount: float = Field(..., description="Target amount to save")
    current_amount: float = Field(..., description="Current saved amount")
    target_date: str = Field(..., description="Target completion date (ISO format)")
    start_date: str = Field(..., description="Goal start date (ISO format)")
    progress_percentage: float = Field(..., description="Progress percentage (0-100)")
    status: str = Field(..., description="Goal status (active, completed, paused)")
    monthly_target: float = Field(..., description="Monthly savings target to reach goal")
    days_remaining: int = Field(..., description="Days remaining to reach target")


class SavingsGoalsResponse(BaseModel):
    """Response model for savings goals list"""
    goals: List[SavingsGoal] = Field(..., description="List of user savings goals")
    total_target: float = Field(..., description="Total target amount across all goals")
    total_saved: float = Field(..., description="Total amount saved across all goals")
    
    class Config:
        json_schema_extra = {
            "example": {
                "goals": [
                    {
                        "id": "goal_123",
                        "name": "Mua laptop",
                        "target_amount": 20000000,
                        "current_amount": 5000000,
                        "target_date": "2024-12-31",
                        "start_date": "2024-01-01",
                        "progress_percentage": 25.0,
                        "status": "active",
                        "monthly_target": 1500000,
                        "days_remaining": 180
                    }
                ],
                "total_target": 20000000,
                "total_saved": 5000000
            }
        }


class SavingsGoalCreateRequest(BaseModel):
    """Request model for creating a savings goal"""
    name: str = Field(..., description="Goal name")
    target_amount: float = Field(..., gt=0, description="Target amount to save")
    target_date: str = Field(..., description="Target completion date (ISO format)")


class SavingsGoalUpdateRequest(BaseModel):
    """Request model for updating a savings goal"""
    name: Optional[str] = Field(None, description="New goal name")
    target_amount: Optional[float] = Field(None, gt=0, description="New target amount")
    target_date: Optional[str] = Field(None, description="New target date")
    current_amount: Optional[float] = Field(None, ge=0, description="Update current saved amount")