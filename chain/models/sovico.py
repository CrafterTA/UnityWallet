"""
Sovico Ecosystem Database Models
PostgreSQL models for brands, transactions, campaigns, and user points
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional

Base = declarative_base()

class SovicoBrand(Base):
    """Sovico partner brands table"""
    __tablename__ = "sovico_brands"
    
    brand_id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    logo_url = Column(String(200))
    primary_color = Column(String(10))
    status = Column(String(20), default="active")
    points_ratio = Column(Float, default=0.02)  # Points per VND spent
    redeem_ratio = Column(Float, default=50.0)  # VND per point when redeeming
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    transactions = relationship("SovicoTransaction", back_populates="brand")
    campaigns = relationship("SovicoCampaign", back_populates="brand")
    user_points = relationship("SovicoUserPoints", back_populates="brand")

class SovicoUserPoints(Base):
    """User points balance for each brand using Stellar public key"""
    __tablename__ = "sovico_user_points"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    stellar_public_key = Column(String(56), nullable=False)  # Stellar public key is 56 chars
    brand_id = Column(String(50), ForeignKey("sovico_brands.brand_id"), nullable=False)
    points = Column(Integer, default=0)
    total_earned = Column(Integer, default=0)
    total_redeemed = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    brand = relationship("SovicoBrand", back_populates="user_points")
    
    # Indexes
    __table_args__ = (
        Index('idx_stellar_brand', 'stellar_public_key', 'brand_id', unique=True),
    )

class SovicoTransaction(Base):
    """Transaction history for points earning and redemption using Stellar public key"""
    __tablename__ = "sovico_transactions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(String(100), unique=True, nullable=False)
    stellar_public_key = Column(String(56), nullable=False)  # Stellar public key
    brand_id = Column(String(50), ForeignKey("sovico_brands.brand_id"), nullable=False)
    transaction_type = Column(String(20), nullable=False)  # 'earn' or 'redeem'
    points_amount = Column(Integer, nullable=False)
    vnd_amount = Column(Float)  # VND spent (earn) or saved (redeem)
    multiplier = Column(Float, default=1.0)  # Campaign multiplier applied
    campaign_id = Column(String(50), ForeignKey("sovico_campaigns.campaign_id"))
    description = Column(Text)
    extra_data = Column(Text)  # JSON string for additional data
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    brand = relationship("SovicoBrand", back_populates="transactions")
    campaign = relationship("SovicoCampaign", back_populates="transactions")
    
    # Indexes
    __table_args__ = (
        Index('idx_stellar_transactions', 'stellar_public_key', 'created_at'),
        Index('idx_brand_transactions', 'brand_id', 'created_at'),
    )

class SovicoCampaign(Base):
    """Active campaigns and promotions"""
    __tablename__ = "sovico_campaigns"
    
    campaign_id = Column(String(50), primary_key=True)
    brand_id = Column(String(50), ForeignKey("sovico_brands.brand_id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    bonus_multiplier = Column(Float, default=1.0)
    min_amount_vnd = Column(Float)  # Minimum purchase amount
    max_points = Column(Integer)  # Maximum points that can be earned
    valid_from = Column(DateTime, nullable=False)
    valid_to = Column(DateTime, nullable=False)
    terms = Column(Text)  # JSON array of terms and conditions
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    brand = relationship("SovicoBrand", back_populates="campaigns")
    transactions = relationship("SovicoTransaction", back_populates="campaign")
    
    # Indexes
    __table_args__ = (
        Index('idx_campaign_dates', 'valid_from', 'valid_to'),
        Index('idx_brand_campaigns', 'brand_id', 'status'),
    )

class SovicoAnalytics(Base):
    """Analytics and metrics for Sovico ecosystem"""
    __tablename__ = "sovico_analytics"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(DateTime, nullable=False)
    brand_id = Column(String(50), ForeignKey("sovico_brands.brand_id"))
    metric_type = Column(String(50), nullable=False)  # 'daily_earnings', 'daily_redemptions', etc.
    metric_value = Column(Float, nullable=False)
    extra_data = Column(Text)  # JSON for additional metrics data
    created_at = Column(DateTime, default=func.now())
    
    # Indexes
    __table_args__ = (
        Index('idx_analytics_date', 'date', 'metric_type'),
        Index('idx_brand_analytics', 'brand_id', 'date'),
    )
