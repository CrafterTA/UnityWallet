from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Text, Boolean, DECIMAL
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
import enum
from datetime import datetime

Base = declarative_base()

class KYCStatus(enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"

class TransactionType(enum.Enum):
    PAYMENT = "payment"
    SWAP = "swap"
    EARN = "earn"
    BURN = "burn"

class TransactionStatus(enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"

class AlertType(enum.Enum):
    WELCOME = "welcome"
    TRANSACTION = "transaction"
    LOYALTY = "loyalty"
    SECURITY = "security"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    kyc_status = Column(Enum(KYCStatus), default=KYCStatus.PENDING, nullable=False)
    
    # Relationships
    accounts = relationship("Account", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    loyalty_points = relationship("LoyaltyPoint", back_populates="user")
    credit_scores = relationship("CreditScore", back_populates="user")
    alerts = relationship("Alert", back_populates="user")

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    asset_code = Column(String(12), nullable=False)
    stellar_address = Column(String(56), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="accounts")
    balances = relationship("Balance", back_populates="account")

class Balance(Base):
    __tablename__ = "balances"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    asset_code = Column(String(12), nullable=False)
    amount = Column(DECIMAL(19, 7), nullable=False, default=0)
    
    # Relationships
    account = relationship("Account", back_populates="balances")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tx_type = Column(Enum(TransactionType), nullable=False)
    asset_code = Column(String(12), nullable=False)
    amount = Column(DECIMAL(19, 7), nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False)
    stellar_tx_hash = Column(String(64), nullable=True)
    raw_xdr = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Additional fields for different transaction types
    destination = Column(String(56), nullable=True)  # For payments
    memo = Column(String(28), nullable=True)
    sell_asset = Column(String(12), nullable=True)  # For swaps
    buy_asset = Column(String(12), nullable=True)   # For swaps
    rate = Column(DECIMAL(19, 7), nullable=True)    # For swaps
    
    # Relationships
    user = relationship("User", back_populates="transactions")

class LoyaltyPoint(Base):
    __tablename__ = "loyalty_points"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    points = Column(Integer, nullable=False, default=0)
    
    # Relationships
    user = relationship("User", back_populates="loyalty_points")

class Offer(Base):
    __tablename__ = "offers"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(String(200), nullable=False)
    points_required = Column(Integer, nullable=False)
    active = Column(Boolean, default=True, nullable=False)

class CreditScore(Base):
    __tablename__ = "credit_score"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="credit_scores")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(AlertType), nullable=False)
    message = Column(String(200), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="alerts")