from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from services.prices import (
    get_token_price, get_all_prices, get_token_info,
    calculate_usd_value, get_price_change_24h
)

router = APIRouter(prefix="/prices", tags=["prices"])

@router.get("/")
def get_prices():
    """
    Get all supported token prices
    """
    try:
        result = get_all_prices()
        return {
            "success": True,
            "data": result,
            "supported_tokens": {
                "SOL": {
                    "mint": "native",
                    "coin_id": "solana",
                    "symbol": "SOL",
                    "name": "Solana"
                },
                "dUSDT": {
                    "mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
                    "coin_id": "tether", 
                    "symbol": "dUSDT",
                    "name": "Devnet Tether USD"
                },
                "dUSDC": {
                    "mint": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
                    "coin_id": "usd-coin",
                    "symbol": "dUSDC", 
                    "name": "Devnet USD Coin"
                }
            }
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch prices: {str(e)}")

@router.get("/token/{token_mint}")
def get_token_price_info(token_mint: str):
    """
    Get price information for a specific token
    """
    try:
        token_info = get_token_info(token_mint)
        
        if not token_info["supported"]:
            raise HTTPException(400, f"Token {token_mint} is not supported")
        
        # Add 24h change
        price_change = get_price_change_24h(token_mint)
        if price_change is not None:
            token_info["price_change_24h"] = price_change
            token_info["price_change_24h_formatted"] = f"{price_change:+.2f}%"
        
        return {
            "success": True,
            "data": token_info
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch token price: {str(e)}")

@router.post("/calculate")
def calculate_value(request: Dict[str, Any]):
    """
    Calculate USD value for given amount and token
    """
    try:
        amount = request.get("amount")
        token_mint = request.get("token_mint")
        
        if not amount or not token_mint:
            raise HTTPException(400, "amount and token_mint are required")
        
        usd_value = calculate_usd_value(amount, token_mint)
        
        if usd_value is None:
            raise HTTPException(400, f"Could not calculate USD value for {token_mint}")
        
        return {
            "success": True,
            "data": {
                "amount": amount,
                "token_mint": token_mint,
                "usd_value": float(usd_value),
                "usd_value_formatted": f"${usd_value:.2f}"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to calculate value: {str(e)}")

@router.get("/supported")
def get_supported_tokens():
    """
    Get list of supported tokens
    """
    return {
        "success": True,
        "data": {
            "SOL": {
                "mint": "native",
                "symbol": "SOL",
                "name": "Solana",
                "decimals": 9,
                "coin_id": "solana"
            },
            "dUSDT": {
                "mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
                "symbol": "dUSDT", 
                "name": "Devnet Tether USD",
                "decimals": 6,
                "coin_id": "tether"
            },
            "dUSDC": {
                "mint": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
                "symbol": "dUSDC", 
                "name": "Devnet USD Coin",
                "decimals": 6,
                "coin_id": "usd-coin"
            }
        }
    }
