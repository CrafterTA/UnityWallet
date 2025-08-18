"""
Quick API Schema Test - Check what the API actually expects
"""

import requests
import json

def test_api_schemas():
    """Test API endpoints to understand expected schema"""
    
    BASE_URL = "http://localhost:8000"
    
    # Start API server if not running
    try:
        health_check = requests.get(f"{BASE_URL}/health", timeout=2)
        if health_check.status_code != 200:
            print("❌ API server not running. Start with:")
            print("   uvicorn src.api.service:app --reload --host 0.0.0.0 --port 8000")
            return
    except:
        print("❌ API server not running. Start with:")
        print("   uvicorn src.api.service:app --reload --host 0.0.0.0 --port 8000") 
        return
    
    print("🔍 Testing API Schemas...")
    
    # Test each endpoint with various payloads to see what works
    endpoints = {
        "spend": {
            "url": "/analytics/spend",
            "payloads": [
                {"description": "ăn phở", "merchant": "Phở Hồng", "amount": 50000},
                {"description": "ăn phở", "merchant_name": "Phở Hồng", "amount": 50000},
                {"description": "ăn phở", "merchant": "Phở Hồng", "amount": 50000, "mcc": "5812"},
                {"transaction_description": "ăn phở", "merchant": "Phở Hồng", "amount": 50000}
            ]
        },
        "credit": {
            "url": "/analytics/credit", 
            "payloads": [
                {"monthly_income": 15000000, "existing_debt": 5000000, "age": 28},
                {"income": 15000000, "debt": 5000000, "age": 28},
                {"monthly_income": 15000000, "existing_debt": 5000000, "age": 28, "employment_years": 3}
            ]
        },
        "alerts": {
            "url": "/analytics/alerts",
            "payloads": [
                {"user_id": "test", "amount": 200000, "merchant": "Test", "location": "HCM", "hour": 14},
                {"user_id": "test", "amount": 200000, "merchant": "Test", "location": "Ho Chi Minh"},
                {"user_id": "test", "amount": 200000, "merchant": "Test"}
            ]
        },
        "insights": {
            "url": "/analytics/insights",
            "payloads": [
                {"user_id": "test", "monthly_spending": {"total": 5000000}},
                {"user_id": "test", "spending_data": {"total": 5000000}},
                {"user_id": "test"}
            ]
        }
    }
    
    for endpoint_name, config in endpoints.items():
        print(f"\n🎯 Testing {endpoint_name.upper()} endpoint:")
        
        for i, payload in enumerate(config["payloads"], 1):
            try:
                response = requests.post(
                    f"{BASE_URL}{config['url']}", 
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=5
                )
                
                print(f"   Payload {i}: {response.status_code}")
                if response.status_code == 200:
                    result = response.json()
                    print(f"      ✅ SUCCESS: {result}")
                    break  # Found working schema
                elif response.status_code == 422:
                    error_detail = response.json()
                    print(f"      ❌ Validation Error: {error_detail.get('detail', 'Unknown')}")
                else:
                    print(f"      ❌ Error {response.status_code}: {response.text}")
                    
            except Exception as e:
                print(f"      ❌ Exception: {e}")
    
    # Get OpenAPI schema
    print(f"\n📋 Getting OpenAPI Schema...")
    try:
        schema_response = requests.get(f"{BASE_URL}/openapi.json")
        if schema_response.status_code == 200:
            schema = schema_response.json()
            
            print("📝 Available endpoints:")
            for path, methods in schema.get("paths", {}).items():
                for method, details in methods.items():
                    if method.lower() == "post":
                        summary = details.get("summary", "No summary")
                        print(f"   {method.upper()} {path}: {summary}")
                        
                        # Show request schema
                        request_body = details.get("requestBody", {})
                        if request_body:
                            content = request_body.get("content", {})
                            json_content = content.get("application/json", {})
                            schema_ref = json_content.get("schema", {})
                            print(f"      Schema: {schema_ref}")
        else:
            print(f"   ❌ Failed to get schema: {schema_response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Schema error: {e}")

if __name__ == "__main__":
    test_api_schemas()
