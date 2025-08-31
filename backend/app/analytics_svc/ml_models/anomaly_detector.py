"""
Anomaly Detection Model
Rule-based anomaly detection for transaction monitoring
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import numpy as np
import pandas as pd

from ...common.logging import get_logger

logger = get_logger("anomaly_detector")


class AnomalyDetector:
    """
    Rule-based anomaly detector for transaction monitoring.
    """
    
    def __init__(self):
        self.config = {
            'amount_zscore_threshold': 2.5,
            'frequency_threshold_hours': 1,
            'location_change_threshold_hours': 2,
            'weekend_multiplier': 1.5,
            'night_multiplier': 1.3,
            'max_daily_transactions': 20
        }
    
    def detect_anomalies(self, transactions: List[Dict]) -> Dict:
        """Detect anomalies in transaction list."""
        if not transactions:
            return {'anomalies': [], 'total_checked': 0}
        
        try:
            df = pd.DataFrame(transactions)
            
            # Convert types
            df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
            df['transaction_date'] = pd.to_datetime(df['transaction_date'], errors='coerce')
            
            # Drop invalid rows
            df = df.dropna(subset=['amount', 'transaction_date'])
            
            if len(df) == 0:
                return {'anomalies': [], 'total_checked': 0}
            
            # Sort by date
            df = df.sort_values('transaction_date')
            
            anomalies = []
            
            # 1. Amount-based anomalies (Z-score)
            amount_anomalies = self._detect_amount_anomalies(df)
            anomalies.extend(amount_anomalies)
            
            # 2. Frequency anomalies
            frequency_anomalies = self._detect_frequency_anomalies(df)
            anomalies.extend(frequency_anomalies)
            
            # 3. Time-based anomalies
            time_anomalies = self._detect_time_anomalies(df)
            anomalies.extend(time_anomalies)
            
            # 4. Location-based anomalies
            location_anomalies = self._detect_location_anomalies(df)
            anomalies.extend(location_anomalies)
            
            # 5. Pattern anomalies
            pattern_anomalies = self._detect_pattern_anomalies(df)
            anomalies.extend(pattern_anomalies)
            
            return {
                'anomalies': anomalies,
                'total_checked': len(df),
                'anomaly_rate': len(anomalies) / len(df) if df.shape[0] > 0 else 0,
                'detected_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in anomaly detection: {e}")
            return {'anomalies': [], 'total_checked': 0, 'error': str(e)}
    
    def _detect_amount_anomalies(self, df: pd.DataFrame) -> List[Dict]:
        """Detect amount-based anomalies using Z-score."""
        anomalies = []
        
        if len(df) < 3:  # Need minimum data for statistics
            return anomalies
        
        # Calculate Z-scores
        mean_amount = df['amount'].mean()
        std_amount = df['amount'].std()
        
        if std_amount == 0:  # All amounts are the same
            return anomalies
        
        df['amount_zscore'] = np.abs((df['amount'] - mean_amount) / std_amount)
        
        # Find outliers
        outliers = df[df['amount_zscore'] > self.config['amount_zscore_threshold']]
        
        for _, row in outliers.iterrows():
            anomalies.append({
                'type': 'amount_outlier',
                'transaction_date': row['transaction_date'].isoformat(),
                'amount': row['amount'],
                'zscore': round(row['amount_zscore'], 2),
                'description': f"Unusual amount: ${row['amount']:.2f} (Z-score: {row['amount_zscore']:.1f})",
                'severity': 'high' if row['amount_zscore'] > 3 else 'medium'
            })
        
        return anomalies
    
    def _detect_frequency_anomalies(self, df: pd.DataFrame) -> List[Dict]:
        """Detect frequency-based anomalies."""
        anomalies = []
        
        # Sort by transaction date
        df_sorted = df.sort_values('transaction_date')
        
        # Check for rapid succession of transactions
        for i in range(1, len(df_sorted)):
            time_diff = (df_sorted.iloc[i]['transaction_date'] - 
                        df_sorted.iloc[i-1]['transaction_date']).total_seconds() / 3600
            
            if time_diff < self.config['frequency_threshold_hours']:
                anomalies.append({
                    'type': 'high_frequency',
                    'transaction_date': df_sorted.iloc[i]['transaction_date'].isoformat(),
                    'time_gap_hours': round(time_diff, 2),
                    'description': f"Rapid transaction: {time_diff:.1f} hours after previous",
                    'severity': 'medium'
                })
        
        # Check daily transaction counts
        df['date'] = df['transaction_date'].dt.date
        daily_counts = df.groupby('date').size()
        
        high_volume_days = daily_counts[daily_counts > self.config['max_daily_transactions']]
        
        for date, count in high_volume_days.items():
            anomalies.append({
                'type': 'high_daily_volume',
                'transaction_date': date.isoformat(),
                'transaction_count': count,
                'description': f"High activity: {count} transactions in one day",
                'severity': 'medium'
            })
        
        return anomalies
    
    def _detect_time_anomalies(self, df: pd.DataFrame) -> List[Dict]:
        """Detect time-based anomalies (night, weekend patterns)."""
        anomalies = []
        
        # Add time features
        df['hour'] = df['transaction_date'].dt.hour
        df['is_weekend'] = df['transaction_date'].dt.weekday >= 5
        df['is_night'] = (df['hour'] < 6) | (df['hour'] > 22)
        
        # Detect unusual night transactions (high amounts at night)
        night_transactions = df[df['is_night'] & (df['amount'] > df['amount'].quantile(0.8))]
        
        for _, row in night_transactions.iterrows():
            anomalies.append({
                'type': 'night_high_amount',
                'transaction_date': row['transaction_date'].isoformat(),
                'amount': row['amount'],
                'hour': row['hour'],
                'description': f"Large transaction at {row['hour']}:00: ${row['amount']:.2f}",
                'severity': 'medium'
            })
        
        return anomalies
    
    def _detect_location_anomalies(self, df: pd.DataFrame) -> List[Dict]:
        """Detect location-based anomalies."""
        anomalies = []
        
        if 'location' not in df.columns or df['location'].isna().all():
            return anomalies
        
        # Sort by time
        df_sorted = df.sort_values('transaction_date')
        
        # Check for rapid location changes
        for i in range(1, len(df_sorted)):
            if pd.isna(df_sorted.iloc[i]['location']) or pd.isna(df_sorted.iloc[i-1]['location']):
                continue
                
            current_location = str(df_sorted.iloc[i]['location'])
            prev_location = str(df_sorted.iloc[i-1]['location'])
            
            if current_location != prev_location:
                time_diff = (df_sorted.iloc[i]['transaction_date'] - 
                           df_sorted.iloc[i-1]['transaction_date']).total_seconds() / 3600
                
                if time_diff < self.config['location_change_threshold_hours']:
                    anomalies.append({
                        'type': 'rapid_location_change',
                        'transaction_date': df_sorted.iloc[i]['transaction_date'].isoformat(),
                        'time_gap_hours': round(time_diff, 2),
                        'from_location': prev_location,
                        'to_location': current_location,
                        'description': f"Quick location change: {prev_location} → {current_location}",
                        'severity': 'high'
                    })
        
        return anomalies
    
    def _detect_pattern_anomalies(self, df: pd.DataFrame) -> List[Dict]:
        """Detect pattern-based anomalies."""
        anomalies = []
        
        # Check for duplicate transactions (same amount, close in time)
        df_sorted = df.sort_values(['amount', 'transaction_date'])
        
        for i in range(1, len(df_sorted)):
            if df_sorted.iloc[i]['amount'] == df_sorted.iloc[i-1]['amount']:
                time_diff = (df_sorted.iloc[i]['transaction_date'] - 
                           df_sorted.iloc[i-1]['transaction_date']).total_seconds() / 60
                
                if time_diff < 30:  # Same amount within 30 minutes
                    anomalies.append({
                        'type': 'duplicate_amount',
                        'transaction_date': df_sorted.iloc[i]['transaction_date'].isoformat(),
                        'amount': df_sorted.iloc[i]['amount'],
                        'time_gap_minutes': round(time_diff, 1),
                        'description': f"Duplicate amount: ${df_sorted.iloc[i]['amount']:.2f} within {time_diff:.0f} minutes",
                        'severity': 'medium'
                    })
        
        # Check for round number bias (too many round amounts)
        round_amounts = df[df['amount'] % 100 == 0]
        round_ratio = len(round_amounts) / len(df)
        
        if round_ratio > 0.5 and len(df) > 10:  # More than 50% round amounts
            anomalies.append({
                'type': 'round_number_bias',
                'transaction_date': datetime.now().isoformat(),
                'round_ratio': round(round_ratio, 2),
                'description': f"High ratio of round amounts: {round_ratio:.1%}",
                'severity': 'low'
            })
        
        return anomalies
    
    def is_transaction_anomaly(self, transaction: Dict, user_history: List[Dict]) -> Dict:
        """Check if a single transaction is anomalous given user history."""
        if not user_history:
            return {'is_anomaly': False, 'reason': 'No history available'}
        
        try:
            # Combine current transaction with history
            all_transactions = user_history + [transaction]
            result = self.detect_anomalies(all_transactions)
            
            # Check if the last transaction (current one) is flagged
            current_time = pd.to_datetime(transaction['transaction_date'])
            
            for anomaly in result.get('anomalies', []):
                anomaly_time = pd.to_datetime(anomaly['transaction_date'])
                time_diff = abs((current_time - anomaly_time).total_seconds())
                
                if time_diff < 60:  # Within 1 minute (same transaction)
                    return {
                        'is_anomaly': True,
                        'type': anomaly['type'],
                        'description': anomaly['description'],
                        'severity': anomaly['severity']
                    }
            
            return {'is_anomaly': False, 'reason': 'Transaction appears normal'}
            
        except Exception as e:
            logger.error(f"Error checking transaction anomaly: {e}")
            return {'is_anomaly': False, 'reason': 'Error in analysis'}