#!/usr/bin/env python3
"""
Test nhanh với accounts có sẵn
"""

import asyncio
import httpx

ML_SERVICE_URL = "http://localhost:8002"

# Accounts to test
TEST_ACCOUNTS = [
    "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR",  # Từ log
    "GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A",  # Foundation
    "GDWI4LSD6B7RHK2MMR76D5AGY55HO25JLAA7OZI757MLWZEFYWPNRTO2",  # Test account
]

async def quick_test(account: str):
    """Test nhanh một account"""
    print(f"\n🧪 Testing: {account}")
    print("-" * 80)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Test Features
            print("📊 Features...")
            response = await client.get(f"{ML_SERVICE_URL}/analytics/features/{account}?days_back=30")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Total transactions: {data.get('total_transactions', 0)}")
                print(f"✅ Monthly average: {data.get('transactions_per_month', 0):.2f}")
            else:
                print(f"❌ Features failed: {response.status_code}")
                return False
                
            # Test Chatbot
            print("\n🤖 Chatbot...")
            response = await client.post(
                f"{ML_SERVICE_URL}/chatbot/chat",
                json={
                    "message": "Phân tích tình hình tài chính của tôi",
                    "user_id": "test_user",
                    "account_address": account
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Chatbot response: {data.get('response', '')[:100]}...")
                print(f"✅ Suggestions: {len(data.get('suggestions', []))}")
            else:
                print(f"❌ Chatbot failed: {response.status_code}")
                
            return True
            
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False

async def main():
    print("🚀 QUICK STELLAR ACCOUNT TESTS")
    print("=" * 80)
    
    working_accounts = []
    
    for account in TEST_ACCOUNTS:
        success = await quick_test(account)
        if success:
            working_accounts.append(account)
    
    print(f"\n✅ WORKING ACCOUNTS ({len(working_accounts)}):")
    for account in working_accounts:
        print(f"   {account}")
    
    if working_accounts:
        best = working_accounts[0]
        print(f"\n🎯 RECOMMENDED ACCOUNT: {best}")
        print(f"\n📋 TEST COMMANDS:")
        print(f"Feature Analysis:")
        print(f"curl 'http://localhost:8002/analytics/features/{best}?days_back=30'")
        print(f"\nChatbot Test:")
        print(f"""curl -X POST 'http://localhost:8002/chatbot/chat' \\
  -H 'Content-Type: application/json' \\
  -d '{{"message": "Tôi có đang chi tiêu hợp lý không?", "user_id": "test", "account_address": "{best}"}}'""")

if __name__ == "__main__":
    asyncio.run(main())
