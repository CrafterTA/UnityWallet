"""
Sovico Ecosystem API Router
FastAPI endpoints for Sovico partner brands integration with PostgreSQL
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict
from chain.services.sovico_db import sovico_db

router = APIRouter(prefix="/sovico", tags=["sovico-ecosystem"])

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
        raise HTTPException(status_code=500, detail=str(e))

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

@router.get("/users/{user_id}/points")
async def get_user_points(user_id: str, brand_id: Optional[str] = Query(None)):
    """Get user points for specific brand or all brands"""
    try:
        points_data = await sovico_db.get_user_points(user_id, brand_id)
        return {
            "success": True,
            "data": points_data
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/points/earn")
async def earn_points(request: Dict):
    """Award points to user from brand purchase"""
    try:
        result = await sovico_db.earn_points(
            user_id=request["user_id"],
            brand_id=request["brand_id"],
            amount_vnd=request["amount_vnd"],
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

@router.post("/points/redeem")
async def redeem_points(request: Dict):
    """Redeem user points at brand"""
    try:
        result = await sovico_db.redeem_points(
            user_id=request["user_id"],
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

@router.get("/users/{user_id}/transactions")
async def get_transaction_history(
    user_id: str, 
    brand_id: Optional[str] = Query(None),
    limit: int = Query(50, le=100)
):
    """Get user transaction history"""
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
async def generate_demo_data(user_id: str):
    """Generate demo data for user testing"""
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
                user_id=user_id,
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
