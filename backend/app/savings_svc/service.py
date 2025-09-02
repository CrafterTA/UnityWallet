"""Savings goals service business logic"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any
from datetime import datetime, timezone
import uuid
from ..common.logging import get_logger
from ..common.models import SavingsGoal

logger = get_logger("savings_service")


class SavingsService:
    """Service class for savings goals operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_savings_goals(self, user_id: str) -> Dict[str, Any]:
        """Get user savings goals with progress analysis"""
        try:
            # Get user's savings goals from database
            user_goals = self.db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).all()
            
            # Get user's current balance to estimate savings capacity for sample data
            balance_query = text("""
                SELECT SUM(CAST(amount AS DECIMAL)) as total_balance 
                FROM balances 
                WHERE account_id IN (
                    SELECT id FROM accounts WHERE user_id = CAST(:user_id AS UUID)
                )
            """)
            
            balance_result = self.db.execute(balance_query, {'user_id': user_id}).fetchone()
            total_balance = float(balance_result.total_balance) if balance_result and balance_result.total_balance else 0
            
            goals = []
            total_target = 0
            total_saved = 0
            
            # Use actual savings goals if available, otherwise provide sample data
            if user_goals:
                for goal in user_goals:
                    current_amount = float(goal.current_amount)
                    target_amount = float(goal.target_amount)
                    
                    # Calculate progress
                    progress_percentage = (current_amount / target_amount) * 100 if target_amount > 0 else 0
                    
                    # Calculate days remaining  
                    now = datetime.now()
                    if goal.target_date.tzinfo is not None:
                        # target_date is timezone-aware, make now timezone-aware too
                        now = now.replace(tzinfo=timezone.utc)
                    days_remaining = max(0, (goal.target_date - now).days)
                    
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
                        status = goal.status
                    
                    goals.append({
                        "id": str(goal.id),
                        "name": goal.name,
                        "target_amount": target_amount,
                        "current_amount": current_amount,
                        "target_date": goal.target_date.strftime("%Y-%m-%d"),
                        "start_date": goal.start_date.strftime("%Y-%m-%d"),
                        "progress_percentage": round(progress_percentage, 1),
                        "status": status,
                        "monthly_target": round(monthly_target, 0),
                        "days_remaining": days_remaining
                    })
                    
                    total_target += target_amount
                    total_saved += current_amount
            else:
                # Sample savings goals based on Vietnamese financial patterns (fallback)
                sample_goals = [
                    {
                        "id": f"sample_{uuid.uuid4().hex[:8]}",
                        "name": "Mua laptop mới",
                        "target_amount": 20000000,  # 20M VND
                        "current_amount": min(5000000, total_balance * 0.25),  # 25% of balance or 5M
                        "target_date": "2024-12-31",
                        "start_date": "2024-01-01"
                    },
                    {
                        "id": f"sample_{uuid.uuid4().hex[:8]}",
                        "name": "Du lịch Đà Lạt",
                        "target_amount": 8000000,   # 8M VND
                        "current_amount": min(2000000, total_balance * 0.15),  # 15% of balance or 2M
                        "target_date": "2024-10-15",
                        "start_date": "2024-06-01"
                    },
                    {
                        "id": f"sample_{uuid.uuid4().hex[:8]}",
                        "name": "Quỹ khẩn cấp",
                        "target_amount": 30000000,  # 30M VND
                        "current_amount": min(10000000, total_balance * 0.4), # 40% of balance or 10M
                        "target_date": "2025-06-30",
                        "start_date": "2024-01-01"
                    }
                ]
                
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
        """Create a new savings goal"""
        try:
            # Parse target date
            target_datetime = datetime.strptime(target_date, "%Y-%m-%d")
            
            # Create new savings goal
            new_goal = SavingsGoal(
                user_id=uuid.UUID(user_id),
                name=name,
                target_amount=target_amount,
                target_date=target_datetime,
                current_amount=0,  # Start with 0
                status="active"
            )
            
            self.db.add(new_goal)
            self.db.commit()
            self.db.refresh(new_goal)
            
            logger.info(f"Savings goal created successfully", extra={
                "user_id": user_id,
                "goal_id": str(new_goal.id),
                "goal_name": name,
                "target_amount": target_amount,
                "target_date": target_date
            })
            
            return {
                "id": str(new_goal.id),
                "message": "Savings goal created successfully",
                "name": name,
                "target_amount": target_amount,
                "current_amount": 0,
                "target_date": target_date,
                "status": "active"
            }
            
        except ValueError as e:
            logger.error(f"Invalid date format", extra={
                "user_id": user_id,
                "target_date": target_date,
                "error": str(e)
            })
            raise ValueError("Invalid date format. Please use YYYY-MM-DD format.")
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create savings goal", extra={
                "user_id": user_id,
                "goal_name": name,
                "error": str(e)
            })
            raise
    
    def update_savings_goal(self, user_id: str, goal_id: str, **updates) -> Dict[str, Any]:
        """Update a savings goal"""
        try:
            # Find existing savings goal
            existing_goal = self.db.query(SavingsGoal).filter(
                SavingsGoal.id == uuid.UUID(goal_id),
                SavingsGoal.user_id == user_id
            ).first()
            
            if not existing_goal:
                logger.warning(f"Savings goal not found for update", extra={
                    "user_id": user_id,
                    "goal_id": goal_id
                })
                raise ValueError(f"Savings goal not found with ID: {goal_id}")
            
            # Update fields
            if 'name' in updates:
                existing_goal.name = updates['name']
            if 'target_amount' in updates:
                existing_goal.target_amount = updates['target_amount']
            if 'current_amount' in updates:
                existing_goal.current_amount = updates['current_amount']
            if 'target_date' in updates:
                existing_goal.target_date = datetime.strptime(updates['target_date'], "%Y-%m-%d")
            
            existing_goal.updated_at = datetime.now()
            self.db.commit()
            
            logger.info(f"Savings goal updated successfully", extra={
                "user_id": user_id,
                "goal_id": goal_id,
                "updates": updates
            })
            
            return {
                "id": str(existing_goal.id),
                "message": "Savings goal updated successfully",
                "name": existing_goal.name,
                "target_amount": float(existing_goal.target_amount),
                "current_amount": float(existing_goal.current_amount),
                "target_date": existing_goal.target_date.strftime("%Y-%m-%d"),
                "status": existing_goal.status,
                "updates": updates
            }
            
        except ValueError as e:
            logger.error(f"Invalid goal ID or date format", extra={
                "user_id": user_id,
                "goal_id": goal_id,
                "error": str(e)
            })
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update savings goal", extra={
                "user_id": user_id,
                "goal_id": goal_id,
                "error": str(e)
            })
            raise