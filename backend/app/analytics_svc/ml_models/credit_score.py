"""
Credit Score Model
Lightweight model for internal credit scoring with calibration and reason codes
"""
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from ...common.logging import get_logger

logger = get_logger("credit_score_model")


class CreditScoreModel:
    """
    Credit scoring model with probability calibration and reason codes.
    """

    def __init__(self, model_path: Optional[Path] = None):
        self.config = {
            'score_range': (300, 850),
            'grade_thresholds': {'A': 750, 'B': 650, 'C': 550, 'D': 450},
            'calibration': True,
            'random_state': 42
        }
        
        self.model = None
        self.scaler = StandardScaler()
        self.calibrated_model = None
        self.feature_names = []
        self.feature_importance = {}
        self.is_trained = False
        
        # Reason codes mapping
        self.reason_codes = {
            'income_stability': 'Thu nhập ổn định',
            'transaction_frequency': 'Tần suất giao dịch cao',
            'spending_diversity': 'Đa dạng danh mục chi tiêu',
            'amount_consistency': 'Chi tiêu đều đặn',
            'low_volatility': 'Biến động chi tiêu thấp',
            'high_activity': 'Hoạt động tài chính tích cực',
            'location_stability': 'Ổn định địa lý',
            'payment_patterns': 'Mẫu thanh toán tốt',
            'category_balance': 'Cân bằng danh mục chi tiêu',
            'growth_trend': 'Xu hướng tăng trưởng tích cực'
        }
        
        self.negative_reason_codes = {
            'irregular_income': 'Thu nhập không đều',
            'low_activity': 'Hoạt động tài chính thấp',
            'high_volatility': 'Biến động chi tiêu cao',
            'concentrated_spending': 'Chi tiêu tập trung',
            'outlier_transactions': 'Giao dịch bất thường cao',
            'inconsistent_patterns': 'Mẫu giao dịch không nhất quán',
            'limited_diversity': 'Hạn chế đa dạng',
            'unstable_location': 'Bất ổn địa lý',
            'irregular_amounts': 'Số tiền không đều',
            'negative_trend': 'Xu hướng giảm'
        }
        
        if model_path and model_path.exists():
            self.load_model(model_path)

    def extract_features_from_transactions(self, transactions: List[Dict]) -> Dict:
        """Extract credit features from transaction list."""
        if not transactions:
            return {}
        
        df = pd.DataFrame(transactions)
        
        # Convert types
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
        df['transaction_date'] = pd.to_datetime(df['transaction_date'], errors='coerce')
        df['is_weekend'] = pd.to_numeric(df.get('is_weekend', 0), errors='coerce')
        df['is_outlier'] = pd.to_numeric(df.get('is_outlier', 0), errors='coerce')
        
        # Drop invalid rows
        df = df.dropna(subset=['amount', 'transaction_date'])
        
        if len(df) == 0:
            return {}
        
        # Monthly aggregations
        df['month'] = df['transaction_date'].dt.to_period('M')
        monthly_stats = df.groupby('month')['amount'].agg(['sum', 'count', 'std']).fillna(0)
        
        # Basic transaction features
        features = {
            # Volume features
            'total_transactions': len(df),
            'total_amount': float(df['amount'].sum()),
            'avg_transaction_amount': float(df['amount'].mean()),
            'median_transaction_amount': float(df['amount'].median()),
            'std_transaction_amount': float(df['amount'].std() or 0),
            'max_transaction_amount': float(df['amount'].max()),
            'min_transaction_amount': float(df['amount'].min()),
            
            # Monthly patterns (stability indicators)
            'avg_monthly_transactions': float(monthly_stats['count'].mean()),
            'std_monthly_transactions': float(monthly_stats['count'].std() or 0),
            'avg_monthly_amount': float(monthly_stats['sum'].mean()),
            'std_monthly_amount': float(monthly_stats['sum'].std() or 0),
            
            # Diversity features
            'unique_categories': df['category'].nunique() if 'category' in df.columns else 1,
            'unique_merchants': df['merchant_name'].nunique() if 'merchant_name' in df.columns else 1,
            'unique_locations': df['location'].nunique() if 'location' in df.columns else 1,
            
            # Behavioral patterns
            'weekend_transaction_ratio': float(df['is_weekend'].mean()),
            'outlier_ratio': float(df['is_outlier'].mean()),
            'mobile_usage_ratio': float((df['channel'] == 'mobile_app').mean()) if 'channel' in df.columns else 0.5,
            
            # Velocity features (recent activity)
            'transactions_last_30_days': len(df[df['transaction_date'] >= df['transaction_date'].max() - pd.Timedelta(days=30)]),
            'amount_last_30_days': float(df[df['transaction_date'] >= df['transaction_date'].max() - pd.Timedelta(days=30)]['amount'].sum()),
        }
        
        # Derived features (ratios and stability measures)
        features.update({
            # Stability measures
            'transaction_consistency': 1 / (1 + features['std_monthly_transactions'] / (features['avg_monthly_transactions'] + 1)),
            'amount_consistency': 1 / (1 + features['std_monthly_amount'] / (features['avg_monthly_amount'] + 1)),
            'volatility_ratio': features['std_transaction_amount'] / (features['avg_transaction_amount'] + 1),
            
            # Activity measures
            'activity_score': min(features['total_transactions'] / 50, 1.0),
            'diversity_score': min(features['unique_categories'] / 7, 1.0),
            'location_stability': 1 / (features['unique_locations'] + 1),
            
            # Recent activity ratio
            'recent_activity_ratio': features['transactions_last_30_days'] / (features['total_transactions'] + 1),
            
            # Amount patterns
            'high_value_transaction_ratio': len(df[df['amount'] > df['amount'].quantile(0.9)]) / (features['total_transactions'] + 1),
            'amount_range_ratio': (features['max_transaction_amount'] - features['min_transaction_amount']) / (features['avg_transaction_amount'] + 1)
        })
        
        return features

    def predict_score(self, transactions: List[Dict]) -> Dict:
        """Predict credit score for user transactions."""
        if not self.is_trained:
            logger.warning("Model not trained, using fallback scoring")
            return self._fallback_score(transactions)
        
        try:
            # Extract features
            features = self.extract_features_from_transactions(transactions)
            if not features:
                return {'error': 'No transaction data available'}
            
            # Prepare feature vector
            X = np.array([features.get(name, 0) for name in self.feature_names])
            X = np.nan_to_num(X.reshape(1, -1), nan=0, posinf=1, neginf=0)
            X_scaled = self.scaler.transform(X)
            
            # Predict probability
            prob_good_credit = self.calibrated_model.predict_proba(X_scaled)[0, 1]
            
            # Convert to score
            score_range = self.config['score_range']
            credit_score = int(score_range[0] + prob_good_credit * (score_range[1] - score_range[0]))
            
            # Determine grade
            grade = self._score_to_grade(credit_score)
            
            # Generate reason codes
            reason_codes = self._generate_reason_codes(features, prob_good_credit)
            
            return {
                'credit_score': credit_score,
                'probability': prob_good_credit,
                'grade': grade,
                'reason_codes': reason_codes,
                'score_range': score_range,
                'generated_at': datetime.now().isoformat(),
                'model_version': '1.0'
            }
        except Exception as e:
            logger.error(f"Error in credit score prediction: {e}")
            return self._fallback_score(transactions)

    def _fallback_score(self, transactions: List[Dict]) -> Dict:
        """Fallback scoring when model fails."""
        if not transactions:
            score = 650  # Default score
        else:
            # Simple heuristic based on transaction count and consistency
            tx_count = len(transactions)
            avg_amount = sum(float(tx.get('amount', 0)) for tx in transactions) / max(tx_count, 1)
            
            base_score = 650
            activity_bonus = min(tx_count * 2, 50)  # Up to 50 points for activity
            amount_bonus = min(int(avg_amount / 100000), 50)  # Up to 50 points for higher amounts
            
            score = base_score + activity_bonus + amount_bonus
        
        return {
            'credit_score': min(max(score, 300), 850),
            'probability': 0.5,
            'grade': self._score_to_grade(score),
            'reason_codes': [],
            'score_range': (300, 850),
            'generated_at': datetime.now().isoformat(),
            'model_version': 'fallback'
        }

    def _score_to_grade(self, score: int) -> str:
        """Convert numeric score to letter grade."""
        thresholds = self.config['grade_thresholds']
        
        if score >= thresholds['A']:
            return 'A'
        elif score >= thresholds['B']:
            return 'B'
        elif score >= thresholds['C']:
            return 'C'
        else:
            return 'D'

    def _generate_reason_codes(self, features: Dict, probability: float) -> List[Dict]:
        """Generate reason codes based on feature values."""
        if not self.feature_importance:
            return []
        
        reasons = []
        
        # Get top contributing features
        feature_contributions = []
        for feature_name in self.feature_names:
            if feature_name in features and feature_name in self.feature_importance:
                value = features[feature_name]
                importance = self.feature_importance[feature_name]
                contribution = value * importance
                feature_contributions.append((feature_name, contribution, value))
        
        # Sort by absolute contribution
        feature_contributions.sort(key=lambda x: abs(x[1]), reverse=True)
        
        # Map features to reason codes
        feature_to_reason = {
            'transaction_consistency': ('income_stability', 'irregular_income'),
            'amount_consistency': ('amount_consistency', 'irregular_amounts'),
            'diversity_score': ('spending_diversity', 'limited_diversity'),
            'activity_score': ('high_activity', 'low_activity'),
            'location_stability': ('location_stability', 'unstable_location'),
            'outlier_ratio': ('payment_patterns', 'outlier_transactions'),
            'volatility_ratio': ('low_volatility', 'high_volatility'),
            'unique_categories': ('category_balance', 'concentrated_spending'),
            'total_transactions': ('transaction_frequency', 'low_activity'),
            'recent_activity_ratio': ('growth_trend', 'negative_trend')
        }
        
        # Generate top 3 reason codes
        for i, (feature_name, contribution, value) in enumerate(feature_contributions[:3]):
            if feature_name in feature_to_reason:
                positive_code, negative_code = feature_to_reason[feature_name]
                
                # Determine if this is positive or negative factor
                is_positive = contribution > 0 if probability > 0.5 else contribution < 0
                
                if is_positive:
                    code = positive_code
                    description = self.reason_codes.get(code, f"Positive factor: {feature_name}")
                    impact = "positive"
                else:
                    code = negative_code
                    description = self.negative_reason_codes.get(code, f"Negative factor: {feature_name}")
                    impact = "negative"
                
                reasons.append({
                    'code': code,
                    'description': description,
                    'impact': impact,
                    'feature': feature_name,
                    'value': round(value, 3),
                    'importance': round(abs(contribution), 3)
                })
        
        return reasons

    def load_model(self, model_path: Path):
        """Load a trained model."""
        try:
            model_data = joblib.load(model_path)
            
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.calibrated_model = model_data['calibrated_model']
            self.feature_names = model_data['feature_names']
            self.feature_importance = model_data['feature_importance']
            self.config = model_data['config']
            self.reason_codes = model_data['reason_codes']
            self.negative_reason_codes = model_data['negative_reason_codes']
            self.is_trained = model_data['is_trained']
            
            logger.info(f"Credit score model loaded from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load model from {model_path}: {e}")
            self.is_trained = False