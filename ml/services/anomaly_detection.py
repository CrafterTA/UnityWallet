"""
Anomaly Detection Service
Phát hiện các giao dịch bất thường và cảnh báo
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import DBSCAN
from models.schemas import (
    TransactionRecord, AnomalyDetection, FeatureEngineering
)
from core.config import settings

class AnomalyDetectionService:
    """Service phát hiện anomalies trong giao dịch"""
    
    def __init__(self):
        self.isolation_forest = IsolationForest(
            contamination=settings.anomaly_threshold,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.models_trained = False
    
    def detect_anomalies(
        self, 
        transactions: List[TransactionRecord],
        features: FeatureEngineering
    ) -> List[AnomalyDetection]:
        """Phát hiện anomalies từ transaction history và features"""
        
        if not transactions:
            return []
        
        anomalies = []
        account = transactions[0].account
        
        # Convert to DataFrame for analysis
        df = self._transactions_to_dataframe(transactions)
        
        # Multiple detection methods
        anomalies.extend(self._detect_amount_anomalies(df, account))
        anomalies.extend(self._detect_frequency_anomalies(df, account))
        anomalies.extend(self._detect_time_anomalies(df, account))
        anomalies.extend(self._detect_pattern_anomalies(df, account))
        anomalies.extend(self._detect_ml_anomalies(df, account))
        
        # Sort by confidence score
        anomalies.sort(key=lambda x: x.confidence_score, reverse=True)
        
        return anomalies
    
    def _transactions_to_dataframe(self, transactions: List[TransactionRecord]) -> pd.DataFrame:
        """Convert transactions to DataFrame"""
        data = []
        for tx in transactions:
            data.append({
                'hash': tx.hash,
                'account': tx.account,
                'transaction_type': tx.transaction_type.value,
                'amount': tx.amount or 0.0,
                'asset_code': tx.asset.code if tx.asset else 'XLM',
                'destination': tx.destination,
                'source': tx.source,
                'fee': tx.fee,
                'timestamp': tx.timestamp,
                'success': tx.success,
                'hour': tx.timestamp.hour,
                'day_of_week': tx.timestamp.weekday(),
                'is_weekend': tx.timestamp.weekday() >= 5
            })
        
        return pd.DataFrame(data)
    
    def _detect_amount_anomalies(self, df: pd.DataFrame, account: str) -> List[AnomalyDetection]:
        """Phát hiện anomalies về số tiền giao dịch"""
        anomalies = []
        
        amounts = df['amount'].dropna()
        if len(amounts) < 10:  # Cần ít nhất 10 giao dịch
            return anomalies
        
        # Statistical outliers (Z-score > 3)
        mean_amount = amounts.mean()
        std_amount = amounts.std()
        
        if std_amount > 0:
            z_scores = np.abs((amounts - mean_amount) / std_amount)
            outlier_threshold = 3.0
            
            outlier_indices = amounts[z_scores > outlier_threshold].index
            
            for idx in outlier_indices:
                tx_row = df.loc[idx]
                confidence = min(0.95, (z_scores.loc[idx] - outlier_threshold) / 2.0 + 0.7)
                
                anomaly = AnomalyDetection(
                    account=account,
                    timestamp=tx_row['timestamp'],
                    anomaly_type="unusual_amount",
                    confidence_score=confidence,
                    description=f"Giao dịch có số tiền bất thường: {tx_row['amount']:.2f} {tx_row['asset_code']} (Z-score: {z_scores.loc[idx]:.2f})",
                    transaction_hash=tx_row['hash'],
                    recommended_action="Xem xét và xác nhận giao dịch này"
                )
                anomalies.append(anomaly)
        
        return anomalies
    
    def _detect_frequency_anomalies(self, df: pd.DataFrame, account: str) -> List[AnomalyDetection]:
        """Phát hiện anomalies về tần suất giao dịch"""
        anomalies = []
        
        # Group by day and count transactions
        df['date'] = df['timestamp'].dt.date
        daily_counts = df.groupby('date').size()
        
        if len(daily_counts) < 7:  # Cần ít nhất 1 tuần data
            return anomalies
        
        mean_daily = daily_counts.mean()
        std_daily = daily_counts.std()
        
        if std_daily > 0:
            # Detect days with unusually high transaction count
            high_activity_threshold = mean_daily + 2 * std_daily
            
            for date, count in daily_counts.items():
                if count > high_activity_threshold:
                    confidence = min(0.90, (count - high_activity_threshold) / mean_daily * 0.3 + 0.6)
                    
                    anomaly = AnomalyDetection(
                        account=account,
                        timestamp=datetime.combine(date, datetime.min.time()),
                        anomaly_type="high_frequency",
                        confidence_score=confidence,
                        description=f"Hoạt động giao dịch bất thường cao: {count} giao dịch trong ngày (trung bình: {mean_daily:.1f})",
                        recommended_action="Kiểm tra hoạt động tài khoản trong ngày này"
                    )
                    anomalies.append(anomaly)
        
        return anomalies
    
    def _detect_time_anomalies(self, df: pd.DataFrame, account: str) -> List[AnomalyDetection]:
        """Phát hiện anomalies về thời gian giao dịch"""
        anomalies = []
        
        # Unusual hour activity (giao dịch vào giờ không bình thường)
        hour_counts = df['hour'].value_counts()
        
        # Detect activity in unusual hours (2-5 AM)
        unusual_hours = [2, 3, 4, 5]
        unusual_activity = df[df['hour'].isin(unusual_hours)]
        
        if not unusual_activity.empty:
            for _, tx in unusual_activity.iterrows():
                confidence = 0.6 + (0.3 if tx['hour'] in [3, 4] else 0.1)  # 3-4 AM most unusual
                
                anomaly = AnomalyDetection(
                    account=account,
                    timestamp=tx['timestamp'],
                    anomaly_type="unusual_time",
                    confidence_score=confidence,
                    description=f"Giao dịch vào giờ bất thường: {tx['hour']:02d}:xx",
                    transaction_hash=tx['hash'],
                    recommended_action="Xác nhận giao dịch có được thực hiện bởi chủ tài khoản"
                )
                anomalies.append(anomaly)
        
        # Weekend activity (nếu thường không giao dịch cuối tuần)
        weekend_txs = df[df['is_weekend']]
        weekday_txs = df[~df['is_weekend']]
        
        if len(weekday_txs) > 0 and len(weekend_txs) > 0:
            weekend_ratio = len(weekend_txs) / len(df)
            if weekend_ratio > 0.4:  # >40% giao dịch vào cuối tuần
                for _, tx in weekend_txs.iterrows():
                    anomaly = AnomalyDetection(
                        account=account,
                        timestamp=tx['timestamp'],
                        anomaly_type="weekend_activity",
                        confidence_score=0.5,
                        description="Hoạt động giao dịch cao vào cuối tuần",
                        transaction_hash=tx['hash'],
                        recommended_action="Kiểm tra pattern giao dịch cuối tuần"
                    )
                    anomalies.append(anomaly)
        
        return anomalies
    
    def _detect_pattern_anomalies(self, df: pd.DataFrame, account: str) -> List[AnomalyDetection]:
        """Phát hiện anomalies về pattern giao dịch"""
        anomalies = []
        
        # Rapid sequential transactions (giao dịch liên tiếp quá nhanh)
        df_sorted = df.sort_values('timestamp')
        time_diffs = df_sorted['timestamp'].diff()
        
        # Detect transactions within 1 minute of each other
        rapid_txs = df_sorted[time_diffs <= timedelta(minutes=1)]
        
        for _, tx in rapid_txs.iterrows():
            anomaly = AnomalyDetection(
                account=account,
                timestamp=tx['timestamp'],
                anomaly_type="rapid_transactions",
                confidence_score=0.7,
                description="Giao dịch liên tiếp trong thời gian ngắn (<1 phút)",
                transaction_hash=tx['hash'],
                recommended_action="Kiểm tra bot hoặc automated trading"
            )
            anomalies.append(anomaly)
        
        # Round number bias (xu hướng giao dịch số tròn)
        amounts = df['amount'].dropna()
        round_amounts = amounts[amounts % 1 == 0]  # Số nguyên
        very_round = amounts[amounts % 100 == 0]    # Bội số của 100
        
        if len(very_round) / len(amounts) > 0.8:  # >80% là số rất tròn
            anomaly = AnomalyDetection(
                account=account,
                timestamp=datetime.now(),
                anomaly_type="round_number_bias",
                confidence_score=0.6,
                description=f"Xu hướng giao dịch số tròn bất thường: {len(very_round)}/{len(amounts)} giao dịch",
                recommended_action="Xem xét pattern giao dịch có thể là automated"
            )
            anomalies.append(anomaly)
        
        return anomalies
    
    def _detect_ml_anomalies(self, df: pd.DataFrame, account: str) -> List[AnomalyDetection]:
        """Sử dụng ML để phát hiện anomalies"""
        anomalies = []
        
        if len(df) < 20:  # Cần ít nhất 20 giao dịch
            return anomalies
        
        try:
            # Prepare features for ML
            features = []
            for _, tx in df.iterrows():
                feature_vector = [
                    tx['amount'],
                    tx['hour'],
                    tx['day_of_week'],
                    1 if tx['is_weekend'] else 0,
                    tx['fee'],
                    1 if tx['transaction_type'] == 'payment' else 0,
                    1 if tx['transaction_type'] == 'swap' else 0
                ]
                features.append(feature_vector)
            
            X = np.array(features)
            
            # Standardize features
            X_scaled = self.scaler.fit_transform(X)
            
            # Detect anomalies using Isolation Forest
            anomaly_labels = self.isolation_forest.fit_predict(X_scaled)
            anomaly_scores = self.isolation_forest.decision_function(X_scaled)
            
            # Convert to anomaly objects
            for i, (label, score) in enumerate(zip(anomaly_labels, anomaly_scores)):
                if label == -1:  # Anomaly detected
                    tx_row = df.iloc[i]
                    
                    # Convert anomaly score to confidence (higher negative score = more anomalous)
                    confidence = min(0.95, max(0.5, (abs(score) - 0.1) * 2))
                    
                    anomaly = AnomalyDetection(
                        account=account,
                        timestamp=tx_row['timestamp'],
                        anomaly_type="ml_detected",
                        confidence_score=confidence,
                        description=f"Giao dịch bất thường được phát hiện bởi ML (score: {score:.3f})",
                        transaction_hash=tx_row['hash'],
                        recommended_action="Phân tích chi tiết giao dịch này"
                    )
                    anomalies.append(anomaly)
        
        except Exception as e:
            print(f"ML anomaly detection error: {e}")
        
        return anomalies
    
    def get_risk_score(self, anomalies: List[AnomalyDetection]) -> float:
        """Tính risk score tổng thể từ các anomalies"""
        if not anomalies:
            return 0.0
        
        # Weighted average of confidence scores
        weights = {
            "unusual_amount": 1.0,
            "high_frequency": 0.8,
            "unusual_time": 0.6,
            "rapid_transactions": 0.9,
            "ml_detected": 1.2
        }
        
        total_weighted_score = 0.0
        total_weight = 0.0
        
        for anomaly in anomalies:
            weight = weights.get(anomaly.anomaly_type, 0.5)
            total_weighted_score += anomaly.confidence_score * weight
            total_weight += weight
        
        if total_weight == 0:
            return 0.0
        
        return min(1.0, total_weighted_score / total_weight)

# Singleton instance
anomaly_service = AnomalyDetectionService()
