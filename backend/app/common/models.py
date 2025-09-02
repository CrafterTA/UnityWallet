from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Text, Boolean, DECIMAL, JSON
from sqlalchemy.types import TypeDecorator, VARCHAR
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import enum
import uuid
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
    P2P_TRANSFER = "p2p_transfer"

class TransactionStatus(enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"

class AlertType(enum.Enum):
    WELCOME = "welcome"
    TRANSACTION = "transaction"
    LOYALTY = "loyalty"
    SECURITY = "security"

class AuditAction(enum.Enum):
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    PAYMENT = "payment"
    SWAP = "swap"
    TRANSFER = "transfer"
    KYC_VERIFY = "kyc_verify"
    PASSWORD_CHANGE = "password_change"
    API_KEY_CREATE = "api_key_create"
    API_KEY_DELETE = "api_key_delete"

class AuditStatus(enum.Enum):
    SUCCESS = "success"
    FAILED = "failed"
    PENDING = "pending"
    ERROR = "error"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    kyc_status = Column(Enum(KYCStatus), default=KYCStatus.PENDING, nullable=False)
    
    # Relationships
    accounts = relationship("Account", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    loyalty_points = relationship("LoyaltyPoint", back_populates="user")
    credit_scores = relationship("CreditScore", back_populates="user")
    alerts = relationship("Alert", back_populates="user")
    budgets = relationship("Budget", back_populates="user")
    savings_goals = relationship("SavingsGoal", back_populates="user")

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    asset_code = Column(String(12), nullable=False)
    stellar_address = Column(String(56), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="accounts")
    balances = relationship("Balance", back_populates="account")

class Balance(Base):
    __tablename__ = "balances"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)
    asset_code = Column(String(12), nullable=False)
    amount = Column(DECIMAL(19, 7), nullable=False, default=0)
    
    # Relationships
    account = relationship("Account", back_populates="balances")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tx_type = Column(Enum(TransactionType, name='transactiontype', native_enum=True), nullable=False)
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
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    points = Column(Integer, nullable=False, default=0)
    
    # Relationships
    user = relationship("User", back_populates="loyalty_points")

class Offer(Base):
    __tablename__ = "offers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(String(200), nullable=False)
    points_required = Column(Integer, nullable=False)
    active = Column(Boolean, default=True, nullable=False)

class CreditScore(Base):
    __tablename__ = "credit_score"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    score = Column(Integer, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="credit_scores")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type = Column(Enum(AlertType), nullable=False)
    message = Column(String(200), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="alerts")

class Budget(Base):
    __tablename__ = "budgets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    category = Column(String(50), nullable=False)
    limit = Column(DECIMAL(19, 7), nullable=False)
    period = Column(String(20), nullable=False, default="monthly")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="budgets")

class SavingsGoal(Base):
    __tablename__ = "savings_goals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    target_amount = Column(DECIMAL(19, 7), nullable=False)
    current_amount = Column(DECIMAL(19, 7), nullable=False, default=0)
    target_date = Column(DateTime(timezone=True), nullable=False)
    start_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    status = Column(String(20), nullable=False, default="active")  # active, completed, paused
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="savings_goals")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    ts = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)  # Nullable for anonymous actions
    action = Column(Enum(AuditAction), nullable=False, index=True)
    resource = Column(String(100), nullable=False, index=True)  # e.g., "user", "transaction", "account"
    resource_id = Column(String(100), nullable=True, index=True)  # Resource identifier (UUID as string, etc.)
    status = Column(Enum(AuditStatus), nullable=False, index=True)
    request_id = Column(String(100), nullable=True, index=True)  # Correlation ID
    ip = Column(String(45), nullable=True, index=True)  # IPv4/IPv6 address
    meta = Column(JSON, nullable=True)  # Flexible metadata in JSON format
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Composite indexes for common query patterns
    __table_args__ = (
        # Index for queries by user and time range
        {'mysql_engine': 'InnoDB'},
    )