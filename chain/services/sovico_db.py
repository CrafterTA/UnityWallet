"""
Sovico Database Service
Real PostgreSQL implementation for Sovico ecosystem
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy import create_engine, select, update, and_
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import IntegrityError
from chain.core.config import DATABASE_URL
from chain.models.sovico import Base, SovicoBrand, SovicoUserPoints, SovicoTransaction, SovicoCampaign

class SovicoDatabase:
    def __init__(self):
        self.engine = create_engine(DATABASE_URL)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
    def create_tables(self):
        """Create all Sovico tables"""
        Base.metadata.create_all(bind=self.engine)
        
    def get_session(self) -> Session:
        """Get database session"""
        return self.SessionLocal()
        
    async def initialize_brands(self):
        """Initialize default brands if not exists"""
        brands_data = [
            {
                "brand_id": "highland",
                "name": "Highland Coffee",
                "category": "coffee",
                "logo_url": "/images/brands/highland.png",
                "primary_color": "#8B4513",
                "points_ratio": 0.02,
                "redeem_ratio": 50.0
            },
            {
                "brand_id": "phuclong",
                "name": "Phúc Long Coffee & Tea",
                "category": "coffee",
                "logo_url": "/images/brands/phuclong.png",
                "primary_color": "#2E8B57",
                "points_ratio": 0.015,
                "redeem_ratio": 45.0
            },
            {
                "brand_id": "vinmart",
                "name": "VinMart",
                "category": "retail",
                "logo_url": "/images/brands/vinmart.png",
                "primary_color": "#E31E24",
                "points_ratio": 0.01,
                "redeem_ratio": 40.0
            },
            {
                "brand_id": "coopmart",
                "name": "Co.opmart",
                "category": "retail",
                "logo_url": "/images/brands/coopmart.png",
                "primary_color": "#0066CC",
                "points_ratio": 0.012,
                "redeem_ratio": 42.0
            },
            {
                "brand_id": "shopee",
                "name": "Shopee",
                "category": "ecommerce",
                "logo_url": "/images/brands/shopee.png",
                "primary_color": "#FF6600",
                "points_ratio": 0.025,
                "redeem_ratio": 35.0
            },
            {
                "brand_id": "lazada",
                "name": "Lazada",
                "category": "ecommerce",
                "logo_url": "/images/brands/lazada.png",
                "primary_color": "#0F146D",
                "points_ratio": 0.022,
                "redeem_ratio": 38.0
            },
            {
                "brand_id": "vietjet",
                "name": "VietJet Air",
                "category": "airline",
                "logo_url": "/images/brands/vietjet.png",
                "primary_color": "#FFC72C",
                "points_ratio": 0.05,
                "redeem_ratio": 25.0
            },
            {
                "brand_id": "vietnam_airlines",
                "name": "Vietnam Airlines",
                "category": "airline",
                "logo_url": "/images/brands/vnairlines.png",
                "primary_color": "#B41E3C",
                "points_ratio": 0.045,
                "redeem_ratio": 28.0
            },
            {
                "brand_id": "vinpearl",
                "name": "Vinpearl Hotels",
                "category": "hospitality",
                "logo_url": "/images/brands/vinpearl.png",
                "primary_color": "#DAA520",
                "points_ratio": 0.03,
                "redeem_ratio": 30.0
            },
            {
                "brand_id": "petrolimex",
                "name": "Petrolimex",
                "category": "fuel",
                "logo_url": "/images/brands/petrolimex.png",
                "primary_color": "#00A651",
                "points_ratio": 0.008,
                "redeem_ratio": 55.0
            },
            {
                "brand_id": "grab_food",
                "name": "GrabFood",
                "category": "food_delivery",
                "logo_url": "/images/brands/grabfood.png",
                "primary_color": "#00B14F",
                "points_ratio": 0.03,
                "redeem_ratio": 40.0
            },
            {
                "brand_id": "baemin",
                "name": "Baemin",
                "category": "food_delivery",
                "logo_url": "/images/brands/baemin.png",
                "primary_color": "#2AC1BC",
                "points_ratio": 0.028,
                "redeem_ratio": 42.0
            }
        ]
        
        session = self.get_session()
        try:
            for brand_data in brands_data:
                existing = session.query(SovicoBrand).filter_by(brand_id=brand_data["brand_id"]).first()
                if not existing:
                    brand = SovicoBrand(**brand_data)
                    session.add(brand)
            session.commit()
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
            
    async def initialize_campaigns(self):
        """Initialize sample campaigns"""
        campaigns_data = [
            {
                "campaign_id": "highland_2x",
                "brand_id": "highland",
                "title": "Double Points Weekend",
                "description": "Earn 2x points on all purchases during weekends",
                "bonus_multiplier": 2.0,
                "valid_from": datetime.now(),
                "valid_to": datetime.now() + timedelta(days=30),
                "terms": json.dumps(["Valid on weekends only", "Cannot combine with other offers"])
            },
            {
                "campaign_id": "vinmart_bonus",
                "brand_id": "vinmart",
                "title": "Grocery Bonus Month",
                "description": "Extra 50% points on grocery purchases over 200k",
                "bonus_multiplier": 1.5,
                "min_amount_vnd": 200000,
                "valid_from": datetime.now(),
                "valid_to": datetime.now() + timedelta(days=30),
                "terms": json.dumps(["Minimum purchase 200,000 VND", "Grocery items only"])
            },
            {
                "campaign_id": "shopee_flash",
                "brand_id": "shopee",
                "title": "Flash Sale Points",
                "description": "Triple points during flash sale hours (12PM-2PM)",
                "bonus_multiplier": 3.0,
                "valid_from": datetime.now(),
                "valid_to": datetime.now() + timedelta(days=7),
                "terms": json.dumps(["Valid 12PM-2PM only", "While stocks last"])
            }
        ]
        
        session = self.get_session()
        try:
            for campaign_data in campaigns_data:
                existing = session.query(SovicoCampaign).filter_by(campaign_id=campaign_data["campaign_id"]).first()
                if not existing:
                    campaign = SovicoCampaign(**campaign_data)
                    session.add(campaign)
            session.commit()
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    async def get_brands(self) -> List[Dict]:
        """Get all brands"""
        session = self.get_session()
        try:
            brands = session.query(SovicoBrand).filter_by(status="active").all()
            return [
                {
                    "brand_id": brand.brand_id,
                    "name": brand.name,
                    "category": brand.category,
                    "logo_url": brand.logo_url,
                    "primary_color": brand.primary_color,
                    "status": brand.status
                }
                for brand in brands
            ]
        finally:
            session.close()

    async def get_user_points(self, stellar_public_key: str, brand_id: Optional[str] = None) -> Dict:
        """Get user points for specific brand or all brands using Stellar public key"""
        session = self.get_session()
        try:
            if brand_id:
                # Get points for specific brand
                points_record = (session.query(SovicoUserPoints, SovicoBrand)
                               .join(SovicoBrand, SovicoUserPoints.brand_id == SovicoBrand.brand_id)
                               .filter(SovicoUserPoints.stellar_public_key == stellar_public_key, 
                                      SovicoUserPoints.brand_id == brand_id)
                               .first())
                
                if not points_record:
                    return {"stellar_public_key": stellar_public_key, "brand_id": brand_id, "points": 0}
                
                points, brand = points_record
                return {
                    "stellar_public_key": stellar_public_key,
                    "brand_id": brand_id,
                    "brand_name": brand.name,
                    "points": points.points,
                    "total_earned": points.total_earned,
                    "total_redeemed": points.total_redeemed
                }
            else:
                # Get points for all brands
                brands = session.query(SovicoBrand).filter_by(status="active").all()
                result = {"stellar_public_key": stellar_public_key, "brands": [], "total_points": 0}
                
                for brand in brands:
                    points_record = (session.query(SovicoUserPoints)
                                   .filter_by(stellar_public_key=stellar_public_key, brand_id=brand.brand_id)
                                   .first())
                    
                    points = points_record.points if points_record else 0
                    result["brands"].append({
                        "brand_id": brand.brand_id,
                        "brand_name": brand.name,
                        "points": points,
                        "category": brand.category
                    })
                    result["total_points"] += points
                
                return result
        finally:
            session.close()

    async def earn_points(self, stellar_public_key: str, brand_id: str, amount_vnd: float, description: str = None) -> Dict:
        """Award points to user from brand purchase using Stellar public key"""
        session = self.get_session()
        try:
            # Get brand info
            brand = session.query(SovicoBrand).filter_by(brand_id=brand_id).first()
            if not brand:
                return {"success": False, "error": f"Brand {brand_id} not found"}
            
            # Check for active campaigns
            now = datetime.now()
            campaign = (session.query(SovicoCampaign)
                       .filter(SovicoCampaign.brand_id == brand_id,
                              SovicoCampaign.status == "active",
                              SovicoCampaign.valid_from <= now,
                              SovicoCampaign.valid_to >= now)
                       .first())
            
            # Calculate points
            base_points = int(amount_vnd * brand.points_ratio)
            multiplier = campaign.bonus_multiplier if campaign else 1.0
            total_points = int(base_points * multiplier)
            
            # Create transaction
            transaction_id = f"txn_{int(datetime.now().timestamp())}_{stellar_public_key[:8]}"
            transaction = SovicoTransaction(
                transaction_id=transaction_id,
                stellar_public_key=stellar_public_key,
                brand_id=brand_id,
                transaction_type="earn",
                points_amount=total_points,
                vnd_amount=amount_vnd,
                multiplier=multiplier,
                campaign_id=campaign.campaign_id if campaign else None,
                description=description
            )
            session.add(transaction)
            
            # Update user points
            points_record = session.query(SovicoUserPoints).filter_by(stellar_public_key=stellar_public_key, brand_id=brand_id).first()
            if points_record:
                points_record.points += total_points
                points_record.total_earned += total_points
                points_record.updated_at = datetime.now()
            else:
                points_record = SovicoUserPoints(
                    stellar_public_key=stellar_public_key,
                    brand_id=brand_id,
                    points=total_points,
                    total_earned=total_points
                )
                session.add(points_record)
            
            session.commit()
            
            return {
                "success": True,
                "transaction_id": transaction_id,
                "points_earned": total_points,
                "base_points": base_points,
                "multiplier": multiplier,
                "active_campaign": campaign.title if campaign else None,
                "new_balance": points_record.points,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            session.rollback()
            return {"success": False, "error": str(e)}
        finally:
            session.close()

    async def redeem_points(self, stellar_public_key: str, brand_id: str, points: int, description: str = None) -> Dict:
        """Redeem user points at brand using Stellar public key"""
        session = self.get_session()
        try:
            # Get brand and user points
            brand = session.query(SovicoBrand).filter_by(brand_id=brand_id).first()
            if not brand:
                return {"success": False, "error": f"Brand {brand_id} not found"}
            
            points_record = session.query(SovicoUserPoints).filter_by(stellar_public_key=stellar_public_key, brand_id=brand_id).first()
            if not points_record or points_record.points < points:
                return {"success": False, "error": "Insufficient points"}
            
            # Calculate VND value
            vnd_value = points * brand.redeem_ratio
            
            # Create transaction
            transaction_id = f"rdm_{int(datetime.now().timestamp())}_{stellar_public_key[:8]}"
            transaction = SovicoTransaction(
                transaction_id=transaction_id,
                stellar_public_key=stellar_public_key,
                brand_id=brand_id,
                transaction_type="redeem",
                points_amount=-points,  # Negative for redemption
                vnd_amount=vnd_value,
                description=description
            )
            session.add(transaction)
            
            # Update user points
            points_record.points -= points
            points_record.total_redeemed += points
            points_record.updated_at = datetime.now()
            
            session.commit()
            
            return {
                "success": True,
                "transaction_id": transaction_id,
                "points_redeemed": points,
                "vnd_value": vnd_value,
                "new_balance": points_record.points,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            session.rollback()
            return {"success": False, "error": str(e)}
        finally:
            session.close()

    async def get_campaigns(self, brand_id: Optional[str] = None) -> List[Dict]:
        """Get active campaigns"""
        session = self.get_session()
        try:
            now = datetime.now()
            query = (session.query(SovicoCampaign, SovicoBrand)
                    .join(SovicoBrand, SovicoCampaign.brand_id == SovicoBrand.brand_id)
                    .filter(SovicoCampaign.status == "active",
                           SovicoCampaign.valid_from <= now,
                           SovicoCampaign.valid_to >= now))
            
            if brand_id:
                query = query.filter(SovicoCampaign.brand_id == brand_id)
            
            campaigns = query.all()
            
            return [
                {
                    "campaign_id": campaign.campaign_id,
                    "brand_id": campaign.brand_id,
                    "brand_name": brand.name,
                    "title": campaign.title,
                    "description": campaign.description,
                    "bonus_multiplier": campaign.bonus_multiplier,
                    "valid_from": campaign.valid_from.isoformat(),
                    "valid_to": campaign.valid_to.isoformat(),
                    "terms": json.loads(campaign.terms) if campaign.terms else []
                }
                for campaign, brand in campaigns
            ]
        finally:
            session.close()

# Global instance
sovico_db = SovicoDatabase()
