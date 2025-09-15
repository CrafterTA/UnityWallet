#!/usr/bin/env python3
"""
Tìm và test các Stellar testnet account có hoạt động
"""

import asyncio
import httpx
from stellar_sdk import Server
from datetime import datetime, timedelta

# Stellar testnet configuration
HORIZON_URL = "https://horizon-testnet.stellar.org"
server = Server(HORIZON_URL)

# Known active testnet accounts
ACTIVE_ACCOUNTS = [
    # Stellar Foundation testnet accounts
    "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR",
    "GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A", 
    "GDWI4LSD6B7RHK2MMR76D5AGY55HO25JLAA7OZI757MLWZEFYWPNRTO2",
    "GBYJZW5XFAI6XV73H5SAIUYK6XZI4CGGVBUBO3YQJ7WXYZA7PEKRPLIH",
    "GCKFBEIYTKP2FNADK5WQS6OEI5CEGBF6RGI5CXU2VT64GOJD2FVJUVXG",
    
    # Test accounts with transactions
    "GCCD6AJOYZCUAQLX32ZJF2MKFFAUJ53PVCFQI3RHWKL3V47QYE2BNAUT",
    "GDHARUVDX75BLG3URPWJLZ63TBL2Q6AFHEA75BBKVEQFRI3GAYUL3P62",
    "GBCDGNVTHI5HXDFKP5H3HAU4KEVXWAJPSVOOFIAPMZPNHNZJ2XLYDVJM",
    "GCZJM35NKGVK47BB4SPBDV25477PZYIYPVVG453LPYFNXLS3FGHDXOCM",
    "GCTIG4STIVQEJLECMZHVWMGBJGPNLHDBQV6FTDD3WK5DVVRDMAVYNEB7"
]

async def check_account_activity(public_key: str):
    """Kiểm tra hoạt động của account"""
    try:
        # Check account exists
        account = server.accounts().account_id(public_key).call()
        
        # Get recent transactions
        transactions = server.transactions().for_account(public_key).limit(10).order('desc').call()
        tx_count = len(transactions['_embedded']['records'])
        
        # Get recent payments  
        payments = server.payments().for_account(public_key).limit(10).order('desc').call()
        payment_count = len(payments['_embedded']['records'])
        
        # Get balances
        balances = account['balances']
        xlm_balance = 0
        for balance in balances:
            if balance['asset_type'] == 'native':
                xlm_balance = float(balance['balance'])
                break
        
        # Check last activity
        last_activity = None
        if transactions['_embedded']['records']:
            last_tx = transactions['_embedded']['records'][0]
            last_activity = last_tx['created_at']
        
        return {
            'public_key': public_key,
            'exists': True,
            'xlm_balance': xlm_balance,
            'transaction_count': tx_count,
            'payment_count': payment_count,
            'last_activity': last_activity,
            'sequence': account['sequence']
        }
        
    except Exception as e:
        return {
            'public_key': public_key,
            'exists': False,
            'error': str(e)
        }

async def test_ml_service(public_key: str):
    """Test ML service với account"""
    ML_SERVICE_URL = "http://localhost:8002"
    
    print(f"\n🧠 Testing ML Service for: {public_key[:8]}...")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Test feature engineering
            response = await client.get(
                f"{ML_SERVICE_URL}/analytics/features/{public_key}?days_back=30"
            )
            
            if response.status_code == 200:
                features = response.json()
                print(f"✅ Features: {features.get('total_transactions', 0)} transactions")
                return True
            else:
                print(f"❌ ML Service error: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ ML Service connection error: {e}")
            return False

async def main():
    """Main function"""
    print("🔍 CHECKING STELLAR TESTNET ACCOUNTS")
    print("=" * 60)
    
    active_accounts = []
    
    # Check each account
    for public_key in ACTIVE_ACCOUNTS:
        print(f"\n🔑 Checking: {public_key[:8]}...")
        
        account_info = await check_account_activity(public_key)
        
        if account_info['exists']:
            print(f"✅ Account exists!")
            print(f"   XLM Balance: {account_info['xlm_balance']:.2f}")
            print(f"   Transactions: {account_info['transaction_count']}")
            print(f"   Payments: {account_info['payment_count']}")
            print(f"   Last Activity: {account_info['last_activity']}")
            
            if account_info['transaction_count'] > 0:
                active_accounts.append(account_info)
        else:
            print(f"❌ Account not found: {account_info.get('error', 'Unknown error')}")
    
    print(f"\n📊 SUMMARY: Found {len(active_accounts)} active accounts")
    print("=" * 60)
    
    # Test top 3 most active accounts with ML service
    for account in sorted(active_accounts, key=lambda x: x['transaction_count'], reverse=True)[:3]:
        public_key = account['public_key']
        print(f"\n🎯 RECOMMENDED FOR TESTING: {public_key}")
        print(f"   Balance: {account['xlm_balance']:.2f} XLM")
        print(f"   Transactions: {account['transaction_count']}")
        print(f"   Last Activity: {account['last_activity']}")
        
        # Test with ML service if it's running
        await test_ml_service(public_key)
    
    # Provide copy-paste ready commands
    if active_accounts:
        best_account = max(active_accounts, key=lambda x: x['transaction_count'])
        print(f"\n🚀 BEST ACCOUNT FOR TESTING:")
        print(f"Public Key: {best_account['public_key']}")
        print(f"\n📋 Copy-paste test commands:")
        print(f"curl -X GET 'http://localhost:8002/analytics/features/{best_account['public_key']}?days_back=30'")
        print(f"\ncurl -X POST 'http://localhost:8002/chatbot/chat' \\")
        print(f"  -H 'Content-Type: application/json' \\")
        print(f"  -d '{{\"message\": \"Phân tích tài khoản của tôi\", \"user_id\": \"test\", \"account_address\": \"{best_account['public_key']}\"}}'")

if __name__ == "__main__":
    asyncio.run(main())
