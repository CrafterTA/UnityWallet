"""Seed script for development data"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.common.database import SessionLocal, create_tables
from app.common.models import (
    User, Account, Balance, Transaction, LoyaltyPoint, 
    Offer, CreditScore, Alert, KYCStatus, AlertType, 
    TransactionType, TransactionStatus
)
from app.common.auth import get_password_hash
from decimal import Decimal

def seed_database():
    """Seed the database with test data"""
    
    # Create tables
    create_tables()
    
    db = SessionLocal()
    try:
        # Clear existing data
        db.query(Alert).delete()
        db.query(CreditScore).delete()
        db.query(LoyaltyPoint).delete()
        db.query(Transaction).delete()
        db.query(Balance).delete()
        db.query(Account).delete()
        db.query(Offer).delete()
        db.query(User).delete()
        db.commit()
        
        # Create users with real hashed passwords
        # Default password for all test users is "password123"
        hashed_password = get_password_hash("password123")
        
        users = [
            User(
                username="alice",
                full_name="Alice Johnson",
                hashed_password=hashed_password,
                kyc_status=KYCStatus.VERIFIED
            ),
            User(
                username="bob", 
                full_name="Bob Smith",
                hashed_password=hashed_password,
                kyc_status=KYCStatus.VERIFIED
            ),
            User(
                username="carol",
                full_name="Carol Williams",
                hashed_password=hashed_password, 
                kyc_status=KYCStatus.PENDING
            )
        ]
        
        for user in users:
            db.add(user)
        db.commit()
        
        # Generate test stellar addresses (not real funded accounts)
        # In production, these would be generated per user or loaded from environment
        testnet_addresses = {
            "alice": {
                "SYP": "GALICE_SYP_ADDRESS_PLACEHOLDER",
                "USD": "GALICE_USD_ADDRESS_PLACEHOLDER"
            },
            "bob": {
                "SYP": "GBOB_SYP_ADDRESS_PLACEHOLDER", 
                "USD": "GBOB_USD_ADDRESS_PLACEHOLDER"
            },
            "carol": {
                "SYP": "GCAROL_SYP_ADDRESS_PLACEHOLDER",
                "USD": "GCAROL_USD_ADDRESS_PLACEHOLDER"
            }
        }
        
        # Create accounts for each user with real testnet addresses
        for user in users:
            user_addresses = testnet_addresses[user.username]
            
            # SYP account
            syp_address = user_addresses["SYP"]
            print(f"SYP address for {user.username}: {syp_address}")
            
            syp_account = Account(
                user_id=user.id,
                asset_code="SYP",
                stellar_address=syp_address
            )
            
            # USD account  
            usd_address = user_addresses["USD"]
            print(f"USD address for {user.username}: {usd_address}")
            
            usd_account = Account(
                user_id=user.id,
                asset_code="USD",
                stellar_address=usd_address
            )
            
            db.add(syp_account)
            db.add(usd_account)
        
        db.commit()
        
        # Create balances
        accounts = db.query(Account).all()
        for account in accounts:
            if account.asset_code == "SYP":
                balance = Balance(
                    account_id=account.id,
                    asset_code="SYP", 
                    amount=Decimal("1000.0000000")
                )
            else:  # USD
                balance = Balance(
                    account_id=account.id,
                    asset_code="USD",
                    amount=Decimal("200.0000000")
                )
            db.add(balance)
        
        db.commit()
        
        # Create loyalty points
        for user in users:
            loyalty = LoyaltyPoint(
                user_id=user.id,
                points=500
            )
            db.add(loyalty)
        
        db.commit()
        
        # Create credit scores
        for user in users:
            credit = CreditScore(
                user_id=user.id,
                score=680
            )
            db.add(credit)
        
        db.commit()
        
        # Create sample offers
        offers = [
            Offer(
                code="COFFEE10",
                description="$10 Coffee Shop Discount",
                points_required=100,
                active=True
            ),
            Offer(
                code="MOVIE20", 
                description="$20 Movie Ticket Discount",
                points_required=200,
                active=True
            )
        ]
        
        for offer in offers:
            db.add(offer)
        
        db.commit()
        
        # Create welcome alerts
        for user in users:
            alert = Alert(
                user_id=user.id,
                type=AlertType.WELCOME,
                message=f"Welcome to the platform, {user.full_name}!"
            )
            db.add(alert)
        
        # Create a transaction alert for alice
        alice = db.query(User).filter(User.username == "alice").first()
        if alice:
            alert = Alert(
                user_id=alice.id,
                type=AlertType.TRANSACTION,
                message="Your recent payment of $50 USD was processed successfully"
            )
            db.add(alert)
        
        db.commit()
        
        # Test destination addresses (placeholders)
        test_destinations = [
            "GTEST_DESTINATION_1_PLACEHOLDER",
            "GTEST_DESTINATION_2_PLACEHOLDER", 
            "GTEST_DESTINATION_3_PLACEHOLDER"
        ]
        
        # Create sample transactions
        for i, user in enumerate(users):
            # Sample payment transaction with real testnet destination
            payment_tx = Transaction(
                user_id=user.id,
                tx_type=TransactionType.PAYMENT,
                asset_code="USD",
                amount=Decimal("25.0000000"),
                status=TransactionStatus.SUCCESS,
                stellar_tx_hash=f"sample_hash_{user.username}_payment",
                destination=test_destinations[i % len(test_destinations)],
                memo="Test payment"
            )
            db.add(payment_tx)
            
            # Sample swap transaction
            swap_tx = Transaction(
                user_id=user.id,
                tx_type=TransactionType.SWAP,
                asset_code="SYP",
                amount=Decimal("100.0000000"),
                status=TransactionStatus.SUCCESS,
                stellar_tx_hash=f"sample_hash_{user.username}_swap",
                sell_asset="SYP",
                buy_asset="USD",
                rate=Decimal("1.0000000")
            )
            db.add(swap_tx)
        
        db.commit()
        
        print("✅ Database seeded successfully!")
        print(f"Created {len(users)} users with accounts, balances, and sample data")
        
        # Optional: Seed ML data if available
        try:
            seed_ml_data(db)
        except Exception as e:
            print(f"⚠️  ML seed data not available: {e}")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def seed_ml_data(db):
    """Seed ML-generated transaction data if available"""
    import json
    import csv
    from pathlib import Path
    from datetime import datetime
    
    # Path to ML seed data
    ML_ROOT = Path(__file__).parent.parent / "ml"
    SEED_DATA_PATH = ML_ROOT / "data" / "seed"
    
    if not SEED_DATA_PATH.exists():
        print("🔄 Generate ML seed data first: cd ml && python data/seed/make_seed.py")
        return
        
    # Load transactions
    transactions_file = SEED_DATA_PATH / "transactions.csv"
    if not transactions_file.exists():
        print("🔄 No ML transaction data found")
        return
        
    print("🔄 Loading ML seed data...")
    
    # Load personas for user mapping
    personas_file = SEED_DATA_PATH / "personas.json"
    if personas_file.exists():
        with open(personas_file, 'r', encoding='utf-8') as f:
            personas = json.load(f)
            
        # Create ML personas as additional users
        ml_users = []
        for persona_key, persona_config in personas.items():
            # Check if user exists
            existing_user = db.query(User).filter(
                User.username == persona_config['user_id'].lower()
            ).first()
            
            if not existing_user:
                ml_user = User(
                    username=persona_config['user_id'].lower(),
                    full_name=persona_config['name'],
                    hashed_password=get_password_hash("password123"),
                    kyc_status=KYCStatus.VERIFIED
                )
                db.add(ml_user)
                ml_users.append(ml_user)
                
        if ml_users:
            db.commit()
            
            # Create accounts for ML users
            for user in ml_users:
                for asset_code in ["SYP", "USD"]:
                    account = Account(
                        user_id=user.id,
                        asset_code=asset_code,
                        stellar_address=f"TEST_ML_{user.username.upper()}_{asset_code}"
                    )
                    db.add(account)
                    
                    # Initial balance
                    balance = Balance(
                        account_id=account.id,
                        asset_code=asset_code,
                        amount=Decimal("10000.0" if asset_code == "USD" else "25000000.0")
                    )
                    db.add(balance)
                    
            db.commit()
            print(f"✅ Created {len(ml_users)} ML persona users")
    
    # Load and insert transactions 
    with open(transactions_file, 'r', encoding='utf-8') as f:
        transactions = list(csv.DictReader(f))
        
    transaction_count = 0
    for txn_data in transactions:
        # Find user
        user = db.query(User).filter(
            User.username == txn_data['user_id'].lower()
        ).first()
        
        if not user:
            continue
            
        # Find USD account
        account = db.query(Account).filter(
            Account.user_id == user.id,
            Account.asset_code == "USD"
        ).first()
        
        if not account:
            continue
            
        # Convert VND to USD (rough conversion)
        amount_vnd = float(txn_data['amount'])
        amount_usd = amount_vnd / 24000
        
        # Create transaction
        transaction = Transaction(
            user_id=user.id,
            tx_type=TransactionType.PAYMENT,
            asset_code="USD",
            amount=Decimal(str(round(amount_usd, 4))),
            status=TransactionStatus.SUCCESS,
            stellar_tx_hash=f"ml_{txn_data['transaction_id']}",
            destination="ML_SEED_DESTINATION",
            memo=txn_data.get('description', 'ML Seed Transaction'),
            metadata=json.dumps({
                'category': txn_data.get('category'),
                'merchant': txn_data.get('merchant_name'),
                'location': txn_data.get('location'),
                'mcc': txn_data.get('mcc'),
                'is_weekend': txn_data.get('is_weekend'),
                'channel': txn_data.get('channel'),
                'original_vnd_amount': amount_vnd
            })
        )
        
        db.add(transaction)
        transaction_count += 1
        
        # Batch commit
        if transaction_count % 50 == 0:
            db.commit()
            
    db.commit()
    print(f"✅ Seeded {transaction_count} ML transactions")
    
    # Load credit scores
    credit_file = SEED_DATA_PATH / "credit_features.csv"
    if credit_file.exists():
        with open(credit_file, 'r', encoding='utf-8') as f:
            credit_features = list(csv.DictReader(f))
            
        for credit_data in credit_features:
            user = db.query(User).filter(
                User.username == credit_data['user_id'].lower()
            ).first()
            
            if user:
                # Update or create credit score
                existing_credit = db.query(CreditScore).filter(
                    CreditScore.user_id == user.id
                ).first()
                
                score = int(float(credit_data['credit_score']))
                
                if existing_credit:
                    existing_credit.score = score
                else:
                    credit_score = CreditScore(
                        user_id=user.id,
                        score=score
                    )
                    db.add(credit_score)
                    
        db.commit()
        print(f"✅ Updated credit scores for {len(credit_features)} users")

if __name__ == "__main__":
    seed_database()