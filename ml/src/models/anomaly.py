"""
Anomaly Detection Model
Phát hiện giao dịch bất thường dựa trên patterns và rules
"""

import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
from geopy.distance import geodesic
import warnings
warnings.filterwarnings('ignore')


class AnomalyDetector:
    """Rule-based anomaly detector with geographical analysis"""
    
    def __init__(self):
        # Configuration
        self.config = {
            'amount_threshold_multiplier': 3.0,
            'velocity_window_hours': 6,
            'geo_radius_km': 100,
            'alert_threshold': 0.4,
            'cooldown_hours': 24,
            'min_transactions_for_baseline': 5
        }
        
        # State
        self.user_baselines = {}
        self.alert_history = {}
        
        # Vietnamese city coordinates for geographical analysis
        self.city_locations = {
            'Ho Chi Minh City': (10.8231, 106.6297),
            'Hanoi': (21.0285, 105.8542),
            'Da Nang': (16.0544, 108.2022),
            'Can Tho': (10.0452, 105.7469),
            'Bien Hoa': (10.9465, 106.8230),
            'Vung Tau': (10.4113, 107.1365),
            'Nha Trang': (12.2388, 109.1967),
            'Hue': (16.4637, 107.5909),
            'Hai Phong': (20.8449, 106.6881),
            'Long Xuyen': (10.3871, 105.4351),
            'Thu Dau Mot': (10.9804, 106.6519),
            'Buon Ma Thuot': (12.6667, 108.0500),
            'Phan Thiet': (10.9289, 108.1015),
            'Ca Mau': (9.1769, 105.1524),
            'Dong Hoi': (17.4739, 106.5974),
            'Pleiku': (13.9833, 108.0000),
            'My Tho': (10.3601, 106.3560),
            'Tay Ninh': (11.3100, 106.0983),
            'Thai Binh': (20.4463, 106.3365),
            'Nam Dinh': (20.4339, 106.1683),
            'Vinh': (18.6767, 105.6919),
            'Quy Nhon': (13.7563, 109.2297),
            'Rach Gia': (10.0124, 105.0806),
            'Cam Ranh': (11.9214, 109.1592),
            'Ha Long': (20.9101, 107.1839),
            'Lang Son': (21.8563, 106.7610),
            'Lao Cai': (22.4856, 103.9707),
            'Cao Bang': (22.6663, 106.2581),
            'Dien Bien Phu': (21.3891, 103.0198),
            'Kon Tum': (14.3497, 107.9760),
            'Dong Ha': (16.8163, 107.1004),
            'Tam Ky': (15.5735, 108.4741),
            'Ha Tien': (10.3831, 104.4884),
            'Chau Doc': (10.7010, 105.1134),
            'Tra Vinh': (9.9477, 106.3420),
            'Soc Trang': (9.6003, 105.9800),
            'Bac Lieu': (9.2845, 105.7244),
            'Ben Tre': (10.2415, 106.3759),
            'Vinh Long': (10.2397, 105.9572),
            'Sa Dec': (10.2958, 105.7567)
        }
    
    def build_user_baseline(self, user_id: str, transactions_df: pd.DataFrame) -> Dict:
        """Build baseline behavior patterns for a user"""
        user_txns = transactions_df[transactions_df['user_id'] == user_id].copy()
        
        if len(user_txns) < self.config['min_transactions_for_baseline']:
            return None
        
        # Amount statistics
        amounts = user_txns['amount'].astype(float)
        amount_stats = {
            'mean': amounts.mean(),
            'median': amounts.median(),
            'std': amounts.std(),
            'q25': amounts.quantile(0.25),
            'q75': amounts.quantile(0.75),
            'iqr_lower': amounts.quantile(0.25) - 1.5 * (amounts.quantile(0.75) - amounts.quantile(0.25)),
            'iqr_upper': amounts.quantile(0.75) + 1.5 * (amounts.quantile(0.75) - amounts.quantile(0.25))
        }
        
        # Frequency patterns
        user_txns['date'] = pd.to_datetime(user_txns['transaction_date']).dt.date
        daily_counts = user_txns.groupby('date').size()
        
        frequency_stats = {
            'avg_daily_transactions': daily_counts.mean(),
            'max_daily_transactions': daily_counts.max(),
            'std_daily_transactions': daily_counts.std()
        }
        
        # Location patterns
        location_counts = user_txns['location'].value_counts()
        common_locations = set(location_counts.head(5).index)
        
        # Category patterns
        category_amounts = user_txns.groupby('category')['amount'].agg(['mean', 'std', 'count']).to_dict('index')
        
        # Time patterns
        user_txns['hour'] = pd.to_datetime(user_txns['transaction_date']).dt.hour
        user_txns['day_of_week'] = pd.to_datetime(user_txns['transaction_date']).dt.dayofweek
        
        hour_counts = user_txns['hour'].value_counts().to_dict()
        dow_counts = user_txns['day_of_week'].value_counts().to_dict()
        
        return {
            'user_id': user_id,
            'transaction_count': len(user_txns),
            'amount_stats': amount_stats,
            'frequency_stats': frequency_stats,
            'common_locations': common_locations,
            'category_patterns': category_amounts,
            'hour_patterns': hour_counts,
            'day_patterns': dow_counts,
            'created_at': datetime.now().isoformat()
        }
    
    def build_all_baselines(self, transactions_df: pd.DataFrame):
        """Build baselines for all users"""
        user_ids = transactions_df['user_id'].unique()
        
        print(f"🔍 Building baselines for {len(user_ids)} users...")
        
        for user_id in user_ids:
            baseline = self.build_user_baseline(user_id, transactions_df)
            if baseline:
                self.user_baselines[user_id] = baseline
        
        print(f"✅ Built baselines for {len(self.user_baselines)} users")
    
    def detect_amount_anomaly(self, user_id: str, amount: float) -> Dict:
        """Detect unusual transaction amounts"""
        if user_id not in self.user_baselines:
            return {'is_anomaly': False, 'reason': 'no_baseline', 'severity': 0.0}
        
        baseline = self.user_baselines[user_id]
        amount_stats = baseline['amount_stats']
        
        mean_amount = amount_stats['mean']
        std_amount = amount_stats['std']
        
        # Check against statistical thresholds
        if std_amount > 0:
            z_score = abs(amount - mean_amount) / std_amount
            is_statistical_anomaly = z_score > 2.5
        else:
            is_statistical_anomaly = False
            z_score = 0
        
        # Check against IQR thresholds
        is_iqr_anomaly = (amount < amount_stats['iqr_lower'] or 
                         amount > amount_stats['iqr_upper'])
        
        # Check against multiplier threshold
        is_multiplier_anomaly = amount > mean_amount * self.config['amount_threshold_multiplier']
        
        is_anomaly = is_statistical_anomaly or is_iqr_anomaly or is_multiplier_anomaly
        
        severity = 0.0
        if is_anomaly:
            # Calculate severity based on multiple factors
            multiplier_ratio = amount / mean_amount if mean_amount > 0 else 1
            severity_factors = []
            
            if is_multiplier_anomaly:
                severity_factors.append(min(multiplier_ratio / 10, 1.0))
            if is_statistical_anomaly:
                severity_factors.append(min(z_score / 5, 1.0))
            if is_iqr_anomaly:
                if amount > amount_stats['iqr_upper']:
                    iqr_ratio = (amount - amount_stats['iqr_upper']) / (amount_stats['iqr_upper'] - amount_stats['q75'] + 1)
                    severity_factors.append(min(iqr_ratio / 3, 1.0))
                else:
                    severity_factors.append(0.5)
            
            severity = max(severity_factors) if severity_factors else 0.0
        
        return {
            'is_anomaly': is_anomaly,
            'reason': 'high_amount' if is_anomaly else 'normal_amount',
            'severity': severity,
            'amount_ratio': amount / mean_amount if mean_amount > 0 else 1,
            'z_score': z_score,
            'details': {
                'amount': amount,
                'user_mean': mean_amount,
                'user_std': std_amount,
                'iqr_lower': amount_stats['iqr_lower'],
                'iqr_upper': amount_stats['iqr_upper']
            }
        }
    
    def detect_velocity_anomaly(self, user_id: str, current_time: datetime, 
                                recent_transactions: List[Dict]) -> Dict:
        """Detect high velocity transactions"""
        if user_id not in self.user_baselines:
            return {'is_anomaly': False, 'reason': 'no_baseline', 'severity': 0.0}
        
        baseline = self.user_baselines[user_id]
        freq_stats = baseline['frequency_stats']
        
        # Count transactions in the velocity window
        window_start = current_time - timedelta(hours=self.config['velocity_window_hours'])
        window_transactions = [
            txn for txn in recent_transactions 
            if pd.to_datetime(txn['transaction_date']) >= window_start
        ]
        
        window_count = len(window_transactions)
        expected_count = freq_stats['avg_daily_transactions'] * (self.config['velocity_window_hours'] / 24)
        
        # Anomaly if significantly more transactions than expected
        velocity_ratio = window_count / max(expected_count, 0.1)
        is_anomaly = velocity_ratio > 3  # 3x normal velocity
        
        severity = 0.0
        if is_anomaly:
            if velocity_ratio > 10:
                severity = 1.0
            elif velocity_ratio > 5:
                severity = 0.8
            else:
                severity = min(velocity_ratio / 5, 1.0)
        
        return {
            'is_anomaly': is_anomaly,
            'reason': 'high_velocity',
            'severity': severity,
            'velocity_ratio': velocity_ratio,
            'details': {
                'window_count': window_count,
                'expected_count': expected_count,
                'window_hours': self.config['velocity_window_hours']
            }
        }
    
    def detect_location_anomaly(self, user_id: str, location: str) -> Dict:
        """Detect unusual location"""
        if user_id not in self.user_baselines:
            return {'is_anomaly': False, 'reason': 'no_baseline', 'severity': 0.0}
        
        baseline = self.user_baselines[user_id]
        common_locations = baseline['common_locations']
        
        # Check if location is in common locations
        if location in common_locations:
            return {'is_anomaly': False, 'reason': 'common_location', 'severity': 0.0}
        
        # Check geographical distance from common locations
        if location not in self.city_locations:
            # Unknown location - treat as moderate anomaly
            return {
                'is_anomaly': True,
                'reason': 'unknown_location',
                'severity': 0.5,
                'details': {'location': location}
            }
        
        current_coords = self.city_locations[location]
        min_distance = float('inf')
        
        for common_loc in common_locations:
            if common_loc in self.city_locations:
                common_coords = self.city_locations[common_loc]
                distance = geodesic(current_coords, common_coords).kilometers
                min_distance = min(min_distance, distance)
        
        # Anomaly if too far from common locations
        is_anomaly = min_distance > self.config['geo_radius_km']
        
        severity = 0.0
        if is_anomaly:
            if min_distance > 1000:  # International
                severity = 1.0
            elif min_distance > 500:  # Long distance domestic
                severity = 0.8
            else:
                severity = min(min_distance / 500, 1.0)
        
        return {
            'is_anomaly': is_anomaly,
            'reason': 'unusual_location',
            'severity': severity,
            'min_distance_km': min_distance,
            'details': {
                'location': location,
                'distance_km': min_distance,
                'common_locations': list(common_locations)
            }
        }
    
    def detect_category_anomaly(self, user_id: str, category: str, amount: float) -> Dict:
        """Detect unusual category spending"""
        if user_id not in self.user_baselines:
            return {'is_anomaly': False, 'reason': 'no_baseline', 'severity': 0.0}
        
        baseline = self.user_baselines[user_id]
        category_patterns = baseline['category_patterns']
        
        if category not in category_patterns:
            # New category for user
            return {
                'is_anomaly': True,
                'reason': 'new_category',
                'severity': 0.3,
                'details': {'category': category, 'amount': amount}
            }
        
        cat_stats = category_patterns[category]
        mean_amount = cat_stats['mean']
        std_amount = cat_stats.get('std', 0)
        
        if std_amount > 0:
            z_score = abs(amount - mean_amount) / std_amount
            is_anomaly = z_score > 2.0  # Lower threshold for category
            severity = min(z_score / 4, 1.0) if is_anomaly else 0.0
        else:
            is_anomaly = abs(amount - mean_amount) > mean_amount * 0.5
            severity = 0.4 if is_anomaly else 0.0
        
        return {
            'is_anomaly': is_anomaly,
            'reason': 'unusual_category_amount',
            'severity': severity,
            'category_z_score': z_score if std_amount > 0 else 0,
            'details': {
                'category': category,
                'amount': amount,
                'category_mean': mean_amount,
                'category_std': std_amount
            }
        }
    
    def is_in_cooldown(self, user_id: str, alert_type: str) -> bool:
        """Check if alert type is in cooldown period"""
        if user_id not in self.alert_history:
            return False
        
        user_alerts = self.alert_history[user_id]
        if alert_type not in user_alerts:
            return False
        
        last_alert_time = pd.to_datetime(user_alerts[alert_type])
        cooldown_end = last_alert_time + timedelta(hours=self.config['cooldown_hours'])
        
        return datetime.now() < cooldown_end
    
    def record_alert(self, user_id: str, alert_type: str):
        """Record an alert for cooldown tracking"""
        if user_id not in self.alert_history:
            self.alert_history[user_id] = {}
        
        self.alert_history[user_id][alert_type] = datetime.now().isoformat()
    
    def detect_transaction_anomaly(self, transaction: Dict, 
                                   recent_transactions: List[Dict] = None) -> Dict:
        """Detect anomalies in a single transaction"""
        user_id = transaction['user_id']
        amount = float(transaction['amount'])
        location = transaction.get('location', 'Unknown')
        category = transaction.get('category', 'Others')
        transaction_time = pd.to_datetime(transaction['transaction_date'])
        
        anomalies = []
        max_severity = 0.0
        overall_anomaly = False
        
        # 1. Amount anomaly
        amount_result = self.detect_amount_anomaly(user_id, amount)
        if amount_result['is_anomaly']:
            anomalies.append(amount_result)
            max_severity = max(max_severity, amount_result['severity'])
            overall_anomaly = True
        
        # 2. Velocity anomaly
        if recent_transactions:
            velocity_result = self.detect_velocity_anomaly(user_id, transaction_time, recent_transactions)
            if velocity_result['is_anomaly']:
                anomalies.append(velocity_result)
                max_severity = max(max_severity, velocity_result['severity'])
                overall_anomaly = True
        
        # 3. Location anomaly
        location_result = self.detect_location_anomaly(user_id, location)
        if location_result['is_anomaly']:
            anomalies.append(location_result)
            max_severity = max(max_severity, location_result['severity'])
            overall_anomaly = True
        
        # 4. Category anomaly
        category_result = self.detect_category_anomaly(user_id, category, amount)
        if category_result['is_anomaly']:
            anomalies.append(category_result)
            max_severity = max(max_severity, category_result['severity'])
            overall_anomaly = True
        
        # Determine alert level
        alert_level = 'none'
        if max_severity >= 0.8:
            alert_level = 'critical'
        elif max_severity >= 0.6:
            alert_level = 'high'
        elif max_severity >= 0.4:
            alert_level = 'medium'
        elif max_severity > 0:
            alert_level = 'low'
        
        # Check if should alert (above threshold and not in cooldown)
        should_alert = (max_severity >= self.config['alert_threshold'] and 
                       not self.is_in_cooldown(user_id, 'anomaly'))
        
        if should_alert:
            self.record_alert(user_id, 'anomaly')
        
        # Generate alert message
        alert_message = self._generate_alert_message(transaction, anomalies, max_severity)
        
        return {
            'transaction_id': transaction.get('transaction_id', 'unknown'),
            'user_id': user_id,
            'is_anomaly': overall_anomaly,
            'severity': max_severity,
            'alert_level': alert_level,
            'should_alert': should_alert,
            'anomalies': anomalies,
            'alert_message': alert_message,
            'detected_at': datetime.now().isoformat()
        }
    
    def _generate_alert_message(self, transaction: Dict, anomalies: List[Dict], severity: float) -> str:
        """Generate human-readable alert message"""
        if not anomalies:
            return ""
        
        amount = transaction['amount']
        location = transaction.get('location', 'Unknown')
        
        messages = []
        
        for anomaly in anomalies:
            reason = anomaly['reason']
            
            if reason == 'high_amount':
                ratio = anomaly.get('amount_ratio', 1)
                messages.append(f"Giao dịch {amount:,.0f} VNĐ cao gấp {ratio:.1f} lần bình thường")
            elif reason == 'unusual_location':
                distance = anomaly.get('min_distance_km', 0)
                messages.append(f"Giao dịch tại {location} (cách {distance:.0f}km từ vị trí thường xuyên)")
            elif reason == 'high_velocity':
                ratio = anomaly.get('velocity_ratio', 1)
                messages.append(f"Tần suất giao dịch cao {ratio:.1f}x bình thường")
            elif reason == 'new_category':
                category = anomaly['details']['category']
                messages.append(f"Danh mục mới: {category}")
            elif reason == 'unusual_category_amount':
                category = anomaly['details']['category']
                messages.append(f"Số tiền bất thường cho danh mục {category}")
        
        if severity >= 0.8:
            prefix = "🚨 CẢNH BÁO NGHIÊM TRỌNG: "
        elif severity >= 0.6:
            prefix = "⚠️ CẢNH BÁO CAO: "
        elif severity >= 0.4:
            prefix = "⚡ Phát hiện bất thường: "
        else:
            prefix = "ℹ️ Thông báo: "
        
        return prefix + "; ".join(messages)
    
    def save_model(self, model_path: Path):
        """Save the detector state"""
        detector_data = {
            'config': self.config,
            'user_baselines': self.user_baselines,
            'alert_history': self.alert_history,
            'city_locations': self.city_locations
        }
        
        joblib.dump(detector_data, model_path)
        print(f"✅ Anomaly detector saved to {model_path}")
    
    def load_model(self, model_path: Path):
        """Load detector state"""
        detector_data = joblib.load(model_path)
        
        self.config = detector_data['config']
        self.user_baselines = detector_data['user_baselines']
        self.alert_history = detector_data.get('alert_history', {})
        self.city_locations = detector_data.get('city_locations', self.city_locations)
        
        print(f"✅ Anomaly detector loaded from {model_path}")


def train_anomaly_detector():
    """Train and save the anomaly detector"""
    import sys
    sys.path.append(str(Path(__file__).parent.parent))
    from config import SEED_DATA_PATH, MODELS_ROOT
    
    # Create models directory
    MODELS_ROOT.mkdir(parents=True, exist_ok=True)
    
    # Load data
    transactions_df = pd.read_csv(SEED_DATA_PATH / "transactions.csv")
    test_cases_df = pd.read_csv(SEED_DATA_PATH / "anomaly_test_cases.csv")
    
    print(f"📊 Loaded {len(transactions_df)} transactions and {len(test_cases_df)} test cases")
    
    # Initialize detector
    detector = AnomalyDetector()
    
    # Build baselines from historical data
    detector.build_all_baselines(transactions_df)
    
    # Test on anomaly test cases
    print("\n🧪 Testing anomaly detection:")
    correct_detections = 0
    total_tests = 0
    
    for _, test_case in test_cases_df.iterrows():
        # Create test transaction
        test_transaction = {
            'transaction_id': f"TEST_{total_tests}",
            'user_id': test_case['user_id'],
            'amount': test_case['amount'],
            'location': test_case['location'],
            'category': test_case.get('category', 'Shopping'),
            'transaction_date': datetime.now().isoformat()
        }
        
        # Get recent transactions for velocity check
        recent_txns = transactions_df[
            transactions_df['user_id'] == test_case['user_id']
        ].tail(10).to_dict('records')
        
        # Detect anomaly
        result = detector.detect_transaction_anomaly(test_transaction, recent_txns)
        
        # Check if detection matches expectation
        expected_anomaly = test_case['expected_anomaly']
        detected_anomaly = result['is_anomaly']
        
        is_correct = (expected_anomaly == detected_anomaly)
        if is_correct:
            correct_detections += 1
        
        total_tests += 1
        
        print(f"  Test {total_tests}: {test_case['description']}")
        print(f"    Expected: {expected_anomaly}, Detected: {detected_anomaly} ({'✅' if is_correct else '❌'})")
        print(f"    Severity: {result['severity']:.2f}, Level: {result['alert_level']}")
        if result['alert_message']:
            print(f"    Message: {result['alert_message']}")
        print()
    
    accuracy = correct_detections / total_tests if total_tests > 0 else 0
    print(f"🎯 Detection Accuracy: {correct_detections}/{total_tests} ({accuracy:.1%})")
    
    # Save detector
    model_path = MODELS_ROOT / "anomaly_detector.joblib"
    detector.save_model(model_path)
    
    # Save evaluation metrics
    metrics = {
        'accuracy': accuracy,
        'correct_detections': correct_detections,
        'total_tests': total_tests,
        'config': detector.config,
        'baseline_users': len(detector.user_baselines)
    }
    
    metrics_path = MODELS_ROOT / "anomaly_detector_metrics.json"
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print(f"✅ Metrics saved to {metrics_path}")
    
    return detector, metrics


if __name__ == "__main__":
    # Install geopy if not available
    try:
        from geopy.distance import geodesic
    except ImportError:
        import subprocess
        subprocess.check_call(["pip", "install", "geopy"])
        from geopy.distance import geodesic
    
    train_anomaly_detector()
