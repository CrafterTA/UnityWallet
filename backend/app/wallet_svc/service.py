"""Wallet service business logic."""

from decimal import Decimal
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..common.models import Balance, Account, Transaction, TransactionType, TransactionStatus
from ..common.database import get_db
from ..common.logging import get_logger, log_transaction
from ..common.stellar_adapter import get_stellar_adapter
import uuid

logger = get_logger("wallet_service")


class WalletService:
    """Wallet service for balance and transaction management."""
    
    def __init__(self, db: Session):
        self.db = db
        self.stellar = get_stellar_adapter()
    
    def get_balances(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user balances for all assets."""
        try:
            balances = (
                self.db.query(Balance)
                .join(Account)
                .filter(Account.user_id == user_id)
                .all()
            )
            
            return [
                {
                    "asset_code": balance.asset_code,
                    "amount": balance.amount
                }
                for balance in balances
            ]
        except Exception as e:
            logger.error(f"Failed to get balances for user {user_id}: {e}")
            raise
    
    def process_payment(
        self, 
        user_id: str, 
        destination: str, 
        asset_code: str, 
        amount: Decimal,
        memo: Optional[str] = None,
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process payment transaction."""
        tx_id = str(uuid.uuid4())
        
        try:
            # Get user account for asset
            account = (
                self.db.query(Account)
                .filter(Account.user_id == user_id, Account.asset_code == asset_code)
                .first()
            )
            
            if not account:
                raise ValueError(f"No account found for asset {asset_code}")
            
            # Get balance
            balance = (
                self.db.query(Balance)
                .filter(Balance.account_id == account.id, Balance.asset_code == asset_code)
                .first()
            )
            
            if not balance or balance.amount < amount:
                raise ValueError("Insufficient balance")
            
            # Create transaction record
            transaction = Transaction(
                id=uuid.uuid4(),
                user_id=user_id,
                tx_type=TransactionType.PAYMENT,
                asset_code=asset_code,
                amount=amount,
                status=TransactionStatus.PENDING,
                destination=destination,
                memo=memo
            )
            
            self.db.add(transaction)
            self.db.flush()  # Get the transaction ID
            
            # Build and submit Stellar transaction
            stellar_result = self.stellar.send_payment(
                source_account=account.stellar_address,
                destination=destination,
                asset_code=asset_code,
                amount=str(amount),
                memo=memo
            )
            
            if stellar_result["success"]:
                # Update balance
                balance.amount -= amount
                
                # Update transaction
                transaction.status = TransactionStatus.SUCCESS
                transaction.stellar_tx_hash = stellar_result.get("tx_hash")
                transaction.raw_xdr = stellar_result.get("envelope_xdr")
                
                self.db.commit()
                
                log_transaction(
                    logger, 
                    str(transaction.id), 
                    user_id, 
                    "payment", 
                    float(amount), 
                    asset_code, 
                    "success",
                    correlation_id=correlation_id,
                    stellar_tx_hash=stellar_result.get("tx_hash")
                )
                
                return {
                    "ok": True,
                    "tx_id": str(transaction.id),
                    "stellar": {
                        "tx_hash": stellar_result.get("tx_hash"),
                        "envelope_xdr": stellar_result.get("envelope_xdr"),
                        "dry_run": stellar_result.get("dry_run", False)
                    }
                }
            else:
                transaction.status = TransactionStatus.FAILED
                self.db.commit()
                
                log_transaction(
                    logger,
                    str(transaction.id),
                    user_id,
                    "payment",
                    float(amount),
                    asset_code,
                    "failed",
                    correlation_id=correlation_id,
                    result_code=stellar_result.get("error")
                )
                
                raise Exception(f"Stellar transaction failed: {stellar_result.get('error')}")
                
        except Exception as e:
            self.db.rollback()
            logger.error(f"Payment failed for user {user_id}: {e}")
            raise
    
    def process_swap(
        self,
        user_id: str,
        sell_asset: str,
        buy_asset: str,
        amount: Decimal,
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process 1:1 asset swap."""
        tx_id = str(uuid.uuid4())
        
        try:
            # For demo, use 1:1 swap rate
            swap_rate = Decimal("1.0")
            buy_amount = amount * swap_rate
            
            # Get accounts
            sell_account = (
                self.db.query(Account)
                .filter(Account.user_id == user_id, Account.asset_code == sell_asset)
                .first()
            )
            
            buy_account = (
                self.db.query(Account)
                .filter(Account.user_id == user_id, Account.asset_code == buy_asset)
                .first()
            )
            
            if not sell_account or not buy_account:
                raise ValueError("Required accounts not found")
            
            # Get balances
            sell_balance = (
                self.db.query(Balance)
                .filter(Balance.account_id == sell_account.id, Balance.asset_code == sell_asset)
                .first()
            )
            
            buy_balance = (
                self.db.query(Balance)
                .filter(Balance.account_id == buy_account.id, Balance.asset_code == buy_asset)
                .first()
            )
            
            if not sell_balance or sell_balance.amount < amount:
                raise ValueError("Insufficient balance for swap")
            
            if not buy_balance:
                # Create buy balance if it doesn't exist
                buy_balance = Balance(
                    id=uuid.uuid4(),
                    account_id=buy_account.id,
                    asset_code=buy_asset,
                    amount=Decimal("0")
                )
                self.db.add(buy_balance)
            
            # Create transaction record
            transaction = Transaction(
                id=uuid.uuid4(),
                user_id=user_id,
                tx_type=TransactionType.SWAP,
                asset_code=sell_asset,
                amount=amount,
                status=TransactionStatus.PENDING,
                sell_asset=sell_asset,
                buy_asset=buy_asset,
                rate=swap_rate
            )
            
            self.db.add(transaction)
            self.db.flush()
            
            # Update balances
            sell_balance.amount -= amount
            buy_balance.amount += buy_amount
            
            # Update transaction status
            transaction.status = TransactionStatus.SUCCESS
            
            self.db.commit()
            
            log_transaction(
                logger,
                str(transaction.id),
                user_id,
                "swap",
                float(amount),
                sell_asset,
                "success",
                correlation_id=correlation_id,
                extra={
                    "sell_asset": sell_asset,
                    "buy_asset": buy_asset,
                    "buy_amount": float(buy_amount),
                    "rate": float(swap_rate)
                }
            )
            
            return {
                "ok": True,
                "swapped": buy_amount,
                "rate": swap_rate
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Swap failed for user {user_id}: {e}")
            raise