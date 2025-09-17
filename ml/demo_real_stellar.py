#!/usr/bin/env python3
"""
Demo với Stellar Testnet thực tế

Sử dụng Stellar SDK để tạo account và giao dịch thực trên testnet
"""

import asyncio
import httpx
import json
from stellar_sdk import Server, Keypair, Account, TransactionBuilder, Network
from stellar_sdk.exceptions import NotFoundError
from datetime import datetime

# Stellar Testnet Configuration
HORIZON_URL = "https://horizon-testnet.stellar.org"
NETWORK_PASSPHRASE = Network.TESTNET_NETWORK_PASSPHRASE
FRIENDBOT_URL = "https://friendbot.stellar.org"

# Service URLs
CHAIN_SERVICE_URL = "http://localhost:8000"
ML_SERVICE_URL = "http://localhost:8002"

class RealStellarDemo:
    def __init__(self):
        self.server = Server(HORIZON_URL)
        self.demo_keypairs = []
        
    async def create_test_account(self, name: str = "demo_account"):
        """Tạo account mới trên Stellar testnet"""
        print(f"🔑 Creating new test account: {name}")
        
        # Generate new keypair
        keypair = Keypair.random()
        public_key = keypair.public_key
        secret_key = keypair.secret
        
        print(f"Public Key: {public_key}")
        print(f"Secret Key: {secret_key}")
        
        # Fund account via Friendbot
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{FRIENDBOT_URL}?addr={public_key}")
                if response.status_code == 200:
                    print("✅ Account funded successfully via Friendbot")
                    print(f"Starting balance: 10,000 XLM")
                else:
                    print(f"❌ Friendbot error: {response.status_code}")
                    return None
            except Exception as e:
                print(f"❌ Error funding account: {e}")
                return None
        
        self.demo_keypairs.append({
            "name": name,
            "keypair": keypair,
            "public_key": public_key,
            "secret_key": secret_key
        })
        
        return keypair
    
    async def create_sample_transactions(self, source_keypair: Keypair, num_transactions: int = 5):
        """Tạo các giao dịch mẫu để test"""
        print(f"💸 Creating {num_transactions} sample transactions...")
        
        source_account = self.server.load_account(source_keypair.public_key)
        
        for i in range(num_transactions):
            try:
                # Tạo destination account mới cho mỗi giao dịch
                dest_keypair = Keypair.random()
                
                # Fund destination account
                async with httpx.AsyncClient() as client:
                    await client.get(f"{FRIENDBOT_URL}?addr={dest_keypair.public_key}")
                
                # Tạo transaction với amount khác nhau
                amounts = ["10", "25.5", "100", "50.75", "200"]
                amount = amounts[i % len(amounts)]
                
                transaction = (
                    TransactionBuilder(
                        source_account=source_account,
                        network_passphrase=NETWORK_PASSPHRASE,
                        base_fee=100,
                    )
                    .add_text_memo(f"Demo transaction {i+1}")
                    .append_payment_op(
                        destination=dest_keypair.public_key,
                        asset_code="XLM",
                        amount=amount
                    )
                    .set_timeout(30)
                    .build()
                )
                
                transaction.sign(source_keypair)
                response = self.server.submit_transaction(transaction)
                
                print(f"✅ Transaction {i+1}: {amount} XLM to {dest_keypair.public_key[:8]}...")
                print(f"   Hash: {response['hash']}")
                
                # Reload account for next transaction
                source_account = self.server.load_account(source_keypair.public_key)
                
                # Wait between transactions
                await asyncio.sleep(2)
                
            except Exception as e:
                print(f"❌ Transaction {i+1} failed: {e}")
                continue
    
    async def test_ml_analytics(self, account_address: str):
        """Test ML analytics với dữ liệu thực"""
        print(f"🧠 Testing ML Analytics for: {account_address}")
        print("=" * 60)
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                # 1. Test Feature Engineering
                print("📊 1. Testing Feature Engineering...")
                features_response = await client.get(
                    f"{ML_SERVICE_URL}/analytics/features/{account_address}?days_back=7"
                )
                
                if features_response.status_code == 200:
                    features = features_response.json()
                    print("✅ Feature Engineering Results:")
                    print(f"   - Total transactions: {features.get('total_transactions', 0)}")
                    print(f"   - Monthly average: {features.get('transactions_per_month', 0):.2f}")
                    print(f"   - Balance volatility: {features.get('balance_volatility', {})}")
                    print(f"   - Debt ratio: {features.get('debt_to_asset_ratio', 0):.2f}")
                else:
                    print(f"❌ Feature Engineering failed: {features_response.status_code}")
                    print(features_response.text)
                
                # 2. Test Anomaly Detection
                print("\n🚨 2. Testing Anomaly Detection...")
                anomaly_response = await client.get(
                    f"{ML_SERVICE_URL}/anomaly/detect/{account_address}"
                )
                
                if anomaly_response.status_code == 200:
                    anomalies = anomaly_response.json()
                    print("✅ Anomaly Detection Results:")
                    print(f"   - Anomalies found: {len(anomalies.get('anomalies', []))}")
                    for anomaly in anomalies.get('anomalies', [])[:3]:
                        print(f"   - {anomaly.get('type', 'Unknown')}: {anomaly.get('description', '')}")
                else:
                    print(f"❌ Anomaly Detection failed: {anomaly_response.status_code}")
                
                # 3. Test Chatbot with Gemini
                print("\n🤖 3. Testing Chatbot with Gemini LLM...")
                chat_response = await client.post(
                    f"{ML_SERVICE_URL}/chatbot/chat",
                    json={
                        "message": "Phân tích tình hình tài chính của tôi và đưa ra lời khuyên",
                        "user_id": "real_test_user",
                        "account_address": account_address
                    }
                )
                
                if chat_response.status_code == 200:
                    chat_result = chat_response.json()
                    print("✅ Chatbot Response:")
                    print(f"   Response: {chat_result.get('response', '')[:200]}...")
                    print(f"   Suggestions: {len(chat_result.get('suggestions', []))} items")
                else:
                    print(f"❌ Chatbot failed: {chat_response.status_code}")
                    print(chat_response.text)
                    
            except Exception as e:
                print(f"❌ ML Analytics test failed: {e}")
    
    async def get_account_info(self, public_key: str):
        """Lấy thông tin account từ Stellar"""
        try:
            account = self.server.accounts().account_id(public_key).call()
            print(f"\n💰 Account Info for {public_key}:")
            print(f"   Sequence: {account['sequence']}")
            
            balances = account.get('balances', [])
            for balance in balances:
                asset = balance.get('asset_type', 'native')
                if asset == 'native':
                    asset = 'XLM'
                print(f"   Balance: {balance.get('balance', '0')} {asset}")
            
            return account
        except NotFoundError:
            print(f"❌ Account {public_key} not found")
            return None
        except Exception as e:
            print(f"❌ Error getting account info: {e}")
            return None
    
    async def run_demo(self):
        """Chạy demo hoàn chỉnh"""
        print("🚀 STELLAR TESTNET REAL DATA DEMO")
        print("=" * 60)
        print(f"Using Horizon: {HORIZON_URL}")
        print(f"Network: {NETWORK_PASSPHRASE}")
        print()
        
        # 1. Tạo test account
        demo_keypair = await self.create_test_account("demo_wallet")
        if not demo_keypair:
            print("❌ Failed to create test account")
            return
        
        public_key = demo_keypair.public_key
        
        # 2. Kiểm tra account info
        await self.get_account_info(public_key)
        
        # 3. Tạo sample transactions
        await self.create_sample_transactions(demo_keypair, 5)
        
        # 4. Wait for transactions to settle
        print("\n⏳ Waiting for transactions to settle...")
        await asyncio.sleep(10)
        
        # 5. Test ML analytics
        await self.test_ml_analytics(public_key)
        
        print("\n✅ Demo completed!")
        print(f"Test account: {public_key}")
        print("You can view transactions at:")
        print(f"https://stellar.expert/explorer/testnet/account/{public_key}")

async def main():
    """Main demo function"""
    demo = RealStellarDemo()
    await demo.run_demo()

if __name__ == "__main__":
    asyncio.run(main())
