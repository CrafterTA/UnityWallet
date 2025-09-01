#!/usr/bin/env python3
"""
Simple Financial Copilot + Unity Wallet Backend Integration Test
Tests all API endpoints required by the ML system using requests
"""
import requests
import json
import time
from typing import Dict, Any


class SimpleIntegrationTester:
    """Test backend APIs for ML integration compatibility"""
    
    def __init__(self, backend_url: str = "http://localhost:8001"):
        self.backend_url = backend_url
        self.token = None
        
    def authenticate(self) -> bool:
        """Authenticate and get JWT token"""
        print("🔐 Authenticating with backend...")
        
        try:
            response = requests.post(
                f"{self.backend_url}/auth/login",
                params={"username": "alice", "password": "password123"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data["access_token"]
                print("✅ Authentication successful!")
                return True
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Authentication error: {str(e)}")
            return False
    
    def test_api_endpoint(self, name: str, endpoint: str, expected_fields: list = None) -> Dict[str, Any]:
        """Generic API endpoint tester"""
        print(f"\n📊 Testing {name}...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.get(f"{self.backend_url}{endpoint}", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {name} working!")
                
                # Check expected fields if provided
                if expected_fields:
                    for field in expected_fields:
                        if field in data:
                            print(f"   ✓ {field}: {str(data[field])[:50]}{'...' if len(str(data[field])) > 50 else ''}")
                        else:
                            print(f"   ⚠️ Missing field: {field}")
                
                return {"status": "success", "data": data}
            else:
                print(f"❌ {name} failed: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    pass
                return {"status": "error", "code": response.status_code}
        except Exception as e:
            print(f"❌ {name} error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def simulate_vietnamese_ai_response(self, api_data: Dict[str, Dict]) -> list:
        """Simulate Vietnamese AI responses that Financial Copilot would generate"""
        print("\n🤖 Simulating Financial Copilot Vietnamese AI Responses...")
        
        responses = []
        
        # Process each API result
        for api_name, result in api_data.items():
            if result.get("status") != "success":
                continue
                
            data = result.get("data", {})
            
            if api_name == "transactions":
                transactions = data.get("transactions", [])
                if transactions:
                    count = len(transactions)
                    recent = transactions[0]
                    responses.append(f"📊 Bạn có {count} giao dịch. Gần nhất: {recent.get('tx_type', 'Unknown')} {recent.get('amount', '0')} {recent.get('asset_code', 'VND')}")
            
            elif api_name == "balance":
                balances = data.get("balances", [])
                if balances:
                    total = sum(float(b.get("amount", 0)) for b in balances)
                    responses.append(f"💰 Tổng số dư: {total:,.0f} VND - Tình hình tài chính ổn định!")
            
            elif api_name == "analytics":
                spending = data.get("last_30d_spend", "0")
                categories = data.get("category_breakdown", [])
                responses.append(f"📈 Chi tiêu 30 ngày qua: {float(spending):,.0f} VND qua {len(categories)} danh mục")
            
            elif api_name == "credit_score":
                score = data.get("score", 0)
                if score >= 700:
                    responses.append(f"🏦 Điểm tín dụng {score} - Xuất sắc! Bạn có thể vay với lãi suất tốt nhất")
                elif score >= 650:
                    responses.append(f"🏦 Điểm tín dụng {score} - Tốt! Đủ điều kiện cho hầu hết các khoản vay")
                else:
                    responses.append(f"🏦 Điểm tín dụng {score} - Cần cải thiện để có điều kiện vay tốt hơn")
            
            elif api_name == "fraud_alerts":
                alerts = data.get("alerts", [])
                if alerts:
                    responses.append(f"🚨 Có {len(alerts)} cảnh báo bảo mật - Vui lòng kiểm tra ngay!")
                else:
                    responses.append("🔒 Tài khoản an toàn - Không có cảnh báo bảo mật")
            
            elif api_name == "budgets":
                budgets = data.get("budgets", [])
                total_limit = data.get("total_limit", 0)
                if budgets:
                    responses.append(f"💳 Ngân sách: {len(budgets)} danh mục với tổng hạn mức {total_limit:,.0f} VND")
            
            elif api_name == "savings_goals":
                goals = data.get("goals", [])
                total_target = data.get("total_target", 0)
                if goals:
                    responses.append(f"🎯 Mục tiêu tiết kiệm: {len(goals)} mục tiêu với tổng {total_target:,.0f} VND")
        
        return responses
    
    def run_complete_test(self) -> Dict[str, Any]:
        """Run complete integration test"""
        print("🚀 Financial Copilot + Unity Wallet Backend Integration Test")
        print("=" * 65)
        
        # Authenticate first
        if not self.authenticate():
            return {"status": "failed", "reason": "authentication"}
        
        # Define API tests
        api_tests = {
            "transactions": {
                "endpoint": "/transactions/",
                "expected_fields": ["transactions", "pagination"]
            },
            "balance": {
                "endpoint": "/wallet/balances",
                "expected_fields": ["balances"]
            },
            "analytics": {
                "endpoint": "/analytics/spend",
                "expected_fields": ["last_30d_spend", "category_breakdown"]
            },
            "credit_score": {
                "endpoint": "/analytics/credit-score",
                "expected_fields": ["score"]
            },
            "fraud_alerts": {
                "endpoint": "/analytics/alerts",
                "expected_fields": ["alerts"]
            },
            "budgets": {
                "endpoint": "/budgets/",
                "expected_fields": ["budgets", "total_limit"]
            },
            "savings_goals": {
                "endpoint": "/savings/goals",
                "expected_fields": ["goals", "total_target"]
            }
        }
        
        # Run all tests
        results = {}
        for name, config in api_tests.items():
            results[name] = self.test_api_endpoint(
                name.replace("_", " ").title(), 
                config["endpoint"],
                config["expected_fields"]
            )
        
        # Generate Vietnamese AI responses
        ai_responses = self.simulate_vietnamese_ai_response(results)
        
        # Calculate success rate
        successful = sum(1 for r in results.values() if r.get("status") == "success")
        total = len(results)
        success_rate = (successful / total) * 100
        
        print("\n" + "=" * 65)
        print("📋 FINANCIAL COPILOT INTEGRATION TEST RESULTS")
        print("=" * 65)
        print(f"✅ APIs Working: {successful}/{total} ({success_rate:.1f}%)")
        print(f"🤖 Generated {len(ai_responses)} Vietnamese AI responses")
        
        print(f"\n🇻🇳 Sample Vietnamese AI Responses:")
        for i, response in enumerate(ai_responses[:5], 1):  # Show first 5
            print(f"   {i}. {response}")
        
        if successful == total:
            print(f"\n🎉 PERFECT! ALL {total} APIs WORKING - FINANCIAL COPILOT READY! 🚀")
            print("✅ ML system can now:")
            print("   • Analyze real transaction data")
            print("   • Provide Vietnamese financial advice") 
            print("   • Detect fraud with real user data")
            print("   • Generate personalized insights")
            status = "perfect"
        elif successful >= total * 0.8:  # 80% or more working
            print(f"\n🟡 GOOD PROGRESS - {successful}/{total} APIs working")
            failed = [name for name, result in results.items() if result.get("status") != "success"]
            print(f"   ⚠️ Need to fix: {failed}")
            status = "good"
        else:
            print(f"\n🔴 NEEDS WORK - Only {successful}/{total} APIs working")
            status = "needs_work"
        
        return {
            "status": status,
            "success_rate": success_rate,
            "successful_apis": successful,
            "total_apis": total,
            "ai_responses": len(ai_responses),
            "results": results
        }


def main():
    """Main test runner"""
    tester = SimpleIntegrationTester()
    result = tester.run_complete_test()
    
    print(f"\nFinal Result: {result['status'].upper()}")
    return result['success_rate'] >= 80.0  # Consider 80%+ as success


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)