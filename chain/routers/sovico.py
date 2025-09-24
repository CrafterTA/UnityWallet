"""
Sovico Ecosystem API Router
FastAPI endpoints for Sovico partner brands integration with PostgreSQL
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict
from chain.services.sovico_db import sovico_db
import time
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Mock storage for user points (in production, this would be in database)
mock_user_points = {}
# Mock storage for transaction history
mock_transactions = {}

router = APIRouter(tags=["sovico-ecosystem"])

@router.get("/brands")
async def get_brands():
    """Get all available Sovico partner brands"""
    try:
        brands = await sovico_db.get_brands()
        return {
            "success": True,
            "data": brands,
            "total": len(brands)
        }
    except Exception as e:
        # Fallback to mock data for testing
        mock_brands = [
            {
                "brand_id": "1",
                "name": "McDonald's",
                "category": "food",
                "logo_url": "",
                "primary_color": "#FFC72C",
                "status": "active"
            },
            {
                "brand_id": "2", 
                "name": "Nike",
                "category": "shopping",
                "logo_url": "",
                "primary_color": "#FF6B35",
                "status": "active"
            },
            {
                "brand_id": "3",
                "name": "Grab",
                "category": "services", 
                "logo_url": "",
                "primary_color": "#00B14F",
                "status": "active"
            },
            {
                "brand_id": "4",
                "name": "Vincom",
                "category": "shopping",
                "logo_url": "", 
                "primary_color": "#E31E24",
                "status": "active"
            },
            {
                "brand_id": "5",
                "name": "The Coffee House",
                "category": "food",
                "logo_url": "",
                "primary_color": "#D4A574",
                "status": "active"
            },
            {
                "brand_id": "6",
                "name": "Vietnam Airlines", 
                "category": "travel",
                "logo_url": "",
                "primary_color": "#0066CC",
                "status": "active"
            }
        ]
        return {
            "success": True,
            "data": mock_brands,
            "total": len(mock_brands)
        }

@router.get("/brands/categories")
async def get_brand_categories():
    """Get brands grouped by category"""
    try:
        brands = await sovico_db.get_brands()
        categories = {}
        
        for brand in brands:
            category = brand["category"]
            if category not in categories:
                categories[category] = []
            categories[category].append(brand)
        
        return {
            "success": True,
            "data": categories
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/points/{wallet_id}")
async def get_user_points(wallet_id: str):
    """Get user's total Sovico points"""
    try:
        points = mock_user_points.get(wallet_id, 1250.50)
        return {"success": True, "points": points}
    except Exception as e:
        logger.error(f"Error getting user points: {e}")
        return {"success": False, "error": str(e)}

@router.get("/transactions/{wallet_id}")
async def get_user_transactions(wallet_id: str, limit: int = 10):
    """Get user's Sovico transaction history"""
    try:
        transactions = mock_transactions.get(wallet_id, [])
        # Return limited number of transactions
        limited_transactions = transactions[:limit]
        
        return {
            "success": True,
            "data": limited_transactions,
            "total": len(transactions)
        }
    except Exception as e:
        logger.error(f"Error getting user transactions: {e}")
        return {"success": False, "error": str(e)}

@router.post("/points/earn")
async def earn_points(request: Dict):
    """Award points to wallet from brand purchase"""
    # Use mock data for development since DB is not configured
    try:
        wallet_id = request["stellar_public_key"]
        points_earned = int(request.get("amount_vnd", 0) / 1000)  # 1 point per 1000 VND
        
        # Update mock storage
        current_points = mock_user_points.get(wallet_id, 1250.50)
        new_total_points = current_points + points_earned
        mock_user_points[wallet_id] = new_total_points
        
        # Store transaction in history
        transaction_data = {
            "transaction_id": f"tx_{int(time.time())}_{request['brand_id']}",
            "stellar_public_key": wallet_id,
            "brand_id": request["brand_id"],
            "points_earned": points_earned,
            "total_points": new_total_points,
            "amount_vnd": request["amount_vnd"],
            "description": request.get("description", "Stellar payment"),
            "timestamp": time.time(),
            "transaction_hash": request.get("transaction_hash", ""),
            "stellar_amount": request.get("stellar_amount", "1.000"),  # Actual Stellar amount used
            "stellar_asset": request.get("stellar_asset", "XLM"),      # Actual Stellar asset used
            "type": "earn"
        }
        
        if wallet_id not in mock_transactions:
            mock_transactions[wallet_id] = []
        mock_transactions[wallet_id].insert(0, transaction_data)  # Add to beginning
        
        return {
            "success": True,
            "data": transaction_data
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to process earn points: {str(e)}"
        }

@router.post("/points/redeem")
async def redeem_points(request: Dict):
    """Redeem wallet points at brand"""
    try:
        result = await sovico_db.redeem_points(
            stellar_public_key=request["stellar_public_key"],
            brand_id=request["brand_id"],
            points=request["points"],
            description=request.get("description")
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaigns")
async def get_campaigns(brand_id: Optional[str] = Query(None)):
    """Get active campaigns for all brands or specific brand"""
    try:
        campaigns = await sovico_db.get_campaigns(brand_id)
        return {
            "success": True,
            "data": campaigns,
            "total": len(campaigns)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/wallets/{stellar_public_key}/transactions")
async def get_transaction_history(
    stellar_public_key: str, 
    brand_id: Optional[str] = Query(None),
    limit: int = Query(50, le=100)
):
    """Get wallet transaction history"""
    try:
        # Note: This method needs to be implemented in sovico_db
        return {
            "success": True,
            "data": [],
            "message": "Transaction history endpoint - to be implemented"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/demo/generate-data")
async def generate_demo_data(stellar_public_key: str):
    """Generate demo data for wallet testing"""
    try:
        brands = await sovico_db.get_brands()
        results = []
        
        # Generate sample transactions for demo
        demo_transactions = [
            {"brand_id": "highland", "amount_vnd": 45000, "description": "Coffee purchase"},
            {"brand_id": "vinmart", "amount_vnd": 250000, "description": "Grocery shopping"},
            {"brand_id": "shopee", "amount_vnd": 180000, "description": "Online purchase"},
        ]
        
        for txn in demo_transactions:
            result = await sovico_db.earn_points(
                stellar_public_key=stellar_public_key,
                brand_id=txn["brand_id"],
                amount_vnd=txn["amount_vnd"],
                description=txn["description"]
            )
            results.append(result)
        
        return {
            "success": True,
            "data": results,
            "message": "Demo data generated successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
