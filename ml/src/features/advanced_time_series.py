"""
Advanced Time Series Feature Engineering for Unity Wallet
Enhanced spending pattern analysis with rolling windows and seasonality
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

class TimeSeriesFeatureEngine:
    """
    Advanced time-series feature extraction for financial transactions
    
    Features generated:
    - Rolling statistics (mean, std, max, min, count)
    - Trend analysis (slope, acceleration) 
    - Seasonality patterns (weekend, night, monthly)
    - Velocity features (transaction frequency)
    - Temporal anomalies (unusual timing patterns)
    """
    
    def __init__(self):
        self.window_sizes = [7, 14, 30, 90]  # days
        self.time_buckets = {
            'dawn': (5, 8),      # 5-8 AM
            'morning': (8, 12),   # 8-12 PM  
            'afternoon': (12, 17), # 12-5 PM
            'evening': (17, 22),   # 5-10 PM
            'night': (22, 5)       # 10 PM - 5 AM
        }
        
    def extract_features(self, transactions_df: pd.DataFrame, user_id: str) -> Dict[str, float]:
        """
        Extract comprehensive time-series features for a user
        
        Args:
            transactions_df: DataFrame with columns [user_id, amount, timestamp, category, merchant]
            user_id: Target user for feature extraction
            
        Returns:
            Dictionary of time-series features
        """
        
        # Filter user transactions
        user_txns = transactions_df[transactions_df['user_id'] == user_id].copy()
        
        if len(user_txns) < 10:  # Need minimum transactions
            return self._default_features()
            
        # Sort by timestamp
        user_txns = user_txns.sort_values('timestamp')
        user_txns['timestamp'] = pd.to_datetime(user_txns['timestamp'])
        
        features = {}
        
        # 1. Rolling window statistics
        features.update(self._rolling_statistics(user_txns))
        
        # 2. Trend analysis
        features.update(self._trend_analysis(user_txns))
        
        # 3. Seasonality patterns
        features.update(self._seasonality_patterns(user_txns))
        
        # 4. Velocity features
        features.update(self._velocity_features(user_txns))
        
        # 5. Temporal anomalies
        features.update(self._temporal_anomalies(user_txns))
        
        return features
    
    def _rolling_statistics(self, user_txns: pd.DataFrame) -> Dict[str, float]:
        """Calculate rolling window statistics"""
        features = {}
        
        # Set timestamp as index for rolling calculations
        daily_amounts = user_txns.set_index('timestamp').resample('D')['amount'].sum()
        daily_counts = user_txns.set_index('timestamp').resample('D')['amount'].count()
        
        for window in self.window_sizes:
            # Amount statistics
            rolling_amounts = daily_amounts.rolling(window=window, min_periods=1)
            features[f'amount_mean_{window}d'] = rolling_amounts.mean().iloc[-1]
            features[f'amount_std_{window}d'] = rolling_amounts.std().iloc[-1]
            features[f'amount_max_{window}d'] = rolling_amounts.max().iloc[-1]
            features[f'amount_min_{window}d'] = rolling_amounts.min().iloc[-1]
            
            # Transaction count statistics
            rolling_counts = daily_counts.rolling(window=window, min_periods=1)
            features[f'tx_count_mean_{window}d'] = rolling_counts.mean().iloc[-1]
            features[f'tx_count_std_{window}d'] = rolling_counts.std().iloc[-1]
            features[f'tx_count_max_{window}d'] = rolling_counts.max().iloc[-1]
            
            # Spending consistency (coefficient of variation)
            mean_val = features[f'amount_mean_{window}d']
            std_val = features[f'amount_std_{window}d']
            features[f'amount_cv_{window}d'] = std_val / mean_val if mean_val > 0 else 0
            
        return features
    
    def _trend_analysis(self, user_txns: pd.DataFrame) -> Dict[str, float]:
        """Analyze spending trends"""
        features = {}
        
        # Daily spending trend
        daily_amounts = user_txns.set_index('timestamp').resample('D')['amount'].sum()
        
        if len(daily_amounts) >= 7:
            # Linear trend (slope)
            x = np.arange(len(daily_amounts))
            y = daily_amounts.values
            
            # Calculate slope using least squares
            slope = np.polyfit(x, y, 1)[0]
            features['spending_trend_7d'] = slope
            
            # Acceleration (second derivative)
            if len(daily_amounts) >= 14:
                recent_slope = np.polyfit(x[-7:], y[-7:], 1)[0]
                older_slope = np.polyfit(x[-14:-7], y[-14:-7], 1)[0]
                features['spending_acceleration_14d'] = recent_slope - older_slope
            else:
                features['spending_acceleration_14d'] = 0
        else:
            features['spending_trend_7d'] = 0
            features['spending_acceleration_14d'] = 0
            
        # Trend volatility
        if len(daily_amounts) >= 30:
            # Calculate 7-day rolling slopes
            slopes = []
            for i in range(7, len(daily_amounts)):
                x_window = np.arange(7)
                y_window = daily_amounts.iloc[i-7:i].values
                slope = np.polyfit(x_window, y_window, 1)[0]
                slopes.append(slope)
            
            features['trend_volatility_30d'] = np.std(slopes) if slopes else 0
        else:
            features['trend_volatility_30d'] = 0
            
        return features
    
    def _seasonality_patterns(self, user_txns: pd.DataFrame) -> Dict[str, float]:
        """Extract seasonal and periodic patterns"""
        features = {}
        
        # Add time components
        user_txns['hour'] = user_txns['timestamp'].dt.hour
        user_txns['day_of_week'] = user_txns['timestamp'].dt.dayofweek
        user_txns['day_of_month'] = user_txns['timestamp'].dt.day
        
        total_txns = len(user_txns)
        total_amount = user_txns['amount'].sum()
        
        # Weekend vs weekday patterns
        weekend_txns = user_txns[user_txns['day_of_week'].isin([5, 6])]
        features['weekend_tx_ratio'] = len(weekend_txns) / total_txns
        features['weekend_amount_ratio'] = weekend_txns['amount'].sum() / total_amount
        
        # Time bucket analysis
        for bucket, (start_hour, end_hour) in self.time_buckets.items():
            if start_hour < end_hour:
                bucket_txns = user_txns[
                    (user_txns['hour'] >= start_hour) & 
                    (user_txns['hour'] < end_hour)
                ]
            else:  # Night time (crosses midnight)
                bucket_txns = user_txns[
                    (user_txns['hour'] >= start_hour) | 
                    (user_txns['hour'] < end_hour)
                ]
                
            features[f'{bucket}_tx_ratio'] = len(bucket_txns) / total_txns
            features[f'{bucket}_amount_ratio'] = bucket_txns['amount'].sum() / total_amount
            
        # Monthly spending pattern (beginning vs end of month)
        beginning_month = user_txns[user_txns['day_of_month'] <= 10]
        end_month = user_txns[user_txns['day_of_month'] >= 21]
        
        features['beginning_month_ratio'] = len(beginning_month) / total_txns
        features['end_month_ratio'] = len(end_month) / total_txns
        
        # Day of week distribution entropy (measure of regularity)
        dow_counts = user_txns['day_of_week'].value_counts(normalize=True)
        entropy = -np.sum(dow_counts * np.log2(dow_counts + 1e-10))
        features['dow_entropy'] = entropy
        
        return features
    
    def _velocity_features(self, user_txns: pd.DataFrame) -> Dict[str, float]:
        """Calculate transaction velocity and frequency patterns"""
        features = {}
        
        # Time between transactions
        user_txns = user_txns.sort_values('timestamp')
        time_diffs = user_txns['timestamp'].diff().dt.total_seconds() / 3600  # hours
        time_diffs = time_diffs.dropna()
        
        if len(time_diffs) > 0:
            features['avg_time_between_tx_hours'] = time_diffs.mean()
            features['std_time_between_tx_hours'] = time_diffs.std()
            features['min_time_between_tx_hours'] = time_diffs.min()
            features['max_time_between_tx_hours'] = time_diffs.max()
            
            # Velocity consistency (coefficient of variation)
            features['velocity_consistency'] = time_diffs.std() / time_diffs.mean()
            
            # Burst detection (transactions within 1 hour)
            burst_txns = (time_diffs < 1).sum()
            features['burst_transaction_ratio'] = burst_txns / len(time_diffs)
        else:
            features.update({
                'avg_time_between_tx_hours': 0,
                'std_time_between_tx_hours': 0,
                'min_time_between_tx_hours': 0,
                'max_time_between_tx_hours': 0,
                'velocity_consistency': 0,
                'burst_transaction_ratio': 0
            })
            
        # Daily transaction frequency
        daily_counts = user_txns.set_index('timestamp').resample('D')['amount'].count()
        
        features['avg_daily_tx_count'] = daily_counts.mean()
        features['max_daily_tx_count'] = daily_counts.max()
        features['days_with_transactions'] = (daily_counts > 0).sum()
        
        # Active days ratio (days with transactions / total days)
        total_days = (user_txns['timestamp'].max() - user_txns['timestamp'].min()).days + 1
        features['active_days_ratio'] = features['days_with_transactions'] / max(total_days, 1)
        
        return features
    
    def _temporal_anomalies(self, user_txns: pd.DataFrame) -> Dict[str, float]:
        """Detect temporal anomalies in spending patterns"""
        features = {}
        
        # Unusual timing score
        user_txns['hour'] = user_txns['timestamp'].dt.hour
        
        # Calculate typical hours of activity
        hour_counts = user_txns['hour'].value_counts(normalize=True)
        
        # Entropy of hour distribution (higher = more scattered)
        hour_entropy = -np.sum(hour_counts * np.log2(hour_counts + 1e-10))
        features['hour_pattern_entropy'] = hour_entropy
        
        # Night transaction ratio (11 PM - 6 AM)
        night_hours = [23, 0, 1, 2, 3, 4, 5]
        night_txns = user_txns[user_txns['hour'].isin(night_hours)]
        features['night_transaction_ratio'] = len(night_txns) / len(user_txns)
        
        # Weekend late night transactions (potential risk indicator)
        user_txns['is_weekend'] = user_txns['timestamp'].dt.dayofweek.isin([5, 6])
        weekend_night = user_txns[
            user_txns['is_weekend'] & 
            user_txns['hour'].isin([23, 0, 1, 2])
        ]
        features['weekend_late_night_ratio'] = len(weekend_night) / len(user_txns)
        
        # Transaction gaps (periods of no activity)
        daily_activity = user_txns.set_index('timestamp').resample('D')['amount'].count()
        no_activity_days = (daily_activity == 0).sum()
        total_period_days = len(daily_activity)
        
        features['inactivity_ratio'] = no_activity_days / max(total_period_days, 1)
        
        # Longest inactive period
        inactive_periods = []
        current_inactive = 0
        
        for has_activity in (daily_activity > 0):
            if not has_activity:
                current_inactive += 1
            else:
                if current_inactive > 0:
                    inactive_periods.append(current_inactive)
                current_inactive = 0
                
        if current_inactive > 0:
            inactive_periods.append(current_inactive)
            
        features['max_inactive_days'] = max(inactive_periods) if inactive_periods else 0
        
        return features
    
    def _default_features(self) -> Dict[str, float]:
        """Return default features for users with insufficient data"""
        features = {}
        
        # Rolling statistics defaults
        for window in self.window_sizes:
            features.update({
                f'amount_mean_{window}d': 0.0,
                f'amount_std_{window}d': 0.0,
                f'amount_max_{window}d': 0.0,
                f'amount_min_{window}d': 0.0,
                f'tx_count_mean_{window}d': 0.0,
                f'tx_count_std_{window}d': 0.0,
                f'tx_count_max_{window}d': 0.0,
                f'amount_cv_{window}d': 0.0
            })
        
        # Trend defaults
        features.update({
            'spending_trend_7d': 0.0,
            'spending_acceleration_14d': 0.0,
            'trend_volatility_30d': 0.0
        })
        
        # Seasonality defaults
        features.update({
            'weekend_tx_ratio': 0.0,
            'weekend_amount_ratio': 0.0,
            'beginning_month_ratio': 0.0,
            'end_month_ratio': 0.0,
            'dow_entropy': 0.0
        })
        
        # Time bucket defaults
        for bucket in self.time_buckets.keys():
            features.update({
                f'{bucket}_tx_ratio': 0.0,
                f'{bucket}_amount_ratio': 0.0
            })
        
        # Velocity defaults
        features.update({
            'avg_time_between_tx_hours': 0.0,
            'std_time_between_tx_hours': 0.0,
            'min_time_between_tx_hours': 0.0,
            'max_time_between_tx_hours': 0.0,
            'velocity_consistency': 0.0,
            'burst_transaction_ratio': 0.0,
            'avg_daily_tx_count': 0.0,
            'max_daily_tx_count': 0.0,
            'days_with_transactions': 0.0,
            'active_days_ratio': 0.0
        })
        
        # Temporal anomaly defaults
        features.update({
            'hour_pattern_entropy': 0.0,
            'night_transaction_ratio': 0.0,
            'weekend_late_night_ratio': 0.0,
            'inactivity_ratio': 0.0,
            'max_inactive_days': 0.0
        })
        
        return features

def demo_time_series_features():
    """Demo the advanced time-series feature extraction"""
    
    # Create sample data
    import pandas as pd
    from datetime import datetime, timedelta
    
    # Generate sample transactions
    base_date = datetime.now() - timedelta(days=90)
    
    sample_data = []
    for i in range(100):
        sample_data.append({
            'user_id': 'user_001',
            'amount': np.random.lognormal(mean=4, sigma=1),  # Realistic spending amounts
            'timestamp': base_date + timedelta(
                days=i//2,  # ~2 transactions per day
                hours=np.random.randint(8, 22)  # Business hours mostly
            ),
            'category': np.random.choice(['food', 'transport', 'shopping', 'entertainment']),
            'merchant': f'merchant_{np.random.randint(1, 20)}'
        })
    
    df = pd.DataFrame(sample_data)
    
    # Extract features
    feature_engine = TimeSeriesFeatureEngine()
    features = feature_engine.extract_features(df, 'user_001')
    
    print("🚀 Advanced Time-Series Features Extracted:")
    print(f"📊 Total features: {len(features)}")
    print("\n📈 Sample Features:")
    
    for feature, value in list(features.items())[:10]:
        print(f"  {feature}: {value:.4f}")
    
    print(f"\n✅ Feature extraction completed successfully!")
    return features

if __name__ == "__main__":
    demo_time_series_features()
