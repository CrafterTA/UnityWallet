"""
Sovico Ecosystem API Router
FastAPI endpoints for Sovico partner brands integration with PostgreSQL
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
        raise HTTPException(status_code=500, detail=str(e))stapi import APIRouter, HTTPException, Query
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
    """Get active campaigns for brand or all brands"""
    try:
        campaigns = await sovico_mock.get_campaigns(brand_id)
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
    limit: int = Query(50, ge=1, le=200)
):
    """Get user transaction history"""
    try:
        transactions = await sovico_mock.get_transaction_history(
            user_id=user_id,
            brand_id=brand_id,
            limit=limit
        )
        return {
            "success": True,
            "data": transactions,
            "total": len(transactions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/summary")
async def get_analytics_summary():
    """Get ecosystem analytics summary"""
    try:
        brands = await sovico_mock.get_brands()
        campaigns = await sovico_mock.get_campaigns()
        
        # Mock analytics data
        analytics = {
            "total_brands": len(brands),
            "active_campaigns": len(campaigns),
            "categories": {
                "coffee": len([b for b in brands if b["category"] == "coffee"]),
                "retail": len([b for b in brands if b["category"] == "retail"]),
                "ecommerce": len([b for b in brands if b["category"] == "ecommerce"]),
                "airline": len([b for b in brands if b["category"] == "airline"]),
                "hospitality": len([b for b in brands if b["category"] == "hospitality"]),
                "fuel": len([b for b in brands if b["category"] == "fuel"]),
                "food_delivery": len([b for b in brands if b["category"] == "food_delivery"]),
            },
            "mock_stats": {
                "total_users": 15420,
                "monthly_transactions": 45680,
                "total_points_issued": 2340000,
                "total_points_redeemed": 1890000
            }
        }
        
        return {
            "success": True,
            "data": analytics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/demo/generate-data")
async def generate_demo_data(user_id: str):
    """Generate demo transaction data for user"""
    try:
        import random
        from datetime import datetime, timedelta
        
        brands = await sovico_mock.get_brands()
        demo_transactions = []
        
        # Generate random transactions for the past 30 days
        for _ in range(random.randint(15, 30)):
            brand = random.choice(brands)
            amount = random.randint(20000, 500000)  # 20k to 500k VND
            
            # Random date in the past 30 days
            days_ago = random.randint(0, 30)
            
            result = await sovico_mock.earn_points(
                user_id=user_id,
                brand_id=brand["brand_id"],
                amount_vnd=amount,
                description=f"Demo purchase at {brand['name']}"
            )
            
            if result["success"]:
                demo_transactions.append({
                    "brand": brand["name"],
                    "amount": amount,
                    "points": result["points_earned"]
                })
        
        return {
            "success": True,
            "message": f"Generated {len(demo_transactions)} demo transactions",
            "data": demo_transactions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
