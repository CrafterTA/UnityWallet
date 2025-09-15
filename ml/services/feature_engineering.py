"""
Feature Engineering Service
Tính toán các features từ lịch sử giao dịch
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from ml.models.schemas import (
    TransactionRecord, FeatureEngineering, WalletBalance, AssetInfo
)

class FeatureEngineeringService:
    """Service tính toán các features từ transaction history"""
    
    def __init__(self):
        self.cache = {}  # Simple in-memory cache
    
    def calculate_features(
        self, 
        transactions: List[TransactionRecord],
        balances: List[WalletBalance],
        period_days: int = 90
    ) -> FeatureEngineering:
        """Tính toán tất cả features từ transaction history"""
        
        if not transactions:
            return self._empty_features("unknown")
        
        account = transactions[0].account
        df = self._transactions_to_dataframe(transactions)
        
        # Xác định period - ensure timezone aware
        from datetime import timezone
        period_end = datetime.now(timezone.utc)
        period_start = period_end - timedelta(days=period_days)
        
        # Ensure df timestamps are timezone aware
        if not df.empty and 'timestamp' in df.columns:
            if df['timestamp'].dt.tz is None:
                df['timestamp'] = df['timestamp'].dt.tz_localize('UTC')
            else:
                df['timestamp'] = df['timestamp'].dt.tz_convert('UTC')
        
        # Filter transactions trong period
        if not df.empty:
            df_period = df[
                (df['timestamp'] >= period_start) & 
                (df['timestamp'] <= period_end)
            ]
        else:
            df_period = df
        
        features = FeatureEngineering(
            account=account,
            period_start=period_start,
            period_end=period_end,
            
            # Transaction counts
            total_transactions=len(df_period),
            transactions_per_month=self._calculate_transactions_per_month(df_period, period_days),
            payment_count=len(df_period[df_period['transaction_type'] == 'payment']),
            swap_count=len(df_period[df_period['transaction_type'] == 'swap']),
            
            # Balance volatility
            balance_volatility=self._calculate_balance_volatility(df_period, balances),
            max_balance=self._calculate_balance_extremes(balances, 'max'),
            min_balance=self._calculate_balance_extremes(balances, 'min'),
            avg_balance=self._calculate_balance_extremes(balances, 'avg'),
            
            # Debt to asset ratio (simplified)
            debt_to_asset_ratio=self._calculate_debt_ratio(df_period, balances),
            
            # Refund patterns
            refund_frequency=self._calculate_refund_frequency(df_period),
            refund_amount_ratio=self._calculate_refund_amount_ratio(df_period),
            
            # Transaction patterns
            peak_transaction_hours=self._find_peak_hours(df_period),
            frequent_destinations=self._find_frequent_destinations(df_period),
            
            # Risk metrics
            large_transaction_count=self._count_large_transactions(df_period)[0],
            large_transaction_threshold=self._count_large_transactions(df_period)[1]
        )
        
        return features
    
    def _transactions_to_dataframe(self, transactions: List[TransactionRecord]) -> pd.DataFrame:
        """Chuyển đổi transaction list thành DataFrame cho phân tích"""
        data = []
        for tx in transactions:
            # Ensure timestamp is timezone aware
            timestamp = tx.timestamp
            if hasattr(timestamp, 'tzinfo') and timestamp.tzinfo is None:
                from datetime import timezone
                timestamp = timestamp.replace(tzinfo=timezone.utc)
            
            data.append({
                'hash': tx.hash,
                'account': tx.account,
                'transaction_type': tx.transaction_type.value,
                'amount': tx.amount or 0.0,
                'asset_code': tx.asset.code if tx.asset else 'XLM',
                'asset_issuer': tx.asset.issuer if tx.asset else None,
                'destination': tx.destination,
                'source': tx.source,
                'fee': tx.fee,
                'timestamp': timestamp,
                'success': tx.success,
                'hour': timestamp.hour,
                'day_of_week': timestamp.weekday(),
                'is_outgoing': tx.source == tx.account if tx.source else False,
                'is_incoming': tx.destination == tx.account if tx.destination else False
            })
        
        df = pd.DataFrame(data)
        
        # Ensure timestamp column is properly typed and timezone aware
        if not df.empty and 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'], utc=True)
        
        return df
    
    def _calculate_transactions_per_month(self, df: pd.DataFrame, period_days: int) -> float:
        """Tính số giao dịch trung bình mỗi tháng"""
        if df.empty:
            return 0.0
        months = period_days / 30.0
        return len(df) / months if months > 0 else len(df)
    
    def _calculate_balance_volatility(
        self, 
        df: pd.DataFrame, 
        balances: List[WalletBalance]
    ) -> Dict[str, float]:
        """Tính độ biến động số dư cho mỗi asset"""
        volatility = {}
        
        # Group transactions by asset
        for asset_code in df['asset_code'].unique():
            asset_txs = df[df['asset_code'] == asset_code]
            if len(asset_txs) < 2:
                volatility[asset_code] = 0.0
                continue
            
            # Simulate balance changes over time
            balance_changes = []
            for _, tx in asset_txs.iterrows():
                if tx['is_outgoing'] and tx['amount'] > 0:
                    balance_changes.append(-tx['amount'])
                elif tx['is_incoming'] and tx['amount'] > 0:
                    balance_changes.append(tx['amount'])
            
            if balance_changes:
                volatility[asset_code] = float(np.std(balance_changes))
            else:
                volatility[asset_code] = 0.0
        
        return volatility
    
    def _calculate_balance_extremes(
        self, 
        balances: List[WalletBalance], 
        metric: str
    ) -> Dict[str, float]:
        """Tính max/min/avg balance cho mỗi asset"""
        balance_dict = {}
        
        for balance in balances:
            asset_key = str(balance.asset)
            if metric == 'max':
                balance_dict[asset_key] = balance.balance
            elif metric == 'min':
                balance_dict[asset_key] = balance.balance
            elif metric == 'avg':
                balance_dict[asset_key] = balance.balance
        
        return balance_dict
    
    def _calculate_debt_ratio(
        self, 
        df: pd.DataFrame, 
        balances: List[WalletBalance]
    ) -> Optional[float]:
        """Tính tỷ lệ nợ/tài sản (đơn giản hóa)"""
        # Simplified calculation - trong thực tế cần logic phức tạp hơn
        total_outgoing = df[df['is_outgoing']]['amount'].sum()
        total_incoming = df[df['is_incoming']]['amount'].sum()
        
        if total_incoming == 0:
            return None
        
        return total_outgoing / total_incoming
    
    def _calculate_refund_frequency(self, df: pd.DataFrame) -> float:
        """Tính tần suất hoàn tiền (pattern phát hiện giao dịch ngược chiều)"""
        if df.empty:
            return 0.0
        
        # Tìm các cặp giao dịch có thể là refund
        refund_count = 0
        total_outgoing = len(df[df['is_outgoing']])
        
        if total_outgoing == 0:
            return 0.0
        
        # Logic đơn giản: tìm giao dịch có số tiền gần giống nhau trong khoảng thời gian ngắn
        outgoing_txs = df[df['is_outgoing']].sort_values('timestamp')
        incoming_txs = df[df['is_incoming']].sort_values('timestamp')
        
        for _, out_tx in outgoing_txs.iterrows():
            # Tìm incoming transaction trong vòng 24h có số tiền tương tự
            time_window = timedelta(hours=24)
            similar_incoming = incoming_txs[
                (incoming_txs['timestamp'] >= out_tx['timestamp']) &
                (incoming_txs['timestamp'] <= out_tx['timestamp'] + time_window) &
                (abs(incoming_txs['amount'] - out_tx['amount']) / out_tx['amount'] < 0.01)  # 1% tolerance
            ]
            
            if not similar_incoming.empty:
                refund_count += 1
        
        return refund_count / total_outgoing
    
    def _calculate_refund_amount_ratio(self, df: pd.DataFrame) -> float:
        """Tính tỷ lệ số tiền được hoàn so với tổng chi tiêu"""
        total_outgoing = df[df['is_outgoing']]['amount'].sum()
        if total_outgoing == 0:
            return 0.0
        
        # Simplified - trong thực tế cần logic phức tạp hơn để detect refunds
        refund_frequency = self._calculate_refund_frequency(df)
        estimated_refund_amount = total_outgoing * refund_frequency * 0.5  # Estimate
        
        return estimated_refund_amount / total_outgoing
    
    def _find_peak_hours(self, df: pd.DataFrame) -> List[int]:
        """Tìm giờ có nhiều giao dịch nhất"""
        if df.empty:
            return []
        
        hour_counts = df['hour'].value_counts()
        # Trả về top 3 giờ
        return hour_counts.head(3).index.tolist()
    
    def _find_frequent_destinations(self, df: pd.DataFrame, top_n: int = 5) -> List[str]:
        """Tìm các địa chỉ gửi tiền thường xuyên nhất"""
        outgoing_txs = df[df['is_outgoing'] & df['destination'].notna()]
        if outgoing_txs.empty:
            return []
        
        dest_counts = outgoing_txs['destination'].value_counts()
        return dest_counts.head(top_n).index.tolist()
    
    def _count_large_transactions(self, df: pd.DataFrame) -> Tuple[int, float]:
        """Đếm số giao dịch lớn và trả về threshold"""
        if df.empty:
            return 0, 0.0
        
        amounts = df['amount'].dropna()
        if amounts.empty:
            return 0, 0.0
        
        # Threshold = 95th percentile
        threshold = amounts.quantile(0.95)
        large_count = len(amounts[amounts >= threshold])
        
        return large_count, float(threshold)
    
    def _empty_features(self, account: str) -> FeatureEngineering:
        """Trả về features rỗng khi không có data"""
        return FeatureEngineering(
            account=account,
            period_start=datetime.now() - timedelta(days=90),
            period_end=datetime.now(),
            total_transactions=0,
            transactions_per_month=0.0,
            payment_count=0,
            swap_count=0,
            balance_volatility={},
            max_balance={},
            min_balance={},
            avg_balance={},
            debt_to_asset_ratio=None,
            refund_frequency=0.0,
            refund_amount_ratio=0.0,
            peak_transaction_hours=[],
            frequent_destinations=[],
            large_transaction_count=0,
            large_transaction_threshold=0.0
        )

# Singleton instance
feature_service = FeatureEngineeringService()
