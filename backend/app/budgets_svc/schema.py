"""Budget service Pydantic schemas"""
from typing import List, Optional

from pydantic import BaseModel, Field


class Budget(BaseModel):
    """Individual budget item"""
    category: str = Field(..., description="Spending category")
    limit: float = Field(..., description="Budget limit amount")
    spent: float = Field(..., description="Amount already spent")
    period: str = Field(..., description="Budget period (monthly, weekly, etc.)")
    remaining: float = Field(..., description="Remaining budget amount")
    percentage_used: float = Field(..., description="Percentage of budget used")
    status: str = Field(..., description="Budget status (on_track, warning, exceeded)")


class BudgetsResponse(BaseModel):
    """Response model for budgets list"""
    budgets: List[Budget] = Field(..., description="List of user budgets")
    total_limit: float = Field(..., description="Total budget limit across all categories")
    total_spent: float = Field(..., description="Total amount spent across all categories")
    
    class Config:
        json_schema_extra = {
            "example": {
                "budgets": [
                    {
                        "category": "dining",
                        "limit": 1500000,
                        "spent": 1200000,
                        "period": "monthly",
                        "remaining": 300000,
                        "percentage_used": 80.0,
                        "status": "warning"
                    },
                    {
                        "category": "shopping", 
                        "limit": 1000000,
                        "spent": 1200000,
                        "period": "monthly",
                        "remaining": -200000,
                        "percentage_used": 120.0,
                        "status": "exceeded"
                    }
                ],
                "total_limit": 2500000,
                "total_spent": 2400000
            }
        }


class BudgetCreateRequest(BaseModel):
    """Request model for creating a budget"""
    category: str = Field(..., description="Spending category")
    limit: float = Field(..., gt=0, description="Budget limit amount")
    period: str = Field(default="monthly", description="Budget period")


class BudgetUpdateRequest(BaseModel):
    """Request model for updating a budget"""
    limit: Optional[float] = Field(None, gt=0, description="New budget limit")
    period: Optional[str] = Field(None, description="New budget period")