"""Analytics service business logic."""

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from decimal import Decimal
from ..common.models import Transaction, TransactionType, Alert, CreditScore, LoyaltyPoint
from ..common.logging import get_logger

logger = get_logger("analytics_service")


class AnalyticsService:
    """Service for analytics, insights, and credit scoring."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_30d_spending(self, user_id: str) -> Decimal:
        """Get user's spending in last 30 days."""
        try:
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            
            # Sum all outgoing transactions (payments, swaps, burns)
            total_spent = (
                self.db.query(func.sum(Transaction.amount))
                .filter(
                    and_(
                        Transaction.user_id == user_id,
                        Transaction.created_at >= thirty_days_ago,
                        Transaction.tx_type.in_([
                            TransactionType.PAYMENT,
                            TransactionType.SWAP, 
                            TransactionType.BURN
                        ]),
                        Transaction.amount > 0  # Only positive amounts (outgoing)
                    )
                )
                .scalar()
            )
            
            return total_spent or Decimal("0")
            
        except Exception as e:
            logger.error(f"Failed to get 30d spending for user {user_id}: {e}")
            return Decimal("0")
    
    def get_insights(self, user_id: str) -> List[Dict[str, str]]:
        """Get mock insights for user."""
        try:
            # Get some real data
            spending = self.get_30d_spending(user_id)
            
            loyalty = (
                self.db.query(LoyaltyPoint)
                .filter(LoyaltyPoint.user_id == user_id)
                .first()
            )
            
            points = loyalty.points if loyalty else 0
            
            # Generate mock insights with some real data
            insights = [
                {
                    "title": "Monthly Spending",
                    "value": f"${spending} in last 30 days"
                },
                {
                    "title": "Loyalty Points", 
                    "value": f"{points} SYP points available"
                },
                {
                    "title": "Savings Goal",
                    "value": "63% towards emergency fund"
                },
                {
                    "title": "Investment Tip",
                    "value": "Consider diversifying into Stellar-based DeFi"
                },
                {
                    "title": "Reward Status",
                    "value": "Platinum tier - 2x points on swaps"
                }
            ]
            
            return insights
            
        except Exception as e:
            logger.error(f"Failed to get insights for user {user_id}: {e}")
            return [{"title": "Status", "value": "Analytics temporarily unavailable"}]
    
    def get_credit_score(self, user_id: str) -> int:
        """Get user's credit score."""
        try:
            credit_score = (
                self.db.query(CreditScore)
                .filter(CreditScore.user_id == user_id)
                .order_by(CreditScore.updated_at.desc())
                .first()
            )
            
            if credit_score:
                return credit_score.score
            
            # Mock score calculation based on transaction history
            tx_count = (
                self.db.query(func.count(Transaction.id))
                .filter(Transaction.user_id == user_id)
                .scalar()
            )
            
            # Simple mock scoring: more transactions = higher score
            base_score = 650
            bonus = min(tx_count * 5, 100)  # Max 100 point bonus
            
            return base_score + bonus
            
        except Exception as e:
            logger.error(f"Failed to get credit score for user {user_id}: {e}")
            return 680  # Default score
    
    def get_alerts(self, user_id: str) -> List[Dict[str, str]]:
        """Get user alerts."""
        try:
            alerts = (
                self.db.query(Alert)
                .filter(Alert.user_id == user_id)
                .order_by(Alert.created_at.desc())
                .limit(10)
                .all()
            )
            
            return [
                {
                    "type": alert.type.value,
                    "message": alert.message,
                    "created_at": alert.created_at.isoformat()
                }
                for alert in alerts
            ]
            
        except Exception as e:
            logger.error(f"Failed to get alerts for user {user_id}: {e}")
            return []