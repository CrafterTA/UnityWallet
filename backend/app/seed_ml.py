#!/usr/bin/env python3
"""
ML seed data integration script
Run this inside Docker container to add ML-generated data
"""
import sys
import os
import json
import csv
from pathlib import Path
from datetime import datetime
from decimal import Decimal

# Add app to path
sys.path.append('/app')

from app.common.database import SessionLocal
from app.common.models import User, Account, Balance, Transaction, CreditScore, KYCStatus, TransactionType, TransactionStatus
from app.common.auth import get_password_hash

def seed_ml_data():
    """Seed ML-generated transaction data"""
    
    # Path to ML seed data - adjust for Docker container
    SEED_DATA_PATH = Path("/app/app/ml_data/seed")
    
    print(f"Looking for ML data at: {SEED_DATA_PATH}")
    
    if not SEED_DATA_PATH.exists():
        print("❌ ML seed data directory not found")
        print("Run: cd ml && python data/seed/make_seed.py")
        return False
        
    # Check required files
    transactions_file = SEED_DATA_PATH / "transactions.csv"
    personas_file = SEED_DATA_PATH / "personas.json"
    
    if not transactions_file.exists():
        print("❌ transactions.csv not found")
        return False
        
    if not personas_file.exists():
        print("❌ personas.json not found") 
        return False
        
    print("✅ Found ML seed data files")
    
    # Get database session
    db = SessionLocal()
    
    try:
        # Load personas
        with open(personas_file, 'r', encoding='utf-8') as f:
            personas = json.load(f)
            
        print(f"📊 Processing {len(personas)} personas...")
        
        # Create ML personas as users
        ml_users = []
        for persona_key, persona_config in personas.items():
            username = persona_config['user_id'].lower()
            
            # Check if user already exists
            existing_user = db.query(User).filter(User.username == username).first()
            
            if existing_user:
                print(f"👤 User {username} already exists")
                continue
                
            # Create new user
            ml_user = User(
                username=username,
                full_name=persona_config['name'],
                hashed_password=get_password_hash("password123"),
                kyc_status=KYCStatus.VERIFIED
            )
            db.add(ml_user)
            ml_users.append((ml_user, username))
            print(f"👤 Created user: {username} - {persona_config['name']}")
                
        if ml_users:
            db.commit()
            
            # Create accounts for ML users
            for user, username in ml_users:
                for asset_code in ["SYP", "USD"]:
                    account = Account(
                        user_id=user.id,
                        asset_code=asset_code,
                        stellar_address=f"TEST_ML_{username.upper()}_{asset_code}"
                    )
                    db.add(account)
                    db.flush()  # Get account ID
                    
                    # Create balance
                    balance = Balance(
                        account_id=account.id,
                        asset_code=asset_code,
                        amount=Decimal("10000.0" if asset_code == "USD" else "25000000.0")
                    )
                    db.add(balance)
                    
            db.commit()
            print(f"✅ Created {len(ml_users)} ML users with accounts")
        
        # Load and process transactions
        with open(transactions_file, 'r', encoding='utf-8') as f:
            transactions = list(csv.DictReader(f))
            
        print(f"📈 Processing {len(transactions)} transactions...")
        
        transaction_count = 0
        for txn_data in transactions:
            # Find user
            username = txn_data['user_id'].lower()
            user = db.query(User).filter(User.username == username).first()
            
            if not user:
                continue
                
            # Find USD account
            account = db.query(Account).filter(
                Account.user_id == user.id,
                Account.asset_code == "USD"
            ).first()
            
            if not account:
                continue
                
            # Convert VND to USD (approximate)
            amount_vnd = float(txn_data['amount'])
            amount_usd = amount_vnd / 24000  # Rough conversion
            
            # Create transaction with shorter hash
            tx_id = txn_data['transaction_id'].split('_')[-1]  # Get just the number part
            short_hash = f"ML{tx_id[:6]}"  # Keep it under 28 chars
            
            transaction = Transaction(
                user_id=user.id,
                tx_type=TransactionType.PAYMENT,
                asset_code="USD", 
                amount=Decimal(str(round(amount_usd, 4))),
                status=TransactionStatus.SUCCESS,
                stellar_tx_hash=short_hash,
                destination="ML_SEED_DEST",  # Shorter destination
                memo=txn_data.get('description', 'ML Seed')[:28],  # DB limit is 28 chars
                metadata=json.dumps({
                    'ml_category': txn_data.get('category'),
                    'ml_merchant': txn_data.get('merchant_name'),
                    'ml_location': txn_data.get('location'),
                    'mcc': txn_data.get('mcc'),
                    'is_weekend': txn_data.get('is_weekend'),
                    'channel': txn_data.get('channel'),
                    'original_vnd_amount': amount_vnd
                })
            )
            
            db.add(transaction)
            transaction_count += 1
            
            # Batch commit every 50 transactions
            if transaction_count % 50 == 0:
                db.commit()
                print(f"📈 Processed {transaction_count} transactions...")
                
        db.commit()
        print(f"✅ Created {transaction_count} ML transactions")
        
        # Load credit scores
        credit_file = SEED_DATA_PATH / "credit_features.csv"
        if credit_file.exists():
            with open(credit_file, 'r', encoding='utf-8') as f:
                credit_features = list(csv.DictReader(f))
                
            print(f"💳 Processing {len(credit_features)} credit scores...")
            
            for credit_data in credit_features:
                username = credit_data['user_id'].lower()
                user = db.query(User).filter(User.username == username).first()
                
                if not user:
                    continue
                    
                # Update or create credit score
                existing_credit = db.query(CreditScore).filter(
                    CreditScore.user_id == user.id
                ).first()
                
                score = int(float(credit_data['credit_score']))
                
                if existing_credit:
                    existing_credit.score = score
                    print(f"💳 Updated credit score for {username}: {score}")
                else:
                    credit_score = CreditScore(
                        user_id=user.id,
                        score=score
                    )
                    db.add(credit_score)
                    print(f"💳 Created credit score for {username}: {score}")
                    
            db.commit()
            print(f"✅ Processed {len(credit_features)} credit scores")
        
        # Final summary
        print("\n🎉 ML seed data integration completed!")
        print(f"👥 Users: {len(ml_users)} created")
        print(f"📈 Transactions: {transaction_count} created")
        print(f"💳 Credit scores: {len(credit_features) if credit_file.exists() else 0} processed")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during ML seeding: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
        
    finally:
        db.close()

if __name__ == "__main__":
    success = seed_ml_data()
    if not success:
        sys.exit(1)