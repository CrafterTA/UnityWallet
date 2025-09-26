import requests
import time
from typing import Dict, Any, Optional
from fastapi import HTTPException
from decimal import Decimal

# CoinGecko API configuration
COINGECKO_API_URL = "https://api.coingecko.com/api/v3"
COINGECKO_SIMPLE_PRICE_URL = f"{COINGECKO_API_URL}/simple/price"

# Token mappings
TOKEN_MAPPINGS = {
    "native": "solana",  # SOL
    "So11111111111111111111111111111111111111112": "solana",  # SOL mint
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": "tether",  # dUSDT
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU": "usd-coin",  # dUSDC
}

# Cache for prices
CACHE_DURATION = 60  # Cache for 60 seconds

class PriceCache:
    def __init__(self):
        self.cache = {}
        self.timestamp = 0
    
    def is_valid(self):
        import time
        return (time.time() - self.timestamp) < CACHE_DURATION
    
    def update(self, prices):
        import time
        self.cache = prices
        self.timestamp = time.time()

# Global cache instance
_price_cache = PriceCache()

def get_token_price(token_mint: str) -> Optional[Decimal]:
    """
    Get token price from CoinGecko
    """
    coin_id = TOKEN_MAPPINGS.get(token_mint)
    if not coin_id:
        return None
    
    # Check cache first
    if _price_cache.is_valid() and coin_id in _price_cache.cache:
        return _price_cache.cache[coin_id]
    
    try:
        # Fetch price from CoinGecko
        params = {
            "ids": coin_id,
            "vs_currencies": "usd",
            "include_24hr_change": "true"
        }
        
        response = requests.get(COINGECKO_SIMPLE_PRICE_URL, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if coin_id in data:
            price_data = data[coin_id]
            price = Decimal(str(price_data.get("usd", 0)))
            
            # Update cache
            _price_cache.cache[coin_id] = price
            _price_cache.timestamp = time.time()
            
            return price
        
        return None
        
    except requests.RequestException as e:
        # Return cached price if available, otherwise None
        return _price_cache.cache.get(coin_id)
    except Exception as e:
        return _price_cache.cache.get(coin_id)

def get_all_prices() -> Dict[str, Any]:
    """
    Get all supported token prices
    """
    # Check if cache is still valid
    if _price_cache.is_valid() and _price_cache.cache:
        return {
            "prices": _price_cache.cache,
            "timestamp": _price_cache.timestamp,
            "cached": True
        }
    
    try:
        # Fetch all prices
        coin_ids = list(TOKEN_MAPPINGS.values())
        params = {
            "ids": ",".join(coin_ids),
            "vs_currencies": "usd",
            "include_24hr_change": "true"
        }
        
        response = requests.get(COINGECKO_SIMPLE_PRICE_URL, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Update cache
        new_prices = {}
        for coin_id, price_data in data.items():
            if "usd" in price_data:
                new_prices[coin_id] = Decimal(str(price_data["usd"]))
        
        _price_cache.update(new_prices)
        
        return {
            "prices": _price_cache.cache,
            "timestamp": _price_cache.timestamp,
            "cached": False
        }
        
    except requests.RequestException as e:
        return {
            "prices": _price_cache.cache,
            "timestamp": _price_cache.timestamp,
            "cached": True,
            "error": f"Failed to fetch prices: {str(e)}"
        }
    except Exception as e:
        return {
            "prices": _price_cache.cache,
            "timestamp": _price_cache.timestamp,
            "cached": True,
            "error": f"Unexpected error: {str(e)}"
        }

def get_token_info(token_mint: str) -> Dict[str, Any]:
    """
    Get comprehensive token information including price
    """
    coin_id = TOKEN_MAPPINGS.get(token_mint)
    if not coin_id:
        return {
            "mint": token_mint,
            "supported": False,
            "error": "Token not supported"
        }
    
    price = get_token_price(token_mint)
    
    # Get additional info
    token_info = {
        "mint": token_mint,
        "coin_id": coin_id,
        "supported": True,
        "price_usd": float(price) if price else None,
        "price_formatted": f"${price:.6f}" if price else "N/A"
    }
    
    # Add token-specific info
    if token_mint == "native" or token_mint == "So11111111111111111111111111111111111111112":
        token_info.update({
            "symbol": "SOL",
            "name": "Solana",
            "decimals": 9
        })
    elif token_mint == "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB":
        token_info.update({
            "symbol": "dUSDT",
            "name": "Devnet Tether USD",
            "decimals": 6
        })
    elif token_mint == "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU":
        token_info.update({
            "symbol": "dUSDC",
            "name": "Devnet USD Coin",
            "decimals": 6
        })
    
    return token_info

def calculate_usd_value(amount: str, token_mint: str) -> Optional[Decimal]:
    """
    Calculate USD value for a given amount of token
    """
    try:
        amount_decimal = Decimal(amount)
        price = get_token_price(token_mint)
        
        if price is None:
            return None
        
        return amount_decimal * price
        
    except Exception:
        return None

def get_price_change_24h(token_mint: str) -> Optional[float]:
    """
    Get 24h price change percentage
    """
    coin_id = TOKEN_MAPPINGS.get(token_mint)
    if not coin_id:
        return None
    
    try:
        params = {
            "ids": coin_id,
            "vs_currencies": "usd",
            "include_24hr_change": "true"
        }
        
        response = requests.get(COINGECKO_SIMPLE_PRICE_URL, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if coin_id in data and "usd_24h_change" in data[coin_id]:
            return data[coin_id]["usd_24h_change"]
        
        return None
        
    except Exception:
        return None
