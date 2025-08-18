#!/usr/bin/env python3
"""
Advanced ML Pipeline Testing
Kiểm thử các scenarios phức tạp và edge cases
"""

import requests
import time
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

class AdvancedMLTests:
    def __init__(self):
        self.results = {'passed': 0, 'failed': 0, 'errors': []}
    
    def test_multi_category_insights(self):
        """Test insights với portfolio đa dạng"""
        print("🎯 Test 1: Multi-Category Portfolio Insights")
        
        test_data = {
            "user_id": "user_diversified",
            "transactions": [
                # Travel 35%
                {"user_id": "user_diversified", "amount": 3500000, "category": "travel", "description": "vé máy bay", "transaction_date": "2025-08-15"},
                {"user_id": "user_diversified", "amount": 1000000, "category": "travel", "description": "khách sạn", "transaction_date": "2025-08-16"},
                
                # F&B 30%  
                {"user_id": "user_diversified", "amount": 1500000, "category": "food", "description": "nhà hàng", "transaction_date": "2025-08-15"},
                {"user_id": "user_diversified", "amount": 1500000, "category": "food", "description": "buffet", "transaction_date": "2025-08-16"},
                
                # Others 35%
                {"user_id": "user_diversified", "amount": 2000000, "category": "shopping", "description": "quần áo", "transaction_date": "2025-08-17"},
                {"user_id": "user_diversified", "amount": 1500000, "category": "entertainment", "description": "spa", "transaction_date": "2025-08-17"},
            ]
        }
        
        try:
            response = requests.post(f"{BASE_URL}/analytics/insights", json=test_data)
            if response.status_code == 200:
                result = response.json()
                insights = result.get('data', {}).get('insights', [])
                
                # Check for travel spending insight (≥30%)
                travel_insight_found = any("travel" in str(insight).lower() for insight in insights)
                bundle_insight_found = any("combo" in str(insight).lower() or "gói" in str(insight).lower() for insight in insights)
                
                if travel_insight_found and len(insights) > 0:
                    print(f"✅ Multi-category insights generated: {len(insights)} insights")
                    for insight in insights[:2]:
                        print(f"   💡 {insight.get('message', 'No message')}")
                    self.results['passed'] += 1
                else:
                    print(f"❌ Expected travel insights for 35% spending, got {len(insights)} insights")
                    self.results['failed'] += 1
            else:
                print(f"❌ Multi-category test failed: {response.status_code}")
                self.results['failed'] += 1
        except Exception as e:
            print(f"❌ Multi-category test error: {e}")
            self.results['failed'] += 1
            self.results['errors'].append(f"Multi-category: {e}")
    
    def test_velocity_anomaly_detection(self):
        """Test velocity anomaly với 5 giao dịch/10 phút"""
        print("\n🚨 Test 2: Velocity Anomaly Detection")
        
        # Simulate rapid transactions
        base_time = datetime.now()
        rapid_transactions = []
        
        for i in range(5):
            txn_time = base_time + timedelta(minutes=i*2)  # Every 2 minutes = 5 txns in 8 minutes
            rapid_transactions.append({
                "transaction_id": f"velocity_txn_{i+1:03d}",
                "user_id": "user_velocity",
                "amount": 200000,
                "merchant_name": "Circle K",
                "location": "Ho Chi Minh City", 
                "description": f"mua nước lần {i+1}",
                "transaction_date": txn_time.isoformat()
            })
        
        velocity_detected = 0
        
        for i, txn in enumerate(rapid_transactions):
            test_data = {
                "transaction": txn,
                "recent_transactions": rapid_transactions[:i]  # Previous transactions as context
            }
            
            try:
                response = requests.post(f"{BASE_URL}/analytics/alerts", json=test_data)
                if response.status_code == 200:
                    result = response.json()
                    data = result.get('data', {})
                    is_anomaly = data.get('is_anomaly', False)
                    severity = data.get('severity', 0)
                    
                    if is_anomaly or severity > 0:
                        velocity_detected += 1
                        print(f"   🚨 Velocity detected on transaction {i+1}: severity {severity}")
                else:
                    print(f"   ❌ Transaction {i+1} failed: {response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ Transaction {i+1} error: {e}")
        
        if velocity_detected > 0:
            print(f"✅ Velocity detection working: {velocity_detected}/5 transactions flagged")
            self.results['passed'] += 1
        else:
            print(f"❌ No velocity detection in rapid sequence")
            self.results['failed'] += 1
    
    def test_credit_score_profiles(self):
        """Test credit profiles với expected score ranges"""
        print("\n💳 Test 3-4: Credit Score Profiles")
        
        profiles = [
            {
                "name": "High Income + Low Risk",
                "data": {
                    "user_id": "user_premium",
                    "user_features": {
                        "monthly_income": 50000000,  # 50M VND
                        "existing_debt": 1000000,    # Low debt
                        "age": 40,
                        "employment_years": 10,
                        "savings_balance": 500000000,  # 500M savings
                        "credit_utilization": 0.1,     # 10% utilization
                        "loan_history": 0              # No defaults
                    }
                },
                "expected_min_score": 700
            },
            {
                "name": "Low Income + High Risk", 
                "data": {
                    "user_id": "user_highrisk",
                    "user_features": {
                        "monthly_income": 5000000,   # 5M VND  
                        "existing_debt": 15000000,  # High debt
                        "age": 25,
                        "employment_years": 1,
                        "savings_balance": 500000,   # Low savings
                        "credit_utilization": 0.9,   # 90% utilization
                        "loan_history": 2            # Some defaults
                    }
                },
                "expected_max_score": 600
            }
        ]
        
        for i, profile in enumerate(profiles, 3):
            try:
                response = requests.post(f"{BASE_URL}/analytics/credit", json=profile["data"])
                if response.status_code == 200:
                    result = response.json()
                    data = result.get('data', {})
                    score = data.get('credit_score', 0)
                    grade = data.get('score_grade', 'Unknown')
                    
                    if "High Income" in profile["name"]:
                        if score >= profile["expected_min_score"]:
                            print(f"✅ Test {i} ({profile['name']}): Score {score} ≥ {profile['expected_min_score']} ✅")
                            self.results['passed'] += 1
                        else:
                            print(f"❌ Test {i} ({profile['name']}): Score {score} < {profile['expected_min_score']}")
                            self.results['failed'] += 1
                    else:
                        if score <= profile["expected_max_score"]:
                            print(f"✅ Test {i} ({profile['name']}): Score {score} ≤ {profile['expected_max_score']} ✅")
                            self.results['passed'] += 1
                        else:
                            print(f"❌ Test {i} ({profile['name']}): Score {score} > {profile['expected_max_score']}")
                            self.results['failed'] += 1
                else:
                    print(f"❌ Test {i} failed: {response.status_code}")
                    self.results['failed'] += 1
            except Exception as e:
                print(f"❌ Test {i} error: {e}")
                self.results['failed'] += 1
                self.results['errors'].append(f"Credit Profile {i}: {e}")
    
    def test_merchant_nlp_variants(self):
        """Test NLP processing với merchant name variants"""
        print("\n🛒 Test 5-7: Merchant NLP Variants")
        
        merchant_variants = [
            {
                "variants": ["CGV Cinema", "CGV Vincom", "Galaxy Cinema", "BHD Cinema"],
                "expected_category": "Entertainment",
                "description": "Cinema chains"
            },
            {
                "variants": ["Vietjet Air", "Vietnam Airlines", "VNA", "Bamboo Airways"],
                "expected_category": "Travel",  # Fixed: Airlines return "Travel" not "Transportation"
                "description": "Airlines"
            },
            {
                "variants": ["Phở Hồng", "Phở 24", "Phở Gia Truyền", "Bún Bò Huế"],
                "expected_category": "F&B",
                "description": "Vietnamese food"
            }
        ]
        
        test_counter = 5
        for variant_group in merchant_variants:
            for merchant in variant_group["variants"][:2]:  # Test 2 variants per group
                test_data = {
                    "transaction_id": f"nlp_test_{test_counter}",
                    "user_id": "user_nlp",
                    "amount": 150000,
                    "merchant_name": merchant,
                    "location": "Ho Chi Minh City",
                    "description": f"test {merchant}"
                }
                
                try:
                    response = requests.post(f"{BASE_URL}/analytics/spend", json=test_data)
                    if response.status_code == 200:
                        result = response.json()
                        data = result.get('data', {})
                        predicted = data.get('category')
                        
                        if predicted == variant_group["expected_category"]:
                            print(f"✅ Test {test_counter} ({merchant}): {predicted} ✅")
                            self.results['passed'] += 1
                        else:
                            print(f"❌ Test {test_counter} ({merchant}): Expected {variant_group['expected_category']}, got {predicted}")
                            self.results['failed'] += 1
                    else:
                        print(f"❌ Test {test_counter} failed: {response.status_code}")
                        self.results['failed'] += 1
                        
                    test_counter += 1
                    
                except Exception as e:
                    print(f"❌ Test {test_counter} error: {e}")
                    self.results['failed'] += 1
                    self.results['errors'].append(f"NLP Test {test_counter}: {e}")
                    test_counter += 1
    
    def run_all_tests(self):
        """Run all advanced tests"""
        print("🚀 Unity Wallet ML Pipeline - Advanced Testing Suite")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run tests
        self.test_multi_category_insights()
        self.test_velocity_anomaly_detection() 
        self.test_credit_score_profiles()
        self.test_merchant_nlp_variants()
        
        # Results
        total_time = time.time() - start_time
        total_tests = self.results['passed'] + self.results['failed']
        success_rate = (self.results['passed'] / total_tests * 100) if total_tests > 0 else 0
        
        print("\n" + "=" * 60)
        print("📊 ADVANCED TEST RESULTS SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"⏱️  Total time: {total_time:.2f}s")
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        if self.results['errors']:
            print(f"\n⚠️  {len(self.results['errors'])} errors encountered:")
            for error in self.results['errors']:
                print(f"   • {error}")
        
        if success_rate >= 80:
            print(f"\n🌟 EXCELLENT PERFORMANCE! Advanced scenarios validated! 🌟")
        elif success_rate >= 60:
            print(f"\n✅ Good performance with some improvements needed")
        else:
            print(f"\n⚠️  Significant issues found, requires debugging")
        
        return success_rate

if __name__ == "__main__":
    tester = AdvancedMLTests()
    tester.run_all_tests()
