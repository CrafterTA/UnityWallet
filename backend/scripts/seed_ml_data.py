#!/usr/bin/env python3
"""
Database integration script for ML seed data
Loads generated seed data from ML module into Unity Wallet database
"""
import asyncio
import csv
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List
import uuid

# Add app to path
sys.path.append(str(Path(__file__).parent.parent))

from app.common.database import get_db_session
from app.common.models import User, Account, Transaction, Balance, CreditScore
from sqlalchemy.orm import Session
from sqlalchemy import select

# Paths to ML seed data
ML_ROOT = Path(__file__).parent.parent.parent / "ml"
SEED_DATA_PATH = ML_ROOT / "data" / "seed"

class MLDataSeeder:
    """Handles seeding ML-generated data into Unity Wallet database"""
    
    def __init__(self, db_session: Session):
        self.db = db_session
        
    def load_seed_files(self) -> Dict:
        """Load all seed data files"""
        data = {}
        
        # Load transactions
        transactions_file = SEED_DATA_PATH / "transactions.csv"
        if transactions_file.exists():
            with open(transactions_file, 'r', encoding='utf-8') as f:
                data['transactions'] = list(csv.DictReader(f))
                
        # Load personas
        personas_file = SEED_DATA_PATH / "personas.json" 
        if personas_file.exists():
            with open(personas_file, 'r', encoding='utf-8') as f:
                data['personas'] = json.load(f)
                
        # Load credit features
        credit_file = SEED_DATA_PATH / "credit_features.csv"
        if credit_file.exists():
            with open(credit_file, 'r', encoding='utf-8') as f:
                data['credit_features'] = list(csv.DictReader(f))
                
        return data
        
    def create_users_from_personas(self, personas: Dict) -> Dict[str, str]:
        """Create User records from persona data"""
        user_id_map = {}
        
        for persona_key, persona_config in personas.items():
            # Check if user already exists
            existing_user = self.db.execute(
                select(User).where(User.email == f"{persona_config['user_id'].lower()}@test.com")
            ).scalar_one_or_none()
            
            if existing_user:
                user_id_map[persona_config['user_id']] = str(existing_user.user_id)
                continue
                
            # Create new user
            user = User(
                user_id=uuid.uuid4(),
                email=f"{persona_config['user_id'].lower()}@test.com",
                password_hash="$2b$12$dummy_hash_for_test_users",  # Dummy bcrypt hash
                phone=f"+84{hash(persona_config['user_id']) % 1000000000:09d}",
                full_name=persona_config['name'],
                kyc_status="APPROVED",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            self.db.add(user)
            self.db.flush()  # Get the ID
            
            # Create default account
            account = Account(
                account_id=uuid.uuid4(), 
                user_id=user.user_id,
                account_type="CHECKING",
                stellar_public_key=f"TEST_STELLAR_KEY_{user.user_id}",
                stellar_secret_key="TEST_SECRET_ENCRYPTED",
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            self.db.add(account)
            self.db.flush()
            
            # Create initial balances
            for currency in ["SYP", "USD"]:
                balance = Balance(
                    balance_id=uuid.uuid4(),
                    account_id=account.account_id,
                    asset_code=currency,
                    balance=10000.00 if currency == "USD" else 25000000.00,  # Initial balances
                    updated_at=datetime.utcnow()
                )
                self.db.add(balance)
            
            user_id_map[persona_config['user_id']] = str(user.user_id)
            
        self.db.commit()
        return user_id_map
        
    def seed_transactions(self, transactions: List[Dict], user_id_map: Dict[str, str]):
        """Seed transaction data"""
        transaction_count = 0
        
        for txn_data in transactions:
            # Map ML user ID to database user ID
            ml_user_id = txn_data['user_id']
            if ml_user_id not in user_id_map:
                continue
                
            db_user_id = uuid.UUID(user_id_map[ml_user_id])
            
            # Get user's account
            account = self.db.execute(
                select(Account).where(Account.user_id == db_user_id)
            ).scalar_one_or_none()
            
            if not account:
                continue
                
            # Convert amount from VND to USD (approximate rate)
            amount_vnd = float(txn_data['amount'])
            amount_usd = amount_vnd / 24000  # Rough VND to USD conversion
            
            # Create transaction record
            transaction = Transaction(
                transaction_id=uuid.uuid4(),
                account_id=account.account_id,
                transaction_type="SPEND",
                amount=amount_usd,
                asset_code="USD",
                status="COMPLETED",
                description=txn_data.get('description', 'ML Seed Transaction'),
                merchant_category=txn_data.get('category', 'Other'),
                merchant_name=txn_data.get('merchant_name', 'Test Merchant'),
                location=txn_data.get('location', 'Ho Chi Minh City'),
                metadata=json.dumps({
                    'ml_category': txn_data.get('category'),
                    'ml_subcategory': txn_data.get('subcategory'), 
                    'mcc': txn_data.get('mcc'),
                    'is_weekend': txn_data.get('is_weekend'),
                    'is_outlier': txn_data.get('is_outlier'),
                    'channel': txn_data.get('channel'),
                    'original_amount_vnd': amount_vnd
                }),
                created_at=datetime.fromisoformat(txn_data['transaction_date'].replace('T', ' ').replace('Z', '')),
                updated_at=datetime.utcnow()
            )
            
            self.db.add(transaction)
            transaction_count += 1
            
            # Commit in batches
            if transaction_count % 100 == 0:
                self.db.commit()
                print(f"Seeded {transaction_count} transactions...")
                
        self.db.commit()
        return transaction_count
        
    def seed_credit_scores(self, credit_features: List[Dict], user_id_map: Dict[str, str]):
        """Seed credit score data"""
        score_count = 0
        
        for credit_data in credit_features:
            ml_user_id = credit_data['user_id']
            if ml_user_id not in user_id_map:
                continue
                
            db_user_id = uuid.UUID(user_id_map[ml_user_id])
            
            # Check if credit score already exists
            existing_score = self.db.execute(
                select(CreditScore).where(CreditScore.user_id == db_user_id)
            ).scalar_one_or_none()
            
            if existing_score:
                # Update existing
                existing_score.score = int(float(credit_data['credit_score']))
                existing_score.grade = credit_data['credit_grade']
                existing_score.updated_at = datetime.utcnow()
            else:
                # Create new credit score record
                credit_score = CreditScore(
                    credit_score_id=uuid.uuid4(),
                    user_id=db_user_id,
                    score=int(float(credit_data['credit_score'])),
                    grade=credit_data['credit_grade'],
                    factors=json.dumps({
                        'total_transactions': int(float(credit_data.get('total_transactions', 0))),
                        'avg_transaction_amount': float(credit_data.get('avg_transaction_amount', 0)),
                        'unique_categories': int(float(credit_data.get('unique_categories', 0))),
                        'outlier_ratio': float(credit_data.get('outlier_ratio', 0)),
                        'credit_label': int(float(credit_data.get('credit_label', 0)))
                    }),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                self.db.add(credit_score)
            
            score_count += 1
            
        self.db.commit()
        return score_count
        
    def run_seed(self):
        """Execute the complete seeding process"""
        print("🔄 Loading ML seed data...")
        
        # Check if seed files exist
        if not SEED_DATA_PATH.exists():
            print(f"❌ Seed data directory not found: {SEED_DATA_PATH}")
            print("Run 'python ml/data/seed/make_seed.py' first to generate seed data")
            return False
            
        # Load seed data
        seed_data = self.load_seed_files()
        
        if not seed_data:
            print("❌ No seed data files found")
            return False
            
        print(f"✅ Loaded {len(seed_data)} seed data files")
        
        # Create users from personas
        if 'personas' in seed_data:
            print("🔄 Creating users from personas...")
            user_id_map = self.create_users_from_personas(seed_data['personas'])
            print(f"✅ Created/found {len(user_id_map)} users")
        else:
            print("❌ No personas data found")
            return False
            
        # Seed transactions
        if 'transactions' in seed_data:
            print("🔄 Seeding transactions...")
            txn_count = self.seed_transactions(seed_data['transactions'], user_id_map)
            print(f"✅ Seeded {txn_count} transactions")
            
        # Seed credit scores
        if 'credit_features' in seed_data:
            print("🔄 Seeding credit scores...")
            score_count = self.seed_credit_scores(seed_data['credit_features'], user_id_map)
            print(f"✅ Seeded {score_count} credit scores")
            
        print("✅ ML seed data integration completed!")
        return True


def main():
    """Main seeding function"""
    print("🚀 Starting ML seed data integration...")
    
    # Import database components
    try:
        from app.common.database import SessionLocal
        from app.common.config import get_settings
        
        # Initialize settings
        settings = get_settings()
        
        # Get database session (synchronous version)
        db_session = SessionLocal()
        
        try:
            seeder = MLDataSeeder(db_session)
            success = seeder.run_seed()
            
            if success:
                print("🎉 Seed data integration successful!")
            else:
                print("❌ Seed data integration failed!")
                sys.exit(1)
                
        finally:
            db_session.close()
            
    except ImportError as e:
        print(f"❌ Missing dependencies. Please install backend requirements:")
        print(f"   pip install -r requirements.txt")
        print(f"   Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("Make sure PostgreSQL is running and configured properly")
        sys.exit(1)


if __name__ == "__main__":
    # Run with: python scripts/seed_ml_data.py
    main()