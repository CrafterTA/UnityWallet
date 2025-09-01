"""Savings goals service business logic"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any
from datetime import datetime
import uuid
from ..common.logging import get_logger

logger = get_logger("savings_service")


class SavingsService:
    """Service class for savings goals operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_savings_goals(self, user_id: str) -> Dict[str, Any]:
        """Get user savings goals with progress analysis"""
        try:
            # For now, return sample data based on user's balance and activity
            # In production, this would query a savings_goals table
            
            # Get user's current balance to estimate savings capacity
            balance_query = text("""
                SELECT SUM(CAST(balance AS DECIMAL)) as total_balance 
                FROM balances 
                WHERE user_id = :user_id::UUID
            """)
            
            balance_result = self.db.execute(balance_query, {'user_id': user_id}).fetchone()
            total_balance = float(balance_result.total_balance) if balance_result and balance_result.total_balance else 0
            
            # Sample savings goals based on Vietnamese financial patterns
            sample_goals = [
                {
                    "id": f"goal_{uuid.uuid4().hex[:8]}",
                    "name": "Mua laptop mới",
                    "target_amount": 20000000,  # 20M VND
                    "current_amount": min(5000000, total_balance * 0.25),  # 25% of balance or 5M
                    "target_date": "2024-12-31",
                    "start_date": "2024-01-01"
                },
                {
                    "id": f"goal_{uuid.uuid4().hex[:8]}",
                    "name": "Du lịch Đà Lạt",
                    "target_amount": 8000000,   # 8M VND
                    "current_amount": min(2000000, total_balance * 0.15),  # 15% of balance or 2M
                    "target_date": "2024-10-15",
                    "start_date": "2024-06-01"
                },
                {
                    "id": f"goal_{uuid.uuid4().hex[:8]}",
                    "name": "Quỹ khẩn cấp",
                    "target_amount": 30000000,  # 30M VND
                    "current_amount": min(10000000, total_balance * 0.4), # 40% of balance or 10M
                    "target_date": "2025-06-30",
                    "start_date": "2024-01-01"
                }
            ]
            
            goals = []
            total_target = 0
            total_saved = 0
            
            for goal_data in sample_goals:
                current_amount = goal_data["current_amount"]
                target_amount = goal_data["target_amount"]
                
                # Calculate progress
                progress_percentage = (current_amount / target_amount) * 100 if target_amount > 0 else 0
                
                # Calculate days remaining
                target_date = datetime.strptime(goal_data["target_date"], "%Y-%m-%d")
                days_remaining = max(0, (target_date - datetime.now()).days)
                
                # Calculate monthly target
                months_remaining = max(1, days_remaining / 30)
                remaining_amount = max(0, target_amount - current_amount)
                monthly_target = remaining_amount / months_remaining
                
                # Determine status
                if progress_percentage >= 100:
                    status = "completed"
                elif days_remaining <= 0:
                    status = "overdue"
                else:
                    status = "active"
                
                goals.append({
                    "id": goal_data["id"],
                    "name": goal_data["name"],
                    "target_amount": target_amount,
                    "current_amount": current_amount,
                    "target_date": goal_data["target_date"],
                    "start_date": goal_data["start_date"],
                    "progress_percentage": round(progress_percentage, 1),
                    "status": status,
                    "monthly_target": round(monthly_target, 0),
                    "days_remaining": days_remaining
                })
                
                total_target += target_amount
                total_saved += current_amount
            
            logger.info(f"Retrieved savings goals for user", extra={
                "user_id": user_id,
                "goals_count": len(goals),
                "total_target": total_target,
                "total_saved": total_saved
            })
            
            return {
                "goals": goals,
                "total_target": total_target,
                "total_saved": total_saved
            }
            
        except Exception as e:
            logger.error(f"Failed to get savings goals", extra={
                "user_id": user_id,
                "error": str(e)
            })
            raise
    
    def create_savings_goal(self, user_id: str, name: str, target_amount: float, target_date: str) -> Dict[str, Any]:
        """Create a new savings goal (placeholder for future enhancement)"""
        logger.info(f"Savings goal creation requested", extra={
            "user_id": user_id,
            "name": name,
            "target_amount": target_amount,
            "target_date": target_date
        })
        
        return {
            "message": "Savings goal functionality coming soon - currently showing sample goals",
            "name": name,
            "target_amount": target_amount,
            "target_date": target_date,
            "id": f"goal_{uuid.uuid4().hex[:8]}"
        }
    
    def update_savings_goal(self, user_id: str, goal_id: str, **updates) -> Dict[str, Any]:
        """Update a savings goal (placeholder for future enhancement)"""
        logger.info(f"Savings goal update requested", extra={
            "user_id": user_id,
            "goal_id": goal_id,
            "updates": updates
        })
        
        return {
            "message": "Savings goal update functionality coming soon",
            "goal_id": goal_id,
            "updates": updates
        }