"""Budget service business logic"""
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import List, Dict, Any
from datetime import datetime, timedelta
from ..common.logging import get_logger
from ..common.models import Budget
import uuid

logger = get_logger("budgets_service")


class BudgetService:
    """Service class for budget operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_budgets(self, user_id: str) -> Dict[str, Any]:
        """Get user budgets with spending analysis"""
        try:
            # Get user's custom budgets from database
            user_budgets = self.db.query(Budget).filter(Budget.user_id == user_id).all()
            
            # Get spending by category for current month
            current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # Query spending by category from transactions
            spending_query = text("""
                SELECT 
                    tx_type as category,
                    SUM(CAST(amount AS DECIMAL)) as spent
                FROM transactions 
                WHERE user_id = CAST(:user_id AS UUID)
                AND created_at >= :month_start
                AND tx_type IN ('PAYMENT', 'BURN')
                AND amount > 0
                GROUP BY tx_type
            """)
            
            spending_result = self.db.execute(spending_query, {
                'user_id': user_id,
                'month_start': current_month_start
            }).fetchall()
            
            # Convert to dict for easier lookup
            spending_by_category = {row.category: float(row.spent) for row in spending_result}
            
            # Default budget categories with limits (in VND) - fallback if no custom budgets
            default_budgets = {
                "dining": 1500000,      # 1.5M VND
                "shopping": 1000000,    # 1M VND
                "transport": 500000,    # 500K VND
                "entertainment": 800000, # 800K VND
                "healthcare": 300000,   # 300K VND
                "education": 500000,    # 500K VND
                "other": 1000000        # 1M VND
            }
            
            budgets = []
            total_limit = 0
            total_spent = 0
            
            # Use custom budgets if available, otherwise use defaults
            if user_budgets:
                for budget in user_budgets:
                    spent = spending_by_category.get(budget.category, 0.0)
                    limit = float(budget.limit)
                    remaining = limit - spent
                    percentage_used = (spent / limit) * 100 if limit > 0 else 0
                    
                    # Determine status
                    if percentage_used >= 100:
                        status = "exceeded"
                    elif percentage_used >= 80:
                        status = "warning"
                    else:
                        status = "on_track"
                    
                    budgets.append({
                        "category": budget.category,
                        "limit": limit,
                        "spent": spent,
                        "period": budget.period,
                        "remaining": remaining,
                        "percentage_used": round(percentage_used, 1),
                        "status": status
                    })
                    
                    total_limit += limit
                    total_spent += spent
            else:
                # Use default budgets if no custom ones exist
                for category, limit in default_budgets.items():
                    spent = spending_by_category.get(category, 0.0)
                    remaining = limit - spent
                    percentage_used = (spent / limit) * 100 if limit > 0 else 0
                    
                    # Determine status
                    if percentage_used >= 100:
                        status = "exceeded"
                    elif percentage_used >= 80:
                        status = "warning"
                    else:
                        status = "on_track"
                    
                    budgets.append({
                        "category": category,
                        "limit": limit,
                        "spent": spent,
                        "period": "monthly",
                        "remaining": remaining,
                        "percentage_used": round(percentage_used, 1),
                        "status": status
                    })
                    
                    total_limit += limit
                    total_spent += spent
            
            logger.info(f"Retrieved budgets for user", extra={
                "user_id": user_id,
                "budget_count": len(budgets),
                "total_limit": total_limit,
                "total_spent": total_spent
            })
            
            return {
                "budgets": budgets,
                "total_limit": total_limit,
                "total_spent": total_spent
            }
            
        except Exception as e:
            logger.error(f"Failed to get budgets", extra={
                "user_id": user_id,
                "error": str(e)
            })
            raise
    
    def create_budget(self, user_id: str, category: str, limit: float, period: str = "monthly") -> Dict[str, Any]:
        """Create or update a budget"""
        try:
            # Check if budget already exists for this user and category
            existing_budget = self.db.query(Budget).filter(
                Budget.user_id == user_id,
                Budget.category == category
            ).first()
            
            if existing_budget:
                # Update existing budget
                existing_budget.limit = limit
                existing_budget.period = period
                existing_budget.updated_at = datetime.now()
                self.db.commit()
                
                logger.info(f"Budget updated successfully", extra={
                    "user_id": user_id,
                    "category": category,
                    "limit": limit,
                    "period": period
                })
                
                return {
                    "id": str(existing_budget.id),
                    "message": "Budget updated successfully",
                    "category": category,
                    "limit": limit,
                    "period": period
                }
            else:
                # Create new budget
                new_budget = Budget(
                    user_id=uuid.UUID(user_id),
                    category=category,
                    limit=limit,
                    period=period
                )
                
                self.db.add(new_budget)
                self.db.commit()
                self.db.refresh(new_budget)
                
                logger.info(f"Budget created successfully", extra={
                    "user_id": user_id,
                    "budget_id": str(new_budget.id),
                    "category": category,
                    "limit": limit,
                    "period": period
                })
                
                return {
                    "id": str(new_budget.id),
                    "message": "Budget created successfully",
                    "category": category,
                    "limit": limit,
                    "period": period
                }
                
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create budget", extra={
                "user_id": user_id,
                "category": category,
                "error": str(e)
            })
            raise
    
    def update_budget(self, user_id: str, category: str, **updates) -> Dict[str, Any]:
        """Update a budget"""
        try:
            # Find existing budget
            existing_budget = self.db.query(Budget).filter(
                Budget.user_id == user_id,
                Budget.category == category
            ).first()
            
            if not existing_budget:
                logger.warning(f"Budget not found for update", extra={
                    "user_id": user_id,
                    "category": category
                })
                raise ValueError(f"Budget not found for category: {category}")
            
            # Update fields
            if 'limit' in updates:
                existing_budget.limit = updates['limit']
            if 'period' in updates:
                existing_budget.period = updates['period']
            
            existing_budget.updated_at = datetime.now()
            self.db.commit()
            
            logger.info(f"Budget updated successfully", extra={
                "user_id": user_id,
                "budget_id": str(existing_budget.id),
                "category": category,
                "updates": updates
            })
            
            return {
                "id": str(existing_budget.id),
                "message": "Budget updated successfully",
                "category": category,
                "limit": float(existing_budget.limit),
                "period": existing_budget.period,
                "updates": updates
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update budget", extra={
                "user_id": user_id,
                "category": category,
                "error": str(e)
            })
            raise