"""Budget service business logic"""
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import List, Dict, Any
from datetime import datetime, timedelta
from ..common.logging import get_logger

logger = get_logger("budgets_service")


class BudgetService:
    """Service class for budget operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_budgets(self, user_id: str) -> Dict[str, Any]:
        """Get user budgets with spending analysis"""
        try:
            # Get spending by category for current month
            current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # Query spending by category from transactions
            spending_query = text("""
                SELECT 
                    tx_type as category,
                    SUM(CAST(amount AS DECIMAL)) as spent
                FROM transactions 
                WHERE user_id = :user_id::UUID
                AND created_at >= :month_start
                AND tx_type IN ('payment', 'burn')
                AND amount > 0
                GROUP BY tx_type
            """)
            
            spending_result = self.db.execute(spending_query, {
                'user_id': user_id,
                'month_start': current_month_start
            }).fetchall()
            
            # Convert to dict for easier lookup
            spending_by_category = {row.category: float(row.spent) for row in spending_result}
            
            # Default budget categories with limits (in VND)
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
        """Create or update a budget (placeholder for future enhancement)"""
        logger.info(f"Budget creation requested", extra={
            "user_id": user_id,
            "category": category,
            "limit": limit,
            "period": period
        })
        
        return {
            "message": "Budget functionality coming soon - currently using default budgets",
            "category": category,
            "limit": limit,
            "period": period
        }
    
    def update_budget(self, user_id: str, category: str, **updates) -> Dict[str, Any]:
        """Update a budget (placeholder for future enhancement)"""
        logger.info(f"Budget update requested", extra={
            "user_id": user_id,
            "category": category,
            "updates": updates
        })
        
        return {
            "message": "Budget update functionality coming soon",
            "category": category,
            "updates": updates
        }