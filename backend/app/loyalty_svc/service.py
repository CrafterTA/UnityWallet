"""Loyalty service business logic."""

from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from ..common.models import LoyaltyPoint, Transaction, TransactionType, TransactionStatus
from ..common.logging import get_logger, log_transaction
import uuid

logger = get_logger("loyalty_service")


class LoyaltyService:
    """Service for SYP loyalty points management."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_or_create_loyalty_account(self, user_id: str) -> LoyaltyPoint:
        """Get or create user loyalty points account."""
        loyalty = (
            self.db.query(LoyaltyPoint)
            .filter(LoyaltyPoint.user_id == user_id)
            .first()
        )
        
        if not loyalty:
            loyalty = LoyaltyPoint(
                id=uuid.uuid4(),
                user_id=user_id,
                points=0
            )
            self.db.add(loyalty)
            self.db.flush()
        
        return loyalty
    
    def earn_points(
        self,
        user_id: str,
        points: int,
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Award loyalty points to user."""
        try:
            loyalty = self.get_or_create_loyalty_account(user_id)
            
            # Create transaction record
            transaction = Transaction(
                id=uuid.uuid4(),
                user_id=user_id,
                tx_type=TransactionType.EARN,
                asset_code="SYP",
                amount=points,
                status=TransactionStatus.SUCCESS
            )
            
            # Update loyalty points
            loyalty.points += points
            
            self.db.add(transaction)
            self.db.commit()
            
            log_transaction(
                logger,
                str(transaction.id),
                user_id,
                "earn",
                float(points),
                "SYP",
                "success",
                correlation_id=correlation_id,
                extra={"total_points": loyalty.points}
            )
            
            return {
                "ok": True,
                "points": points,
                "total_points": loyalty.points
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Earn points failed for user {user_id}: {e}")
            raise
    
    def burn_points(
        self,
        user_id: str,
        points: int,
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Burn/spend user loyalty points."""
        try:
            loyalty = self.get_or_create_loyalty_account(user_id)
            
            if loyalty.points < points:
                raise ValueError("Insufficient loyalty points")
            
            # Create transaction record
            transaction = Transaction(
                id=uuid.uuid4(),
                user_id=user_id,
                tx_type=TransactionType.BURN,
                asset_code="SYP",
                amount=-points,  # Negative for burn
                status=TransactionStatus.SUCCESS
            )
            
            # Update loyalty points
            loyalty.points -= points
            
            self.db.add(transaction)
            self.db.commit()
            
            log_transaction(
                logger,
                str(transaction.id),
                user_id,
                "burn",
                float(points),
                "SYP", 
                "success",
                correlation_id=correlation_id,
                extra={"total_points": loyalty.points}
            )
            
            return {
                "ok": True,
                "points": points,
                "total_points": loyalty.points
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Burn points failed for user {user_id}: {e}")
            raise
    
    def get_points_balance(self, user_id: str) -> int:
        """Get user's current loyalty points balance."""
        loyalty = (
            self.db.query(LoyaltyPoint)
            .filter(LoyaltyPoint.user_id == user_id)
            .first()
        )
        return loyalty.points if loyalty else 0