"""
Credit Score Model
Lightweight model for internal credit scoring with calibration and reason codes
"""
import pandas as pd
import numpy as np
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import joblib
from datetime import datetime

from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import roc_auc_score, brier_score_loss, classification_report
import warnings
warnings.filterwarnings('ignore')

class CreditScoreModel:
    """
    Credit scoring model with probability calibration and reason codes
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {
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
    
    def extract_features(self, transactions_df: pd.DataFrame, user_id: str) -> Dict:
        """Extract credit features from transaction history"""
        user_txns = transactions_df[transactions_df['user_id'] == user_id].copy()
        
        if len(user_txns) == 0:
            return {}
        
        # Convert types
        user_txns['amount'] = pd.to_numeric(user_txns['amount'])
        user_txns['transaction_date'] = pd.to_datetime(user_txns['transaction_date'])
        user_txns['is_weekend'] = pd.to_numeric(user_txns.get('is_weekend', 0))
        user_txns['is_outlier'] = pd.to_numeric(user_txns.get('is_outlier', 0))
        
        # Monthly aggregations
        user_txns['month'] = user_txns['transaction_date'].dt.to_period('M')
        monthly_stats = user_txns.groupby('month')['amount'].agg(['sum', 'count', 'std']).fillna(0)
        
        # Basic transaction features
        features = {
            # Volume features
            'total_transactions': len(user_txns),
            'total_amount': float(user_txns['amount'].sum()),
            'avg_transaction_amount': float(user_txns['amount'].mean()),
            'median_transaction_amount': float(user_txns['amount'].median()),
            'std_transaction_amount': float(user_txns['amount'].std() or 0),
            'max_transaction_amount': float(user_txns['amount'].max()),
            'min_transaction_amount': float(user_txns['amount'].min()),
            
            # Monthly patterns (stability indicators)
            'avg_monthly_transactions': float(monthly_stats['count'].mean()),
            'std_monthly_transactions': float(monthly_stats['count'].std() or 0),
            'avg_monthly_amount': float(monthly_stats['sum'].mean()),
            'std_monthly_amount': float(monthly_stats['sum'].std() or 0),
            
            # Diversity features
            'unique_categories': user_txns['category'].nunique(),
            'unique_merchants': user_txns['merchant_name'].nunique(),
            'unique_locations': user_txns['location'].nunique(),
            
            # Behavioral patterns
            'weekend_transaction_ratio': float(user_txns['is_weekend'].mean()),
            'outlier_ratio': float(user_txns['is_outlier'].mean()),
            'mobile_usage_ratio': float((user_txns['channel'] == 'mobile_app').mean()) if 'channel' in user_txns.columns else 0.5,
            
            # Velocity features (recent activity)
            'transactions_last_30_days': len(user_txns[user_txns['transaction_date'] >= user_txns['transaction_date'].max() - pd.Timedelta(days=30)]),
            'amount_last_30_days': float(user_txns[user_txns['transaction_date'] >= user_txns['transaction_date'].max() - pd.Timedelta(days=30)]['amount'].sum()),
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
            'high_value_transaction_ratio': len(user_txns[user_txns['amount'] > user_txns['amount'].quantile(0.9)]) / (features['total_transactions'] + 1),
            'amount_range_ratio': (features['max_transaction_amount'] - features['min_transaction_amount']) / (features['avg_transaction_amount'] + 1)
        })
        
        return features
    
    def prepare_dataset(self, transactions_df: pd.DataFrame, credit_features_df: pd.DataFrame = None) -> Tuple[pd.DataFrame, np.ndarray]:
        """Prepare feature matrix and labels"""
        users = transactions_df['user_id'].unique()
        
        feature_list = []
        labels = []
        
        for user_id in users:
            features = self.extract_features(transactions_df, user_id)
            if features:
                features['user_id'] = user_id
                feature_list.append(features)
                
                # Get label from credit_features if available, otherwise generate synthetic
                if credit_features_df is not None and user_id in credit_features_df['user_id'].values:
                    label = credit_features_df[credit_features_df['user_id'] == user_id]['credit_label'].iloc[0]
                else:
                    # Generate synthetic label based on features
                    label = self._generate_synthetic_label(features)
                
                labels.append(label)
        
        features_df = pd.DataFrame(feature_list)
        
        # Store feature names (exclude user_id)
        self.feature_names = [col for col in features_df.columns if col != 'user_id']
        
        return features_df, np.array(labels)
    
    def _generate_synthetic_label(self, features: Dict) -> int:
        """Generate synthetic credit label based on features"""
        # Composite score based on multiple factors
        consistency_score = (features['transaction_consistency'] + features['amount_consistency']) / 2
        diversity_score = features['diversity_score']
        activity_score = features['activity_score']
        stability_score = features['location_stability']
        outlier_penalty = 1 - features['outlier_ratio']
        
        composite_score = (
            consistency_score * 0.3 +
            diversity_score * 0.2 +
            activity_score * 0.2 +
            stability_score * 0.15 +
            outlier_penalty * 0.15
        )
        
        # Add some randomness and stricter thresholds for more balanced classes
        noise = np.random.normal(0, 0.1)
        adjusted_score = composite_score + noise
        
        # More balanced threshold: good credit if composite score > 0.7
        return 1 if adjusted_score > 0.7 else 0
    
    def train(self, transactions_df: pd.DataFrame, credit_features_df: pd.DataFrame = None) -> Dict:
        """Train the credit scoring model"""
        print("🔄 Training credit score model...")
        
        # Prepare data
        features_df, labels = self.prepare_dataset(transactions_df, credit_features_df)
        
        if len(features_df) == 0:
            raise ValueError("No features extracted!")
        
        print(f"📊 Training on {len(features_df)} users with {len(self.feature_names)} features")
        
        # Prepare feature matrix
        X = features_df[self.feature_names].values
        y = labels
        
        # Handle missing values
        X = np.nan_to_num(X, nan=0, posinf=1, neginf=0)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, random_state=self.config['random_state'], stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train base model
        self.model = LogisticRegression(
            random_state=self.config['random_state'],
            max_iter=1000,
            class_weight='balanced'
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Calibrate probabilities if requested and have enough data
        if self.config.get('calibration', True) and len(set(y)) > 1 and len(y_train) >= 6:
            try:
                self.calibrated_model = CalibratedClassifierCV(
                    self.model, method='sigmoid', cv=min(3, len(y_train) // 2)
                )
                self.calibrated_model.fit(X_train_scaled, y_train)
            except ValueError:
                print("⚠️  Calibration failed, using base model")
                self.calibrated_model = self.model
        else:
            self.calibrated_model = self.model
        
        # Evaluate
        y_pred = self.calibrated_model.predict(X_test_scaled)
        y_proba = self.calibrated_model.predict_proba(X_test_scaled)[:, 1]
        
        roc_auc = roc_auc_score(y_test, y_proba)
        brier_score = brier_score_loss(y_test, y_proba)
        
        # Feature importance
        importance = np.abs(self.model.coef_[0])
        self.feature_importance = dict(zip(self.feature_names, importance))
        
        self.is_trained = True
        
        metrics = {
            'roc_auc': roc_auc,
            'brier_score': brier_score,
            'n_samples': len(features_df),
            'n_features': len(self.feature_names),
            'positive_rate': np.mean(y),
            'feature_importance': self.feature_importance
        }
        
        print(f"✅ Training completed!")
        print(f"   ROC-AUC: {roc_auc:.3f}")
        print(f"   Brier Score: {brier_score:.3f}")
        print(f"   Positive Rate: {np.mean(y):.1%}")
        
        return metrics
    
    def predict_score(self, transactions_df: pd.DataFrame, user_id: str) -> Dict:
        """Predict credit score for a user"""
        if not self.is_trained:
            raise ValueError("Model not trained!")
        
        # Extract features
        features = self.extract_features(transactions_df, user_id)
        if not features:
            return {'error': 'No transaction data available'}
        
        # Prepare feature vector
        X = np.array([features[name] for name in self.feature_names])
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
            'user_id': user_id,
            'credit_score': credit_score,
            'probability': prob_good_credit,
            'grade': grade,
            'reason_codes': reason_codes,
            'score_range': score_range,
            'generated_at': datetime.now().isoformat(),
            'model_version': '1.0'
        }
    
    def _score_to_grade(self, score: int) -> str:
        """Convert numeric score to letter grade"""
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
        """Generate reason codes based on feature values"""
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
        
        # Generate top 3-4 reason codes
        for i, (feature_name, contribution, value) in enumerate(feature_contributions[:4]):
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
        
        return reasons[:3]  # Return top 3 reasons
    
    def save_model(self, model_path: Path):
        """Save the trained model"""
        if not self.is_trained:
            raise ValueError("No trained model to save!")
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'calibrated_model': self.calibrated_model,
            'feature_names': self.feature_names,
            'feature_importance': self.feature_importance,
            'config': self.config,
            'reason_codes': self.reason_codes,
            'negative_reason_codes': self.negative_reason_codes,
            'is_trained': self.is_trained
        }
        
        joblib.dump(model_data, model_path)
        print(f"✅ Credit model saved to {model_path}")
    
    def load_model(self, model_path: Path):
        """Load a trained model"""
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
        
        print(f"✅ Credit model loaded from {model_path}")

def train_credit_model():
    """Train and save the credit scoring model"""
    import sys
    sys.path.append(str(Path(__file__).parent.parent))
    from config import SEED_DATA_PATH, MODELS_ROOT
    
    # Create models directory
    MODELS_ROOT.mkdir(parents=True, exist_ok=True)
    
    # Load data
    transactions_df = pd.read_csv(SEED_DATA_PATH / "transactions.csv")
    credit_features_df = pd.read_csv(SEED_DATA_PATH / "credit_features.csv")
    
    print(f"📊 Loaded {len(transactions_df)} transactions for {len(credit_features_df)} users")
    
    # Initialize and train model
    model = CreditScoreModel()
    metrics = model.train(transactions_df, credit_features_df)
    
    # Save model
    model_path = MODELS_ROOT / "credit_score_model.joblib"
    model.save_model(model_path)
    
    # Save metrics
    metrics_path = MODELS_ROOT / "credit_score_metrics.json"
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2, default=str)
    
    print(f"✅ Metrics saved to {metrics_path}")
    
    # Test predictions
    print("\n🧪 Testing credit score predictions:")
    users = transactions_df['user_id'].unique()
    
    for user_id in users:
        prediction = model.predict_score(transactions_df, user_id)
        print(f"\n👤 {user_id}:")
        print(f"   Credit Score: {prediction['credit_score']} (Grade: {prediction['grade']})")
        print(f"   Probability: {prediction['probability']:.3f}")
        print(f"   Top Reasons:")
        for reason in prediction['reason_codes']:
            print(f"     • [{reason['impact']}] {reason['description']} (importance: {reason['importance']:.3f})")
    
    return model, metrics

if __name__ == "__main__":
    train_credit_model()
