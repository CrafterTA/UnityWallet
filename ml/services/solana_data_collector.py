"""
Service để thu thập lịch sử giao dịch từ Solana blockchain via Chain API
"""

import asyncio
import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from core.config import settings
from models.schemas import TransactionRecord, TransactionType, AssetInfo, WalletBalance

class SolanaDataCollector:
    """Collector để lấy dữ liệu từ Chain API (Solana)"""
    
    def __init__(self):
        self.chain_url = settings.chain_api_url  # http://localhost:8000
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_account_transactions(
        self, 
        public_key: str, 
        limit: int = 200,
        before: Optional[str] = None
    ) -> Dict[str, Any]:
        """Lấy danh sách giao dịch của một account từ Chain API"""
        url = f"{self.chain_url}/tx/history"
        params = {"public_key": public_key, "limit": limit}
        if before:
            params["before"] = before
            
        response = await self.client.get(url, params=params)
        response.raise_for_status()
        return response.json()
    
    async def get_account_balances(self, public_key: str) -> List[WalletBalance]:
        """Lấy số dư hiện tại của account từ Chain API"""
        url = f"{self.chain_url}/wallet/balances"
        params = {"public_key": public_key}
        response = await self.client.get(url, params=params)
        response.raise_for_status()
        
        balance_data = response.json()
        balances = []
        timestamp = datetime.now()
        
        # Parse Chain API response format
        # Response: {"public_key": "...", "balances": {"SOL": {...}, "USDT": {...}}}
        account_balances = balance_data.get("balances", {})
        
        for token_symbol, token_data in account_balances.items():
            # Extract balance information
            balance_ui = float(token_data.get("balance_ui", 0))
            mint = token_data.get("mint", "")
            symbol = token_data.get("symbol", token_symbol)
            
            # Create asset info
            asset_info = AssetInfo(
                code=symbol,
                issuer=mint if mint != "native" else None
            )
            
            # Create wallet balance
            wallet_balance = WalletBalance(
                account=public_key,
                asset=asset_info,
                balance=balance_ui,
                timestamp=timestamp
            )
            balances.append(wallet_balance)
        
        return balances
    
    async def collect_full_history(
        self,
        account: str,
        days_back: int = 90,
        max_records: int = 5000
    ) -> List[TransactionRecord]:
        """Thu thập toàn bộ lịch sử giao dịch trong khoảng thời gian"""
        transactions = []
        before = None
        
        try:
            while len(transactions) < max_records:
                # Lấy batch giao dịch
                data = await self.get_account_transactions(
                    account, 
                    limit=min(100, max_records - len(transactions)),
                    before=before
                )
                
                batch_transactions = data.get("transactions", [])
                if not batch_transactions:
                    break
                
                # Convert Solana transactions to TransactionRecord
                for tx in batch_transactions:
                    transaction_record = self._parse_solana_transaction(tx, account)
                    if transaction_record:
                        # Filter by date - include future timestamps (Solana devnet may have future times)
                        from datetime import timezone
                        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_back)
                        future_cutoff = datetime.now(timezone.utc) + timedelta(days=365)  # Allow up to 1 year future
                        
                        if transaction_record.timestamp >= cutoff_date and transaction_record.timestamp <= future_cutoff:
                            transactions.append(transaction_record)
                        elif transaction_record.timestamp < cutoff_date:
                            # Reached cutoff date (past), stop collecting
                            return transactions
                
                # Pagination
                if len(batch_transactions) < 100:
                    break
                    
                # Use last transaction signature for pagination
                before = batch_transactions[-1].get("signature")
                
                # Avoid infinite loops
                await asyncio.sleep(0.1)
                
        except Exception as e:
            print(f"Error collecting Solana transaction history: {e}")
        
        return transactions
    
    def _parse_solana_transaction(self, tx: Dict[str, Any], account: str) -> Optional[TransactionRecord]:
        """Chuyển đổi Solana transaction thành TransactionRecord"""
        try:
            signature = tx.get("signature", "")
            if not signature:
                return None
            
            # Parse timestamp with proper timezone (UTC)
            from datetime import timezone
            if tx.get("block_time"):
                timestamp = datetime.fromtimestamp(tx.get("block_time"), tz=timezone.utc)
            else:
                timestamp = datetime.now(timezone.utc)
            
            # Basic transaction info from Chain API response
            # Chain API only returns: signature, slot, block_time, fee, success, logs
            
            # Default values since Chain API doesn't provide detailed transaction parsing
            tx_type = TransactionType.PAYMENT  # Default assumption
            amount = 0.0  # Cannot determine from current Chain API response
            asset_info = AssetInfo(code="SOL", issuer=None)  # Default to SOL
            fee_sol = tx.get("fee", 0) / 1_000_000_000  # Convert lamports to SOL
            
            return TransactionRecord(
                hash=signature,  # Use signature as hash
                account=account,
                transaction_type=tx_type,
                amount=amount,
                asset=asset_info,
                destination=None,  # Unknown from current Chain API
                source=None,      # Unknown from current Chain API
                fee=fee_sol,
                timestamp=timestamp,
                success=tx.get("success", True),
                memo=None  # Not provided by Chain API
            )
            
        except Exception as e:
            print(f"Error parsing Solana transaction: {e}")
            return None
    
    async def close(self):
        """Đóng HTTP client"""
        await self.client.aclose()

# Create singleton instance
solana_collector = SolanaDataCollector()
