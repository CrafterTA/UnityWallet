"""
Sovico Ecosystem Mock Services
Demo implementation for hackathon - simulates partner brand APIs
"""

import asyncio
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class BrandConfig:
    brand_id: str
    name: str
    category: str
    logo_url: str
    primary_color: str
    point_ratio: float  # VND to points conversion
    min_spend: int  # minimum spend to earn points
    api_latency: float  # simulated API response time

@dataclass
class PointTransaction:
    transaction_id: str
    user_id: str
    brand_id: str
    amount: float
    points_earned: int
    transaction_type: str  # "earn" or "redeem"
    timestamp: datetime
    description: str

@dataclass
class Campaign:
    campaign_id: str
    brand_id: str
    title: str
    description: str
    bonus_multiplier: float
    valid_from: datetime
    valid_to: datetime
    terms: List[str]

import asyncio
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional

class BrandConfig:
    def __init__(self, brand_id: str, name: str, category: str, logo_url: str, 
                 primary_color: str, point_ratio: float, min_spend: int, api_latency: float):
        self.brand_id = brand_id
        self.name = name
        self.category = category
        self.logo_url = logo_url
        self.primary_color = primary_color
        self.point_ratio = point_ratio
        self.min_spend = min_spend
        self.api_latency = api_latency

class PointTransaction:
    def __init__(self, transaction_id: str, user_id: str, brand_id: str, amount: float,
                 points_earned: int, transaction_type: str, timestamp: datetime, description: str):
        self.transaction_id = transaction_id
        self.user_id = user_id
        self.brand_id = brand_id
        self.amount = amount
        self.points_earned = points_earned
        self.transaction_type = transaction_type
        self.timestamp = timestamp
        self.description = description

class Campaign:
    def __init__(self, campaign_id: str, brand_id: str, title: str, description: str,
                 bonus_multiplier: float, valid_from: datetime, valid_to: datetime, terms: List[str]):
        self.campaign_id = campaign_id
        self.brand_id = brand_id
        self.title = title
        self.description = description
        self.bonus_multiplier = bonus_multiplier
        self.valid_from = valid_from
        self.valid_to = valid_to
        self.terms = terms

class SovicoMockService:
    """Mock service simulating Sovico ecosystem APIs"""
    
    def __init__(self):
        self.brands = self._init_brands()
        self.user_points = {}  # user_id -> {brand_id: points}
        self.transactions = []  # transaction history
        self.campaigns = self._init_campaigns()
        
    def _init_brands(self) -> Dict[str, BrandConfig]:
        """Initialize mock brand configurations"""
        return {
            # Coffee Chains
            "highland": BrandConfig(
                brand_id="highland",
                name="Highland Coffee",
                category="coffee",
                logo_url="/images/brands/highland.png",
                primary_color="#8B4513",
                point_ratio=0.02,  # 2 points per 100 VND
                min_spend=20000,   # 20k VND minimum
                api_latency=0.3
            ),
            "phuclong": BrandConfig(
                brand_id="phuclong",
                name="Phúc Long Coffee & Tea",
                category="coffee",
                logo_url="/images/brands/phuclong.png", 
                primary_color="#2E8B57",
                point_ratio=0.025,
                min_spend=15000,
                api_latency=0.2
            ),
            
            # Retail
            "vinmart": BrandConfig(
                brand_id="vinmart",
                name="VinMart",
                category="retail",
                logo_url="/images/brands/vinmart.png",
                primary_color="#E31E24",
                point_ratio=0.01,
                min_spend=50000,
                api_latency=0.4
            ),
            "coopmart": BrandConfig(
                brand_id="coopmart",
                name="Co.opmart",
                category="retail", 
                logo_url="/images/brands/coopmart.png",
                primary_color="#0066CC",
                point_ratio=0.015,
                min_spend=30000,
                api_latency=0.35
            ),
            
            # E-commerce
            "shopee": BrandConfig(
                brand_id="shopee",
                name="Shopee",
                category="ecommerce",
                logo_url="/images/brands/shopee.png",
                primary_color="#FF6600",
                point_ratio=0.005,
                min_spend=100000,
                api_latency=0.25
            ),
            "lazada": BrandConfig(
                brand_id="lazada", 
                name="Lazada",
                category="ecommerce",
                logo_url="/images/brands/lazada.png",
                primary_color="#0F146D",
                point_ratio=0.008,
                min_spend=80000,
                api_latency=0.3
            ),
            
            # Airlines
            "vietjet": BrandConfig(
                brand_id="vietjet",
                name="VietJet Air",
                category="airline",
                logo_url="/images/brands/vietjet.png",
                primary_color="#FFC72C",
                point_ratio=0.001,
                min_spend=500000,
                api_latency=0.6
            ),
            "vietnam_airlines": BrandConfig(
                brand_id="vietnam_airlines",
                name="Vietnam Airlines", 
                category="airline",
                logo_url="/images/brands/vnairlines.png",
                primary_color="#B41E3C",
                point_ratio=0.0012,
                min_spend=600000,
                api_latency=0.8
            ),
            
            # Hotels/Tourism
            "vinpearl": BrandConfig(
                brand_id="vinpearl",
                name="Vinpearl Hotels",
                category="hospitality",
                logo_url="/images/brands/vinpearl.png",
                primary_color="#DAA520",
                point_ratio=0.003,
                min_spend=1000000,
                api_latency=0.5
            ),
            
            # Fuel Stations
            "petrolimex": BrandConfig(
                brand_id="petrolimex",
                name="Petrolimex",
                category="fuel",
                logo_url="/images/brands/petrolimex.png",
                primary_color="#00A651",
                point_ratio=0.02,
                min_spend=100000,
                api_latency=0.4
            ),
            
            # Food Delivery
            "grab_food": BrandConfig(
                brand_id="grab_food",
                name="GrabFood", 
                category="food_delivery",
                logo_url="/images/brands/grabfood.png",
                primary_color="#00B14F",
                point_ratio=0.015,
                min_spend=50000,
                api_latency=0.3
            ),
            "baemin": BrandConfig(
                brand_id="baemin",
                name="Baemin",
                category="food_delivery",
                logo_url="/images/brands/baemin.png", 
                primary_color="#2AC1BC",
                point_ratio=0.018,
                min_spend=40000,
                api_latency=0.25
            )
        }
    
    def _init_campaigns(self) -> List[Campaign]:
        """Initialize mock campaigns"""
        now = datetime.now()
        return [
            Campaign(
                campaign_id="highland_2x",
                brand_id="highland",
                title="Double Points Weekend",
                description="Earn 2x points on all purchases during weekends",
                bonus_multiplier=2.0,
                valid_from=now,
                valid_to=now + timedelta(days=30),
                terms=["Valid on weekends only", "Cannot combine with other offers"]
            ),
            Campaign(
                campaign_id="vinmart_bonus",
                brand_id="vinmart", 
                title="Grocery Bonus Month",
                description="Extra 50% points on grocery purchases over 200k",
                bonus_multiplier=1.5,
                valid_from=now,
                valid_to=now + timedelta(days=30),
                terms=["Minimum purchase 200,000 VND", "Grocery items only"]
            ),
            Campaign(
                campaign_id="shopee_flash",
                brand_id="shopee",
                title="Flash Sale Points",
                description="Triple points during flash sale hours (12PM-2PM)",
                bonus_multiplier=3.0,
                valid_from=now,
                valid_to=now + timedelta(days=7),
                terms=["12PM-2PM daily only", "Maximum 1000 bonus points per day"]
            )
        ]
    
    async def get_brands(self) -> List[Dict]:
        """Get all available brands"""
        await asyncio.sleep(0.1)  # Simulate API latency
        return [
            {
                "brand_id": brand.brand_id,
                "name": brand.name,
                "category": brand.category,
                "logo_url": brand.logo_url,
                "primary_color": brand.primary_color,
                "status": "active"
            }
            for brand in self.brands.values()
        ]
    
    async def get_user_points(self, user_id: str, brand_id: Optional[str] = None) -> Dict:
        """Get user points for specific brand or all brands"""
        if brand_id:
            brand = self.brands.get(brand_id)
            if not brand:
                raise ValueError(f"Brand {brand_id} not found")
            
            await asyncio.sleep(brand.api_latency)
            points = self.user_points.get(user_id, {}).get(brand_id, 0)
            return {
                "brand_id": brand_id,
                "brand_name": brand.name,
                "points": points,
                "updated_at": datetime.now().isoformat()
            }
        else:
            # Get all brands
            await asyncio.sleep(0.5)
            user_data = self.user_points.get(user_id, {})
            return {
                "user_id": user_id,
                "brands": [
                    {
                        "brand_id": brand_id,
                        "brand_name": self.brands[brand_id].name,
                        "points": user_data.get(brand_id, 0),
                        "category": self.brands[brand_id].category
                    }
                    for brand_id in self.brands.keys()
                ],
                "total_points": sum(user_data.values()),
                "updated_at": datetime.now().isoformat()
            }
    
    async def earn_points(self, user_id: str, brand_id: str, amount_vnd: float, description: str = "") -> Dict:
        """Simulate earning points from purchase"""
        brand = self.brands.get(brand_id)
        if not brand:
            raise ValueError(f"Brand {brand_id} not found")
        
        await asyncio.sleep(brand.api_latency)
        
        # Check minimum spend
        if amount_vnd < brand.min_spend:
            return {
                "success": False,
                "error": f"Minimum spend is {brand.min_spend:,} VND",
                "points_earned": 0
            }
        
        # Calculate points
        base_points = int(amount_vnd * brand.point_ratio)
        
        # Check for active campaigns
        multiplier = 1.0
        active_campaign = None
        for campaign in self.campaigns:
            if (campaign.brand_id == brand_id and 
                campaign.valid_from <= datetime.now() <= campaign.valid_to):
                multiplier = campaign.bonus_multiplier
                active_campaign = campaign.title
                break
        
        final_points = int(base_points * multiplier)
        
        # Update user points
        if user_id not in self.user_points:
            self.user_points[user_id] = {}
        if brand_id not in self.user_points[user_id]:
            self.user_points[user_id][brand_id] = 0
        
        self.user_points[user_id][brand_id] += final_points
        
        # Record transaction
        transaction = PointTransaction(
            transaction_id=f"txn_{int(datetime.now().timestamp())}_{random.randint(1000, 9999)}",
            user_id=user_id,
            brand_id=brand_id,
            amount=amount_vnd,
            points_earned=final_points,
            transaction_type="earn",
            timestamp=datetime.now(),
            description=description or f"Purchase at {brand.name}"
        )
        self.transactions.append(transaction)
        
        return {
            "success": True,
            "transaction_id": transaction.transaction_id,
            "points_earned": final_points,
            "base_points": base_points,
            "multiplier": multiplier,
            "active_campaign": active_campaign,
            "new_balance": self.user_points[user_id][brand_id],
            "timestamp": transaction.timestamp.isoformat()
        }
    
    async def redeem_points(self, user_id: str, brand_id: str, points: int, description: str = "") -> Dict:
        """Simulate redeeming points"""
        brand = self.brands.get(brand_id)
        if not brand:
            raise ValueError(f"Brand {brand_id} not found")
        
        await asyncio.sleep(brand.api_latency)
        
        # Check if user has enough points
        current_points = self.user_points.get(user_id, {}).get(brand_id, 0)
        if current_points < points:
            return {
                "success": False,
                "error": f"Insufficient points. Current: {current_points}, Required: {points}",
                "redeemed": 0
            }
        
        # Deduct points
        self.user_points[user_id][brand_id] -= points
        
        # Calculate VND value (reverse conversion)
        vnd_value = points / brand.point_ratio
        
        # Record transaction
        transaction = PointTransaction(
            transaction_id=f"rdm_{int(datetime.now().timestamp())}_{random.randint(1000, 9999)}",
            user_id=user_id,
            brand_id=brand_id,
            amount=vnd_value,
            points_earned=-points,  # negative for redemption
            transaction_type="redeem",
            timestamp=datetime.now(),
            description=description or f"Redemption at {brand.name}"
        )
        self.transactions.append(transaction)
        
        return {
            "success": True,
            "transaction_id": transaction.transaction_id,
            "points_redeemed": points,
            "vnd_value": vnd_value,
            "new_balance": self.user_points[user_id][brand_id],
            "timestamp": transaction.timestamp.isoformat()
        }
    
    async def get_campaigns(self, brand_id: Optional[str] = None) -> List[Dict]:
        """Get active campaigns"""
        await asyncio.sleep(0.2)
        
        campaigns = self.campaigns
        if brand_id:
            campaigns = [c for c in campaigns if c.brand_id == brand_id]
        
        # Only return active campaigns
        now = datetime.now()
        active_campaigns = [
            c for c in campaigns 
            if c.valid_from <= now <= c.valid_to
        ]
        
        return [
            {
                "campaign_id": c.campaign_id,
                "brand_id": c.brand_id,
                "brand_name": self.brands[c.brand_id].name,
                "title": c.title,
                "description": c.description,
                "bonus_multiplier": c.bonus_multiplier,
                "valid_from": c.valid_from.isoformat(),
                "valid_to": c.valid_to.isoformat(),
                "terms": c.terms
            }
            for c in active_campaigns
        ]
    
    async def get_transaction_history(self, user_id: str, brand_id: Optional[str] = None, limit: int = 50) -> List[Dict]:
        """Get user transaction history"""
        await asyncio.sleep(0.3)
        
        user_transactions = [
            t for t in self.transactions 
            if t.user_id == user_id
        ]
        
        if brand_id:
            user_transactions = [
                t for t in user_transactions 
                if t.brand_id == brand_id
            ]
        
        # Sort by timestamp (newest first)
        user_transactions.sort(key=lambda x: x.timestamp, reverse=True)
        
        # Limit results
        user_transactions = user_transactions[:limit]
        
        return [
            {
                "transaction_id": t.transaction_id,
                "brand_id": t.brand_id,
                "brand_name": self.brands[t.brand_id].name,
                "amount_vnd": t.amount,
                "points": abs(t.points_earned),
                "type": t.transaction_type,
                "description": t.description,
                "timestamp": t.timestamp.isoformat()
            }
            for t in user_transactions
        ]

# Global instance for the mock service
sovico_mock = SovicoMockService()
