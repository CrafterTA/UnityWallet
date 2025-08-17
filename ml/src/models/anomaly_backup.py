"""
Anomaly Detection Model
Rule-based anomaly detection with severity scoring and cooldown mechanisms
"""
import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from pathlib import Path
import joblib
from geopy.distance import geodesic

class AnomalyDetector:
    """
    Rule-based anomaly detection system
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {
            'z_score_threshold': 2.5,
            'iqr_multiplier': 1.5,
            'velocity_window_hours': 24,
            'geo_radius_km': 50,
            'cooldown_hours': 6,
            'alert_threshold': 0.7
        }
        
        # User baselines (to be computed from historical data)
        self.user_baselines = {}
        
        # Alert history for cooldown
        self.alert_history = {}
        
        # Location mapping for major cities
        self.city_locations = {
            'Ho Chi Minh City': (10.8231, 106.6297),
            'Hanoi': (21.0285, 105.8542),
            'Da Nang': (16.0471, 108.2068),
            'Can Tho': (10.0452, 105.7469),
            'Hai Phong': (20.8449, 106.6881),
            'Nha Trang': (12.2388, 109.1967),
            'Hue': (16.4637, 107.5909),
            'Da Lat': (11.9404, 108.4583),
            'Vung Tau': (10.4113, 107.1365),
            'Bien Hoa': (10.9471, 106.8217),
            # International
            'Bangkok': (13.7563, 100.5018),
            'Singapore': (1.3521, 103.8198),
            'Kuala Lumpur': (3.1390, 101.6869),
            'Seoul': (37.5665, 126.9780),
            'Tokyo': (35.6762, 139.6503),
            'Paris': (48.8566, 2.3522),
            'London': (51.5074, -0.1278),
            'New York': (40.7128, -74.0060)
        }
    
    def build_user_baseline(self, transactions_df: pd.DataFrame, user_id: str) -> Dict:
        """Build baseline patterns for a user"""
        user_txns = transactions_df[transactions_df['user_id'] == user_id].copy()
        
        if len(user_txns) == 0:
            return {}
        
        # Convert types
        user_txns['amount'] = pd.to_numeric(user_txns['amount'])
        user_txns['transaction_date'] = pd.to_datetime(user_txns['transaction_date'])
        
        # Amount statistics
        amount_stats = {
            'mean': float(user_txns['amount'].mean()),
            'std': float(user_txns['amount'].std() or 0),
            'median': float(user_txns['amount'].median()),
            'q25': float(user_txns['amount'].quantile(0.25)),
            'q75': float(user_txns['amount'].quantile(0.75)),
            'max': float(user_txns['amount'].max()),
            'min': float(user_txns['amount'].min())
        }
        
        # Calculate IQR thresholds
        iqr = amount_stats['q75'] - amount_stats['q25']
        amount_stats['iqr_lower'] = amount_stats['q25'] - self.config['iqr_multiplier'] * iqr
        amount_stats['iqr_upper'] = amount_stats['q75'] + self.config['iqr_multiplier'] * iqr
        
        # Transaction frequency (transactions per day)
        date_range = (user_txns['transaction_date'].max() - user_txns['transaction_date'].min()).days + 1
        freq_stats = {
            'avg_daily_transactions': len(user_txns) / max(date_range, 1),
            'max_daily_transactions': user_txns.groupby(user_txns['transaction_date'].dt.date).size().max()
        }
        
        # Category patterns
        category_patterns = user_txns.groupby('category')['amount'].agg(['mean', 'std', 'count']).to_dict('index')
        
        # Location patterns
        location_patterns = user_txns['location'].value_counts().to_dict()
        common_locations = set(location_patterns.keys())
        
        # Time patterns
        user_txns['hour'] = user_txns['transaction_date'].dt.hour
        user_txns['day_of_week'] = user_txns['transaction_date'].dt.dayofweek
        
        time_patterns = {
            'common_hours': user_txns['hour'].value_counts().index[:6].tolist(),  # Top 6 hours
            'common_days': user_txns['day_of_week'].value_counts().index[:5].tolist(),  # Top 5 days
            'weekend_ratio': float(user_txns[user_txns['day_of_week'] >= 5].shape[0] / len(user_txns))
        }
        
        baseline = {
            'user_id': user_id,
            'amount_stats': amount_stats,
            'frequency_stats': freq_stats,
            'category_patterns': category_patterns,
            'location_patterns': location_patterns,
            'common_locations': common_locations,
            'time_patterns': time_patterns,
            'total_transactions': len(user_txns),
            'baseline_created': datetime.now().isoformat()
        }
        
        return baseline
    
    def build_all_baselines(self, transactions_df: pd.DataFrame):
        """Build baselines for all users"""
        users = transactions_df['user_id'].unique()
        
        for user_id in users:
            baseline = self.build_user_baseline(transactions_df, user_id)
            if baseline:
                self.user_baselines[user_id] = baseline
        
        print(f"✅ Built baselines for {len(self.user_baselines)} users")
    
    def detect_amount_anomaly(self, user_id: str, amount: float) -> Dict:
        """Detect if transaction amount is anomalous"""
        if user_id not in self.user_baselines:
            return {'is_anomaly': False, 'reason': 'no_baseline', 'severity': 0.0}
        
        baseline = self.user_baselines[user_id]
        amount_stats = baseline['amount_stats']
        
        # Z-score method
        if amount_stats['std'] > 0:
            z_score = abs(amount - amount_stats['mean']) / amount_stats['std']
            z_anomaly = z_score > self.config['z_score_threshold']
        else:
            z_score = 0
            z_anomaly = False
        
        # IQR method
        iqr_anomaly = (amount < amount_stats['iqr_lower']) or (amount > amount_stats['iqr_upper'])
        
        # Combined decision
        is_anomaly = z_anomaly or iqr_anomaly
        
        # Severity score (0-1)
        severity = 0.0
        if is_anomaly:
            # Higher severity for larger deviations
            amount_ratio = amount / max(amount_stats['mean'], 1)
            if amount_ratio > 5:  # 5x normal amount
                severity = 1.0
            elif amount_ratio > 3:  # 3x normal amount
                severity = 0.8
            elif amount_ratio > 2:  # 2x normal amount
                severity = 0.6
            else:
                severity = min(z_score / 5, 1.0)  # Scale z-score to 0-1
        
        return {
            'is_anomaly': is_anomaly,
            'reason': 'high_amount' if iqr_anomaly and amount > amount_stats['iqr_upper'] else 'unusual_amount',
            'severity': severity,
            'z_score': z_score,
            'amount_ratio': amount / max(amount_stats['mean'], 1),
            'details': {
                'amount': amount,
                'baseline_mean': amount_stats['mean'],
                'baseline_std': amount_stats['std'],
                'iqr_upper': amount_stats['iqr_upper']
            }
        }
    
    def detect_velocity_anomaly(self, user_id: str, current_time: datetime, 
                                recent_transactions: List[Dict]) -> Dict:
        """Detect high velocity transactions"""
        if user_id not in self.user_baselines:
            return {'is_anomaly': False, 'reason': 'no_baseline', 'severity': 0.0}
        
        baseline = self.user_baselines[user_id]
        freq_stats = baseline['frequency_stats']\n        \n        # Count transactions in the velocity window\n        window_start = current_time - timedelta(hours=self.config['velocity_window_hours'])\n        window_transactions = [\n            txn for txn in recent_transactions \n            if pd.to_datetime(txn['transaction_date']) >= window_start\n        ]\n        \n        window_count = len(window_transactions)\n        expected_count = freq_stats['avg_daily_transactions'] * (self.config['velocity_window_hours'] / 24)\n        \n        # Anomaly if significantly more transactions than expected\n        velocity_ratio = window_count / max(expected_count, 0.1)\n        is_anomaly = velocity_ratio > 3  # 3x normal velocity\n        \n        severity = 0.0\n        if is_anomaly:\n            if velocity_ratio > 10:\n                severity = 1.0\n            elif velocity_ratio > 5:\n                severity = 0.8\n            else:\n                severity = min(velocity_ratio / 5, 1.0)\n        \n        return {\n            'is_anomaly': is_anomaly,\n            'reason': 'high_velocity',\n            'severity': severity,\n            'velocity_ratio': velocity_ratio,\n            'details': {\n                'window_count': window_count,\n                'expected_count': expected_count,\n                'window_hours': self.config['velocity_window_hours']\n            }\n        }\n    \n    def detect_location_anomaly(self, user_id: str, location: str) -> Dict:\n        \"\"\"Detect unusual location\"\"\"\n        if user_id not in self.user_baselines:\n            return {'is_anomaly': False, 'reason': 'no_baseline', 'severity': 0.0}\n        \n        baseline = self.user_baselines[user_id]\n        common_locations = baseline['common_locations']\n        \n        # Check if location is in common locations\n        if location in common_locations:\n            return {'is_anomaly': False, 'reason': 'common_location', 'severity': 0.0}\n        \n        # Check geographical distance from common locations\n        if location not in self.city_locations:\n            # Unknown location - treat as moderate anomaly\n            return {\n                'is_anomaly': True,\n                'reason': 'unknown_location',\n                'severity': 0.5,\n                'details': {'location': location}\n            }\n        \n        current_coords = self.city_locations[location]\n        min_distance = float('inf')\n        \n        for common_loc in common_locations:\n            if common_loc in self.city_locations:\n                common_coords = self.city_locations[common_loc]\n                distance = geodesic(current_coords, common_coords).kilometers\n                min_distance = min(min_distance, distance)\n        \n        # Anomaly if too far from common locations\n        is_anomaly = min_distance > self.config['geo_radius_km']\n        \n        severity = 0.0\n        if is_anomaly:\n            if min_distance > 1000:  # International\n                severity = 1.0\n            elif min_distance > 500:  # Long distance domestic\n                severity = 0.8\n            else:\n                severity = min(min_distance / 500, 1.0)\n        \n        return {\n            'is_anomaly': is_anomaly,\n            'reason': 'unusual_location',\n            'severity': severity,\n            'min_distance_km': min_distance,\n            'details': {\n                'location': location,\n                'distance_km': min_distance,\n                'common_locations': list(common_locations)\n            }\n        }\n    \n    def detect_category_anomaly(self, user_id: str, category: str, amount: float) -> Dict:\n        \"\"\"Detect unusual category spending\"\"\"\n        if user_id not in self.user_baselines:\n            return {'is_anomaly': False, 'reason': 'no_baseline', 'severity': 0.0}\n        \n        baseline = self.user_baselines[user_id]\n        category_patterns = baseline['category_patterns']\n        \n        if category not in category_patterns:\n            # New category for user\n            return {\n                'is_anomaly': True,\n                'reason': 'new_category',\n                'severity': 0.3,\n                'details': {'category': category, 'amount': amount}\n            }\n        \n        cat_stats = category_patterns[category]\n        mean_amount = cat_stats['mean']\n        std_amount = cat_stats.get('std', 0)\n        \n        if std_amount > 0:\n            z_score = abs(amount - mean_amount) / std_amount\n            is_anomaly = z_score > 2.0  # Lower threshold for category\n            severity = min(z_score / 4, 1.0) if is_anomaly else 0.0\n        else:\n            is_anomaly = abs(amount - mean_amount) > mean_amount * 0.5\n            severity = 0.4 if is_anomaly else 0.0\n        \n        return {\n            'is_anomaly': is_anomaly,\n            'reason': 'unusual_category_amount',\n            'severity': severity,\n            'category_z_score': z_score if std_amount > 0 else 0,\n            'details': {\n                'category': category,\n                'amount': amount,\n                'category_mean': mean_amount,\n                'category_std': std_amount\n            }\n        }\n    \n    def is_in_cooldown(self, user_id: str, alert_type: str) -> bool:\n        \"\"\"Check if alert type is in cooldown period\"\"\"\n        if user_id not in self.alert_history:\n            return False\n        \n        user_alerts = self.alert_history[user_id]\n        if alert_type not in user_alerts:\n            return False\n        \n        last_alert_time = pd.to_datetime(user_alerts[alert_type])\n        cooldown_end = last_alert_time + timedelta(hours=self.config['cooldown_hours'])\n        \n        return datetime.now() < cooldown_end\n    \n    def record_alert(self, user_id: str, alert_type: str):\n        \"\"\"Record an alert for cooldown tracking\"\"\"\n        if user_id not in self.alert_history:\n            self.alert_history[user_id] = {}\n        \n        self.alert_history[user_id][alert_type] = datetime.now().isoformat()\n    \n    def detect_transaction_anomaly(self, transaction: Dict, \n                                   recent_transactions: List[Dict] = None) -> Dict:\n        \"\"\"Detect anomalies in a single transaction\"\"\"\n        user_id = transaction['user_id']\n        amount = float(transaction['amount'])\n        location = transaction.get('location', 'Unknown')\n        category = transaction.get('category', 'Others')\n        transaction_time = pd.to_datetime(transaction['transaction_date'])\n        \n        anomalies = []\n        max_severity = 0.0\n        overall_anomaly = False\n        \n        # 1. Amount anomaly\n        amount_result = self.detect_amount_anomaly(user_id, amount)\n        if amount_result['is_anomaly']:\n            anomalies.append(amount_result)\n            max_severity = max(max_severity, amount_result['severity'])\n            overall_anomaly = True\n        \n        # 2. Velocity anomaly\n        if recent_transactions:\n            velocity_result = self.detect_velocity_anomaly(user_id, transaction_time, recent_transactions)\n            if velocity_result['is_anomaly']:\n                anomalies.append(velocity_result)\n                max_severity = max(max_severity, velocity_result['severity'])\n                overall_anomaly = True\n        \n        # 3. Location anomaly\n        location_result = self.detect_location_anomaly(user_id, location)\n        if location_result['is_anomaly']:\n            anomalies.append(location_result)\n            max_severity = max(max_severity, location_result['severity'])\n            overall_anomaly = True\n        \n        # 4. Category anomaly\n        category_result = self.detect_category_anomaly(user_id, category, amount)\n        if category_result['is_anomaly']:\n            anomalies.append(category_result)\n            max_severity = max(max_severity, category_result['severity'])\n            overall_anomaly = True\n        \n        # Determine alert level\n        alert_level = 'none'\n        if max_severity >= 0.8:\n            alert_level = 'critical'\n        elif max_severity >= 0.6:\n            alert_level = 'high'\n        elif max_severity >= 0.4:\n            alert_level = 'medium'\n        elif max_severity > 0:\n            alert_level = 'low'\n        \n        # Check if should alert (above threshold and not in cooldown)\n        should_alert = (max_severity >= self.config['alert_threshold'] and \n                       not self.is_in_cooldown(user_id, 'anomaly'))\n        \n        if should_alert:\n            self.record_alert(user_id, 'anomaly')\n        \n        # Generate alert message\n        alert_message = self._generate_alert_message(transaction, anomalies, max_severity)\n        \n        return {\n            'transaction_id': transaction.get('transaction_id', 'unknown'),\n            'user_id': user_id,\n            'is_anomaly': overall_anomaly,\n            'severity': max_severity,\n            'alert_level': alert_level,\n            'should_alert': should_alert,\n            'anomalies': anomalies,\n            'alert_message': alert_message,\n            'detected_at': datetime.now().isoformat()\n        }\n    \n    def _generate_alert_message(self, transaction: Dict, anomalies: List[Dict], severity: float) -> str:\n        \"\"\"Generate human-readable alert message\"\"\"\n        if not anomalies:\n            return \"\"\n        \n        amount = transaction['amount']\n        location = transaction.get('location', 'Unknown')\n        \n        messages = []\n        \n        for anomaly in anomalies:\n            reason = anomaly['reason']\n            \n            if reason == 'high_amount':\n                ratio = anomaly.get('amount_ratio', 1)\n                messages.append(f\"Giao dịch {amount:,.0f} VNĐ cao gấp {ratio:.1f} lần bình thường\")\n            elif reason == 'unusual_location':\n                distance = anomaly.get('min_distance_km', 0)\n                messages.append(f\"Giao dịch tại {location} (cách {distance:.0f}km từ vị trí thường xuyên)\")\n            elif reason == 'high_velocity':\n                ratio = anomaly.get('velocity_ratio', 1)\n                messages.append(f\"Tần suất giao dịch cao {ratio:.1f}x bình thường\")\n            elif reason == 'new_category':\n                category = anomaly['details']['category']\n                messages.append(f\"Danh mục mới: {category}\")\n            elif reason == 'unusual_category_amount':\n                category = anomaly['details']['category']\n                messages.append(f\"Số tiền bất thường cho danh mục {category}\")\n        \n        if severity >= 0.8:\n            prefix = \"🚨 CẢNH BÁO NGHIÊM TRỌNG: \"\n        elif severity >= 0.6:\n            prefix = \"⚠️ CẢNH BÁO CAO: \"\n        elif severity >= 0.4:\n            prefix = \"⚡ Phát hiện bất thường: \"\n        else:\n            prefix = \"ℹ️ Thông báo: \"\n        \n        return prefix + \"; \".join(messages)\n    \n    def save_model(self, model_path: Path):\n        \"\"\"Save the detector state\"\"\"\n        detector_data = {\n            'config': self.config,\n            'user_baselines': self.user_baselines,\n            'alert_history': self.alert_history,\n            'city_locations': self.city_locations\n        }\n        \n        joblib.dump(detector_data, model_path)\n        print(f\"✅ Anomaly detector saved to {model_path}\")\n    \n    def load_model(self, model_path: Path):\n        \"\"\"Load detector state\"\"\"\n        detector_data = joblib.load(model_path)\n        \n        self.config = detector_data['config']\n        self.user_baselines = detector_data['user_baselines']\n        self.alert_history = detector_data.get('alert_history', {})\n        self.city_locations = detector_data.get('city_locations', self.city_locations)\n        \n        print(f\"✅ Anomaly detector loaded from {model_path}\")\n\ndef train_anomaly_detector():\n    \"\"\"Train and save the anomaly detector\"\"\"\n    import sys\n    sys.path.append(str(Path(__file__).parent.parent))\n    from config import SEED_DATA_PATH, MODELS_ROOT\n    \n    # Create models directory\n    MODELS_ROOT.mkdir(parents=True, exist_ok=True)\n    \n    # Load data\n    transactions_df = pd.read_csv(SEED_DATA_PATH / \"transactions.csv\")\n    test_cases_df = pd.read_csv(SEED_DATA_PATH / \"anomaly_test_cases.csv\")\n    \n    print(f\"📊 Loaded {len(transactions_df)} transactions and {len(test_cases_df)} test cases\")\n    \n    # Initialize detector\n    detector = AnomalyDetector()\n    \n    # Build baselines from historical data\n    detector.build_all_baselines(transactions_df)\n    \n    # Test on anomaly test cases\n    print(\"\\n🧪 Testing anomaly detection:\")\n    correct_detections = 0\n    total_tests = 0\n    \n    for _, test_case in test_cases_df.iterrows():\n        # Create test transaction\n        test_transaction = {\n            'transaction_id': f\"TEST_{total_tests}\",\n            'user_id': test_case['user_id'],\n            'amount': test_case['amount'],\n            'location': test_case['location'],\n            'category': test_case.get('category', 'Shopping'),\n            'transaction_date': datetime.now().isoformat()\n        }\n        \n        # Get recent transactions for velocity check\n        recent_txns = transactions_df[\n            transactions_df['user_id'] == test_case['user_id']\n        ].tail(10).to_dict('records')\n        \n        # Detect anomaly\n        result = detector.detect_transaction_anomaly(test_transaction, recent_txns)\n        \n        # Check if detection matches expectation\n        expected_anomaly = test_case['expected_anomaly']\n        detected_anomaly = result['is_anomaly']\n        \n        is_correct = (expected_anomaly == detected_anomaly)\n        if is_correct:\n            correct_detections += 1\n        \n        total_tests += 1\n        \n        print(f\"  Test {total_tests}: {test_case['description']}\")\n        print(f\"    Expected: {expected_anomaly}, Detected: {detected_anomaly} ({'✅' if is_correct else '❌'})\")\n        print(f\"    Severity: {result['severity']:.2f}, Level: {result['alert_level']}\")\n        if result['alert_message']:\n            print(f\"    Message: {result['alert_message']}\")\n        print()\n    \n    accuracy = correct_detections / total_tests if total_tests > 0 else 0\n    print(f\"🎯 Detection Accuracy: {correct_detections}/{total_tests} ({accuracy:.1%})\")\n    \n    # Save detector\n    model_path = MODELS_ROOT / \"anomaly_detector.joblib\"\n    detector.save_model(model_path)\n    \n    # Save evaluation metrics\n    metrics = {\n        'accuracy': accuracy,\n        'correct_detections': correct_detections,\n        'total_tests': total_tests,\n        'config': detector.config,\n        'baseline_users': len(detector.user_baselines)\n    }\n    \n    metrics_path = MODELS_ROOT / \"anomaly_detector_metrics.json\"\n    with open(metrics_path, 'w') as f:\n        json.dump(metrics, f, indent=2)\n    \n    print(f\"✅ Metrics saved to {metrics_path}\")\n    \n    return detector, metrics\n\nif __name__ == \"__main__\":\n    # Install geopy if not available\n    try:\n        from geopy.distance import geodesic\n    except ImportError:\n        import subprocess\n        subprocess.check_call([\"pip\", \"install\", \"geopy\"])\n        from geopy.distance import geodesic\n    \n    train_anomaly_detector()"
