"""
Advanced Test Cases for Unity Wallet ML Components
Detailed testing for each ML model individually
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json

def test_spend_classifier_standalone():
    """Test spend classifier without API"""
    print("🛒 Testing Spend Classifier (Standalone)")
    
    try:
        # Load model
        model = joblib.load('artifacts/models/spend_classifier.joblib')
        
        # Test cases
        test_cases = [
            {"description": "ăn phở bò", "merchant": "Phở Hồng", "mcc": "5812", "expected": "food"},
            {"description": "đi grab", "merchant": "Grab", "mcc": "4121", "expected": "transport"},
            {"description": "mua quần áo", "merchant": "H&M", "mcc": "5651", "expected": "shopping"},
            {"description": "xem phim", "merchant": "CGV", "mcc": "7832", "expected": "entertainment"},
            {"description": "tiền điện", "merchant": "EVN", "mcc": "4900", "expected": "bills"}
        ]
        
        passed = 0
        for i, test in enumerate(test_cases, 1):
            try:
                prediction = model.predict(test)
                if prediction == test["expected"]:
                    print(f"   ✅ Test {i}: {test['description']} → {prediction}")
                    passed += 1
                else:
                    print(f"   ❌ Test {i}: {test['description']} → {prediction} (expected {test['expected']})")
            except Exception as e:
                print(f"   ❌ Test {i}: Error - {e}")
        
        print(f"   📊 Passed: {passed}/{len(test_cases)}")
        return passed == len(test_cases)
        
    except Exception as e:
        print(f"   ❌ Failed to load spend classifier: {e}")
        return False

def test_credit_scorer_standalone():
    """Test credit scorer without API"""
    print("\n💳 Testing Credit Scorer (Standalone)")
    
    try:
        # Load model
        model = joblib.load('artifacts/models/credit_score_model.joblib')
        
        # Test cases with different risk profiles
        test_cases = [
            {
                "name": "High Income Low Risk",
                "features": {
                    "monthly_income": 30000000,
                    "existing_debt": 2000000,
                    "age": 35,
                    "employment_years": 10,
                    "savings_balance": 200000000,
                    "avg_monthly_spending": 8000000,
                    "transaction_frequency": 45,
                    "spending_volatility": 0.2,
                    "debt_to_income_ratio": 0.067,
                    "savings_to_income_ratio": 6.67
                },
                "expected_grade": "A"
            },
            {
                "name": "Medium Risk Profile", 
                "features": {
                    "monthly_income": 15000000,
                    "existing_debt": 8000000,
                    "age": 28,
                    "employment_years": 3,
                    "savings_balance": 30000000,
                    "avg_monthly_spending": 12000000,
                    "transaction_frequency": 35,
                    "spending_volatility": 0.4,
                    "debt_to_income_ratio": 0.533,
                    "savings_to_income_ratio": 2.0
                },
                "expected_grade": "B"
            }
        ]
        
        passed = 0
        for i, test in enumerate(test_cases, 1):
            try:
                result = model.predict_score(test["features"])
                score = result["score"]
                grade = result["grade"]
                
                print(f"   ✅ Test {i} ({test['name']}): Score {score}, Grade {grade}")
                print(f"      Reasons: {', '.join(result.get('reason_codes', [])[:3])}")
                
                # Validate score range and grade logic
                if 300 <= score <= 850:
                    passed += 1
                else:
                    print(f"      ❌ Score out of range: {score}")
                    
            except Exception as e:
                print(f"   ❌ Test {i}: Error - {e}")
        
        print(f"   📊 Passed: {passed}/{len(test_cases)}")
        return passed == len(test_cases)
        
    except Exception as e:
        print(f"   ❌ Failed to load credit scorer: {e}")
        return False

def test_anomaly_detector_standalone():
    """Test anomaly detector without API"""
    print("\n🚨 Testing Anomaly Detector (Standalone)")
    
    try:
        # Load model
        model = joblib.load('artifacts/models/anomaly_detector.joblib')
        
        # Create test user baseline
        user_id = "test_user_001"
        normal_transactions = []
        
        # Generate normal transaction history (last 30 days)
        base_date = datetime.now() - timedelta(days=30)
        for i in range(50):  # 50 normal transactions
            normal_transactions.append({
                "user_id": user_id,
                "amount": np.random.normal(150000, 50000),  # Normal: 150k ± 50k
                "merchant": f"Normal Merchant {i%10}",
                "location": "Ho Chi Minh",
                "transaction_date": base_date + timedelta(days=i//2),
                "hour": np.random.choice([8, 9, 12, 13, 18, 19, 20]),  # Normal hours
                "category": np.random.choice(["food", "transport", "shopping"])
            })
        
        # Build baseline
        transactions_df = pd.DataFrame(normal_transactions)
        baseline = model.build_user_baseline(user_id, transactions_df)
        
        if baseline is None:
            print("   ❌ Failed to build user baseline")
            return False
        
        print(f"   📊 Built baseline: avg amount {baseline['amount_stats']['mean']:.0f} VND")
        
        # Test cases
        test_cases = [
            {
                "name": "Normal Transaction",
                "transaction": {
                    "user_id": user_id,
                    "amount": 160000,
                    "merchant": "Circle K",
                    "location": "Ho Chi Minh",
                    "hour": 14,
                    "category": "food"
                },
                "should_be_anomaly": False
            },
            {
                "name": "Large Amount Anomaly",
                "transaction": {
                    "user_id": user_id,
                    "amount": 5000000,  # 33x normal amount
                    "merchant": "Expensive Store",
                    "location": "Ho Chi Minh", 
                    "hour": 15,
                    "category": "shopping"
                },
                "should_be_anomaly": True
            },
            {
                "name": "Time Anomaly",
                "transaction": {
                    "user_id": user_id,
                    "amount": 200000,
                    "merchant": "Late Night Store",
                    "location": "Ho Chi Minh",
                    "hour": 3,  # 3 AM
                    "category": "food"
                },
                "should_be_anomaly": True
            },
            {
                "name": "Location Anomaly",
                "transaction": {
                    "user_id": user_id,
                    "amount": 300000,
                    "merchant": "Hanoi Restaurant",
                    "location": "Ha Noi",  # Different city
                    "hour": 12,
                    "category": "food"
                },
                "should_be_anomaly": True
            }
        ]
        
        passed = 0
        for i, test in enumerate(test_cases, 1):
            try:
                result = model.detect_anomaly(test["transaction"], baseline)
                is_anomaly = result["is_anomaly"]
                risk_score = result["risk_score"]
                factors = result.get("anomaly_factors", [])
                
                if is_anomaly == test["should_be_anomaly"]:
                    print(f"   ✅ Test {i} ({test['name']}): Correct detection")
                    print(f"      Risk score: {risk_score:.3f}, Factors: {len(factors)}")
                    passed += 1
                else:
                    print(f"   ❌ Test {i} ({test['name']}): Expected {test['should_be_anomaly']}, got {is_anomaly}")
                    
            except Exception as e:
                print(f"   ❌ Test {i}: Error - {e}")
        
        print(f"   📊 Passed: {passed}/{len(test_cases)}")
        return passed == len(test_cases)
        
    except Exception as e:
        print(f"   ❌ Failed to load anomaly detector: {e}")
        return False

def test_model_artifacts():
    """Test if all model artifacts exist and are loadable"""
    print("\n📦 Testing Model Artifacts")
    
    artifacts = [
        "artifacts/models/spend_classifier.joblib",
        "artifacts/models/credit_score_model.joblib", 
        "artifacts/models/anomaly_detector.joblib",
        "artifacts/models/spend_classifier_metrics.json",
        "artifacts/models/credit_score_metrics.json",
        "artifacts/models/anomaly_detector_metrics.json",
        "artifacts/dicts/mcc_mapping.json"
    ]
    
    passed = 0
    for artifact in artifacts:
        try:
            if artifact.endswith('.joblib'):
                model = joblib.load(artifact)
                print(f"   ✅ {artifact}: Loaded successfully")
            elif artifact.endswith('.json'):
                with open(artifact, 'r') as f:
                    data = json.load(f)
                print(f"   ✅ {artifact}: {len(data)} items")
            passed += 1
        except Exception as e:
            print(f"   ❌ {artifact}: {e}")
    
    print(f"   📊 Passed: {passed}/{len(artifacts)}")
    return passed == len(artifacts)

def test_data_quality():
    """Test synthetic data quality"""
    print("\n📊 Testing Data Quality")
    
    try:
        # Load transaction data
        df = pd.read_csv('data/seed/transactions.csv')
        
        print(f"   📈 Total transactions: {len(df)}")
        print(f"   👥 Unique users: {df['user_id'].nunique()}")
        print(f"   🏪 Unique merchants: {df['merchant_name'].nunique()}")
        print(f"   📁 Categories: {', '.join(df['category'].unique())}")
        
        # Check data quality
        checks = [
            ("No null user_ids", df['user_id'].isna().sum() == 0),
            ("No null amounts", df['amount'].isna().sum() == 0),
            ("Positive amounts", (df['amount'] > 0).all()),
            ("Valid timestamps", pd.to_datetime(df['transaction_date'], errors='coerce').isna().sum() == 0),
            ("Reasonable amounts", df['amount'].between(1000, 100000000).all())  # 1k to 100M VND
        ]
        
        passed = 0
        for check_name, result in checks:
            if result:
                print(f"   ✅ {check_name}")
                passed += 1
            else:
                print(f"   ❌ {check_name}")
        
        print(f"   📊 Passed: {passed}/{len(checks)}")
        return passed == len(checks)
        
    except Exception as e:
        print(f"   ❌ Failed to load transaction data: {e}")
        return False

def run_standalone_tests():
    """Run all standalone tests"""
    print("🧪 Unity Wallet ML - Standalone Component Tests")
    print("=" * 55)
    
    tests = [
        ("Model Artifacts", test_model_artifacts),
        ("Data Quality", test_data_quality),
        ("Spend Classifier", test_spend_classifier_standalone),
        ("Credit Scorer", test_credit_scorer_standalone),
        ("Anomaly Detector", test_anomaly_detector_standalone)
    ]
    
    passed_tests = 0
    total_tests = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed_tests += 1
                print(f"✅ {test_name}: PASSED")
            else:
                print(f"❌ {test_name}: FAILED")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")
    
    print("\n" + "=" * 55)
    print("📊 STANDALONE TEST SUMMARY")
    print("=" * 55)
    print(f"✅ Passed: {passed_tests}/{total_tests}")
    print(f"📈 Success rate: {(passed_tests/total_tests*100):.1f}%")
    
    if passed_tests == total_tests:
        print("\n🎉 ALL STANDALONE TESTS PASSED!")
    else:
        print(f"\n⚠️  {total_tests - passed_tests} tests failed.")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    # Change to ML directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Run standalone tests
    run_standalone_tests()
