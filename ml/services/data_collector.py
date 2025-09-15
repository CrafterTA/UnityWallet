"""
Service để thu thập lịch sử giao dịch từ Stellar blockchain
"""

import asyncio
import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from ml.core.config import settings
from ml.models.schemas import TransactionRecord, TransactionType, AssetInfo, WalletBalance

class StellarDataCollector:
    """Collector để lấy dữ liệu từ Stellar Horizon API"""
    
    def __init__(self):
        self.horizon_url = settings.horizon_url
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_account_transactions(
        self, 
        account: str, 
        limit: int = 200,
        cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """Lấy danh sách giao dịch của một account"""
        url = f"{self.horizon_url}/accounts/{account}/transactions"
        params = {"limit": limit, "order": "desc"}
        if cursor:
            params["cursor"] = cursor
            
        response = await self.client.get(url, params=params)
        response.raise_for_status()
        return response.json()
    
    async def get_account_payments(
        self, 
        account: str, 
        limit: int = 200,
        cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """Lấy danh sách payment operations của account"""
        url = f"{self.horizon_url}/accounts/{account}/payments"
        params = {"limit": limit, "order": "desc"}
        if cursor:
            params["cursor"] = cursor
            
        response = await self.client.get(url, params=params)
        response.raise_for_status()
        return response.json()
    
    async def get_account_operations(
        self, 
        account: str, 
        limit: int = 200,
        cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """Lấy tất cả operations của account"""
        url = f"{self.horizon_url}/accounts/{account}/operations"
        params = {"limit": limit, "order": "desc"}
        if cursor:
            params["cursor"] = cursor
            
        response = await self.client.get(url, params=params)
        response.raise_for_status()
        return response.json()
    
    async def get_account_balances(self, account: str) -> List[WalletBalance]:
        """Lấy số dư hiện tại của account"""
        url = f"{self.horizon_url}/accounts/{account}"
        response = await self.client.get(url)
        response.raise_for_status()
        
        account_data = response.json()
        balances = []
        timestamp = datetime.now()
        
        for balance in account_data.get("balances", []):
            asset_code = "XLM" if balance["asset_type"] == "native" else balance["asset_code"]
            asset_issuer = None if balance["asset_type"] == "native" else balance["asset_issuer"]
            
            asset_info = AssetInfo(code=asset_code, issuer=asset_issuer)
            wallet_balance = WalletBalance(
                account=account,
                asset=asset_info,
                balance=float(balance["balance"]),
                timestamp=timestamp
            )
            balances.append(wallet_balance)
        
        return balances
    
    def _parse_operation_to_transaction(self, operation: Dict[str, Any], account: str) -> Optional[TransactionRecord]:
        """Chuyển đổi operation từ Horizon API thành TransactionRecord"""
        try:
            op_type = operation.get("type")
            # Fix datetime parsing - ensure timezone aware
            timestamp_str = operation["created_at"]
            if timestamp_str.endswith("Z"):
                timestamp_str = timestamp_str[:-1] + "+00:00"
            timestamp = datetime.fromisoformat(timestamp_str)
            
            # Xác định transaction type
            transaction_type = self._map_operation_type(op_type)
            if not transaction_type:
                return None
            
            # Parse asset info
            asset_info = None
            amount = None
            destination = None
            source = None
            
            if op_type == "payment":
                if operation.get("asset_type") == "native":
                    asset_info = AssetInfo(code="XLM")
                else:
                    asset_info = AssetInfo(
                        code=operation.get("asset_code", ""),
                        issuer=operation.get("asset_issuer")
                    )
                amount = float(operation.get("amount", 0))
                destination = operation.get("to")
                source = operation.get("from")
            
            elif op_type in ["path_payment_strict_send", "path_payment_strict_receive"]:
                # Xử lý swap operations
                if operation.get("source_asset_type") == "native":
                    asset_info = AssetInfo(code="XLM")
                else:
                    asset_info = AssetInfo(
                        code=operation.get("source_asset_code", ""),
                        issuer=operation.get("source_asset_issuer")
                    )
                amount = float(operation.get("source_amount", 0))
                destination = operation.get("to")
                source = operation.get("from")
                transaction_type = TransactionType.SWAP
            
            return TransactionRecord(
                hash=operation.get("transaction_hash", ""),
                account=account,
                transaction_type=transaction_type,
                amount=amount,
                asset=asset_info,
                destination=destination,
                source=source,
                fee=0.0,  # Operation level không có fee, cần lấy từ transaction
                timestamp=timestamp,
                success=operation.get("transaction_successful", True)
            )
        
        except Exception as e:
            print(f"Error parsing operation: {e}")
            return None
    
    def _map_operation_type(self, op_type: str) -> Optional[TransactionType]:
        """Map Stellar operation type to our TransactionType"""
        mapping = {
            "payment": TransactionType.PAYMENT,
            "path_payment_strict_send": TransactionType.SWAP,
            "path_payment_strict_receive": TransactionType.SWAP,
            "create_account": TransactionType.CREATE_ACCOUNT,
            "change_trust": TransactionType.CHANGE_TRUST
        }
        return mapping.get(op_type)
    
    async def collect_full_history(
        self, 
        account: str, 
        days_back: int = 90,
        max_records: int = 10000
    ) -> List[TransactionRecord]:
        """Thu thập toàn bộ lịch sử giao dịch trong khoảng thời gian"""
        transactions = []
        cursor = None
        # Make cutoff_date timezone aware from the start
        from datetime import timezone
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_back)
        
        while len(transactions) < max_records:
            try:
                # Lấy operations thay vì transactions để có thông tin chi tiết hơn
                operations_data = await self.get_account_operations(
                    account=account,
                    limit=200,
                    cursor=cursor
                )
                
                operations = operations_data.get("_embedded", {}).get("records", [])
                if not operations:
                    break
                
                # Parse operations
                for operation in operations:
                    # Kiểm tra thời gian - fix datetime comparison
                    op_time_str = operation["created_at"]
                    if op_time_str.endswith("Z"):
                        op_time_str = op_time_str[:-1] + "+00:00"
                    op_time = datetime.fromisoformat(op_time_str)
                    
                    if op_time < cutoff_date:
                        return transactions  # Đã đến giới hạn thời gian
                    
                    transaction = self._parse_operation_to_transaction(operation, account)
                    if transaction:
                        transactions.append(transaction)
                
                # Lấy cursor cho page tiếp theo
                cursor = operations[-1].get("paging_token") if operations else None
                if not cursor:
                    break
                    
            except Exception as e:
                print(f"Error collecting transactions: {e}")
                break
        
        return transactions
    
    async def close(self):
        """Đóng HTTP client"""
        await self.client.aclose()

# Singleton instance
stellar_collector = StellarDataCollector()
