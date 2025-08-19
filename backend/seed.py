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
        
        # Real testnet addresses - funded accounts that actually exist
        testnet_addresses = {
            "alice": {
                "SYP": "GAMH7HZUV2EPRDLRG4HYANNPKIKY7QZGP247TZJHS4O34V4YOQ3ORQVX",
                "USD": "GDNA4MXDXDET3GQA6FBJNYFQHA42JHP22NG2FHHY2ZU5IZVHDPY2TYLB"
            },
            "bob": {
                "SYP": "GDLIX6M4HJHF3XSLAYWC7J3XDCY7UTGG5QQYKRSPKJJRFR27PRBPQVWR", 
                "USD": "GDIRIQNFDET2SOX4B3Z57B3QE3Q5UPKCR4TEHXRZ46XSQFEXK4DS6CYZ"
            },
            "carol": {
                "SYP": "GDKQQFJ4UCMG4TRBXDOKD4HQTMXI4JGARC7PR2T7HBT6SF2QP2D3LLXI",
                "USD": "GCNGVMT4LLD2G6XZ6KJJWJQXWROV7X4UEGOIIABKIHLWWPOWIS2WXAPE"
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
        
        # Additional test destination addresses
        test_destinations = [
            "GDI2T7YMDDXLNMN3PGVJPE5RY2NE34UC24XBE4BGXAOUCO4HMUWA6OLY",
            "GBO5QFMP6C6CK7X7RXPE6PGC724NHKIFA64SG7BGZCTQP2KG2PPUYL5L", 
            "GBHBTHKKQQZOKBQ3VST4S4KZPT2J5HLVEPQAVRO3Z6JZMT5TOGIVU7DL"
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
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()