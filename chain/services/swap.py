import base64
import requests
import time
import hashlib
from typing import Optional, Dict, Any, List
from decimal import Decimal, ROUND_DOWN, InvalidOperation
from fastapi import HTTPException
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.transaction import Transaction
from solders.message import Message, MessageV0
from solders.instruction import Instruction, AccountMeta
from core.config import client, tx_opts
from services.solana import (
    valid_secret, valid_pub, resolve_token, balances_of, 
    get_recent_blockhash, submit_transaction
)
from services.prices import get_token_price, calculate_usd_value
from models.schemas import TokenRef

# Jupiter API configuration
JUPITER_API_URL = "https://quote-api.jup.ag/v6/quote"
JUPITER_SWAP_URL = "https://quote-api.jup.ag/v6/swap"

# Raydium configuration for devnet
RAYDIUM_DEVNET_POOLS = {
    "SOL_dUSDC": {
        "pool_id": "mock_pool_sol_dusdc",
        "base_mint": "So11111111111111111111111111111111111111112",  # SOL
        "quote_mint": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",  # dUSDC
        "base_decimals": 9,
        "quote_decimals": 6,
        "base_reserve": "1000000000000",  # 1000 SOL
        "quote_reserve": "200000000000",  # 200,000 dUSDC
    },
    "SOL_dUSDT": {
        "pool_id": "mock_pool_sol_dusdt",
        "base_mint": "So11111111111111111111111111111111111111112",  # SOL
        "quote_mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",  # dUSDT
        "base_decimals": 9,
        "quote_decimals": 6,
        "base_reserve": "1000000000000",  # 1000 SOL
        "quote_reserve": "180000000000",  # 180,000 dUSDT
    },
    "dUSDC_dUSDT": {
        "pool_id": "mock_pool_dusdc_dusdt",
        "base_mint": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",  # dUSDC
        "quote_mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",  # dUSDT
        "base_decimals": 6,
        "quote_decimals": 6,
        "base_reserve": "100000000000",  # 100,000 dUSDC
        "quote_reserve": "100000000000",  # 100,000 dUSDT
    }
}

# Devnet token mint addresses
DUSDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
DUSDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"

def _route_to_tokens_str(route: List[dict]) -> List[str]:
    """Convert Jupiter route to token mint strings"""
    out = []
    for r in route or []:
        if "mint" in r:
            out.append(r["mint"])
        elif "address" in r:
            out.append(r["address"])
    return out

def _validate_jupiter_route(route: Optional[List[dict]]) -> List[dict]:
    """Validate Jupiter route format"""
    if not route:
        return []
    
    validated_route = []
    for r in route:
        if not isinstance(r, dict):
            continue
        if "mint" in r or "address" in r:
            validated_route.append(r)
    
    return validated_route

def _to7(x: str | float | Decimal) -> str:
    try:
        d = Decimal(str(x))
    except (InvalidOperation, ValueError):
        d = Decimal("0")
    return str(d.quantize(Decimal("0.0000001"), rounding=ROUND_DOWN))

def _convert_ui_to_lamports(amount: str, token_ref: TokenRef) -> str:
    """Convert UI amount to lamports/smallest unit"""
    try:
        ui_amount = Decimal(amount)
        if token_ref.mint == "native":
            # SOL: 1 SOL = 1,000,000,000 lamports
            return str(int(ui_amount * Decimal("1000000000")))
        else:
            # SPL tokens: use decimals from token_ref
            decimals = token_ref.decimals or 6  # Default to 6 decimals
            multiplier = Decimal(10) ** decimals
            return str(int(ui_amount * multiplier))
    except (InvalidOperation, ValueError):
        return amount  # Return original if conversion fails

def _net_fee_fields() -> Dict[str, str]:
    """Get network fee information for Solana"""
    return {
        "network_fee_lamports": "5000",  # Base fee for Solana transaction
        "network_fee_sol": "0.000005",  # 5000 lamports = 0.000005 SOL
        "estimated_base_fee": "5000",
    }

def _get_jupiter_quote(
    input_mint: str, 
    output_mint: str, 
    amount: str, 
    slippage_bps: int = 200
) -> Dict[str, Any]:
    """Get quote from Jupiter API"""
    try:
        params = {
            "inputMint": input_mint,
            "outputMint": output_mint,
            "amount": amount,
            "slippageBps": slippage_bps,
        }
        
        response = requests.get(JUPITER_API_URL, params=params, timeout=30)
        if response.status_code != 200:
            raise HTTPException(400, f"Jupiter API error: {response.text}")
        
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(500, f"Failed to get Jupiter quote: {str(e)}")

def _get_jupiter_swap_transaction(
    quote_response: Dict[str, Any],
    user_public_key: str,
    slippage_bps: int = 200
) -> str:
    """Get swap transaction from Jupiter API"""
    try:
        payload = {
            "quoteResponse": quote_response,
            "userPublicKey": user_public_key,
            "slippageBps": slippage_bps,
        }
        
        response = requests.post(JUPITER_SWAP_URL, json=payload, timeout=30)
        if response.status_code != 200:
            raise HTTPException(400, f"Jupiter swap API error: {response.text}")
        
        swap_data = response.json()
        return swap_data["swapTransaction"]
    except requests.RequestException as e:
        raise HTTPException(500, f"Failed to get Jupiter swap transaction: {str(e)}")

# -------- Quotes --------
def quote_send(source_token: TokenRef, source_amount: str, dest_token: TokenRef,
               source_account: Optional[str] = None, slippage_bps: int = 200) -> Dict[str, Any]:
    """Get quote for sending tokens (exact input)"""
    try:
        # Convert UI amount to lamports/smallest unit
        converted_amount = _convert_ui_to_lamports(source_amount, source_token)
        
        # Convert native to SOL mint address
        input_mint = source_token.mint
        if input_mint == "native":
            input_mint = "So11111111111111111111111111111111111111112"
        
        output_mint = dest_token.mint
        if output_mint == "native":
            output_mint = "So11111111111111111111111111111111111111112"
        
        # Get quote from Jupiter
        quote_response = _get_jupiter_quote(
            input_mint=input_mint,
            output_mint=output_mint,
            amount=converted_amount,
            slippage_bps=slippage_bps
        )
        
        if not quote_response or "outAmount" not in quote_response:
            return {"found": False, "mode": "send"}
        
        # Convert outAmount from smallest units to UI units
        out_amount_raw = Decimal(quote_response["outAmount"])
        dest_decimals = dest_token.decimals or 6  # Default to 6 decimals for USDT
        dest_amt = out_amount_raw / (Decimal(10) ** dest_decimals)
        
        src_amt = Decimal(source_amount)
        implied_price = dest_amt / src_amt if src_amt > 0 else Decimal("0")
        
        slip = Decimal(slippage_bps) / Decimal(10_000)
        dest_min = dest_amt * (Decimal(1) - slip)
        
        # Calculate USD values
        source_usd_value = calculate_usd_value(_to7(src_amt), source_token.mint)
        dest_usd_value = calculate_usd_value(_to7(dest_amt), dest_token.mint)
        
        out = {
            "found": True,
            "mode": "send",
            "source_token": source_token.mint,
            "destination_token": dest_token.mint,
            "source_amount": _to7(src_amt),
            "destination_amount": _to7(dest_amt),
            "implied_price": _to7(implied_price),
            "implied_price_inverse": _to7(Decimal(1) / implied_price) if implied_price > 0 else "0",
            "slippage_bps": slippage_bps,
            "dest_min_suggest": _to7(dest_min),
            "source_max_suggest": None,
            "route_tokens": _route_to_tokens_str(quote_response.get("routePlan", [])),
            "usd_values": {
                "source_usd": float(source_usd_value) if source_usd_value else None,
                "dest_usd": float(dest_usd_value) if dest_usd_value else None,
                "source_usd_formatted": f"${source_usd_value:.2f}" if source_usd_value else "N/A",
                "dest_usd_formatted": f"${dest_usd_value:.2f}" if dest_usd_value else "N/A"
            },
            "raw": quote_response,
        }
        out.update(_net_fee_fields())
        out["execute_suggest"] = {
            "mode": "send",
            "source_amount": _to7(src_amt),
            "dest_min": _to7(dest_min),
            "route": quote_response.get("routePlan", [])
        }
        return out
    except Exception as e:
        raise HTTPException(500, f"Quote failed: {str(e)}")

def quote_receive(dest_token: TokenRef, dest_amount: str, source_token: TokenRef,
                  source_account: Optional[str] = None, slippage_bps: int = 200) -> Dict[str, Any]:
    """Get quote for receiving tokens (exact output)"""
    try:
        # Convert UI amount to lamports/smallest unit
        converted_dest_amount = _convert_ui_to_lamports(dest_amount, dest_token)
        
        # Convert native to SOL mint address
        input_mint = source_token.mint
        if input_mint == "native":
            input_mint = "So11111111111111111111111111111111111111112"
        
        output_mint = dest_token.mint
        if output_mint == "native":
            output_mint = "So11111111111111111111111111111111111111112"
        
        # For exact output, we need to estimate input amount
        # This is a simplified approach - in production you might want to use Jupiter's exact output API
        quote_response = _get_jupiter_quote(
            input_mint=input_mint,
            output_mint=output_mint,
            amount=converted_dest_amount,  # Using converted dest_amount as estimate
            slippage_bps=slippage_bps
        )
        
        if not quote_response or "inAmount" not in quote_response:
            return {"found": False, "mode": "receive"}
        
        # Convert inAmount from smallest units to UI units
        in_amount_raw = Decimal(quote_response["inAmount"])
        source_decimals = source_token.decimals or 9  # Default to 9 decimals for SOL
        src_amt = in_amount_raw / (Decimal(10) ** source_decimals)
        
        dst_amt = Decimal(dest_amount)
        implied_price = dst_amt / src_amt if src_amt > 0 else Decimal("0")
        
        slip = Decimal(slippage_bps) / Decimal(10_000)
        source_max = src_amt * (Decimal(1) + slip)
        
        out = {
            "found": True,
            "mode": "receive",
            "source_token": source_token.mint,
            "destination_token": dest_token.mint,
            "source_amount": _to7(src_amt),
            "destination_amount": _to7(dst_amt),
            "implied_price": _to7(implied_price),
            "implied_price_inverse": _to7(Decimal(1) / implied_price) if implied_price > 0 else "0",
            "slippage_bps": slippage_bps,
            "dest_min_suggest": None,
            "source_max_suggest": _to7(source_max),
            "route_tokens": _route_to_tokens_str(quote_response.get("routePlan", [])),
            "raw": quote_response,
        }
        out.update(_net_fee_fields())
        out["execute_suggest"] = {
            "mode": "receive",
            "dest_amount": _to7(dst_amt),
            "source_max": _to7(source_max),
            "route": quote_response.get("routePlan", [])
        }
        return out
    except Exception as e:
        raise HTTPException(500, f"Quote failed: {str(e)}")

# -------- Execute (ký ở BE cũ) --------
def exec_send(secret: str, destination: str,
              source_token: TokenRef, source_amount: str,
              dest_token: TokenRef, dest_min: str,
              route: Optional[List[dict]] = None) -> Dict[str, Any]:
    """Execute swap with exact input (backend signing)"""
    if not valid_secret(secret): 
        raise HTTPException(400, "Invalid secret")
    if not valid_pub(destination): 
        raise HTTPException(400, "Invalid destination")

    kp = Keypair.from_base58_string(secret)
    
    # Convert UI amount to lamports/smallest unit
    converted_amount = _convert_ui_to_lamports(source_amount, source_token)
    
    # Convert native to SOL mint address
    input_mint = source_token.mint
    if input_mint == "native":
        input_mint = "So11111111111111111111111111111111111111112"
    
    output_mint = dest_token.mint
    if output_mint == "native":
        output_mint = "So11111111111111111111111111111111111111112"
    
    # Get quote first
    quote_response = _get_jupiter_quote(
        input_mint=input_mint,
        output_mint=output_mint,
        amount=converted_amount,
        slippage_bps=200
    )
    
    if not quote_response:
        raise HTTPException(400, "No route found for swap")
    
    # Get swap transaction from Jupiter
    swap_transaction_b64 = _get_jupiter_swap_transaction(
        quote_response=quote_response,
        user_public_key=str(kp.pubkey()),
        slippage_bps=200
    )
    
    # Deserialize and sign transaction (Jupiter transaction is unsigned)
    try:
        swap_transaction_bytes = base64.b64decode(swap_transaction_b64)
        transaction = Transaction.from_bytes(swap_transaction_bytes)
        
        # Jupiter transaction is unsigned, need to sign with user's keypair
        recent_blockhash = get_recent_blockhash()
        transaction.sign([kp], recent_blockhash)
            
    except Exception as e:
        raise HTTPException(400, f"Failed to deserialize or sign Jupiter transaction: {str(e)}")
    
    # Submit transaction
    result = submit_transaction(transaction)
    
    return {
        "signature": result["signature"],
        "transaction": result["transaction"],
        "balances": balances_of(str(kp.pubkey())),
        "explorer_link": result.get("explorer_link"),
        "solscan_link": result.get("solscan_link")
    }

def exec_receive(secret: str, destination: str,
                 dest_token: TokenRef, dest_amount: str,
                 source_token: TokenRef, source_max: str,
                 route: Optional[List[dict]] = None) -> Dict[str, Any]:
    """Execute swap with exact output (backend signing)"""
    if not valid_secret(secret): 
        raise HTTPException(400, "Invalid secret")
    if not valid_pub(destination): 
        raise HTTPException(400, "Invalid destination")

    kp = Keypair.from_base58_string(secret)
    
    # Convert UI amount to lamports/smallest unit
    converted_dest_amount = _convert_ui_to_lamports(dest_amount, dest_token)
    
    # Convert native to SOL mint address
    input_mint = source_token.mint
    if input_mint == "native":
        input_mint = "So11111111111111111111111111111111111111112"
    
    output_mint = dest_token.mint
    if output_mint == "native":
        output_mint = "So11111111111111111111111111111111111111112"
    
    # Get quote first (simplified approach)
    quote_response = _get_jupiter_quote(
        input_mint=input_mint,
        output_mint=output_mint,
        amount=converted_dest_amount,  # Using converted dest_amount as estimate
        slippage_bps=200
    )
    
    if not quote_response:
        raise HTTPException(400, "No route found for swap")
    
    # Get swap transaction from Jupiter
    swap_transaction_b64 = _get_jupiter_swap_transaction(
        quote_response=quote_response,
        user_public_key=str(kp.pubkey()),
        slippage_bps=200
    )
    
    # Deserialize and sign transaction (Jupiter transaction is unsigned)
    try:
        swap_transaction_bytes = base64.b64decode(swap_transaction_b64)
        transaction = Transaction.from_bytes(swap_transaction_bytes)
        
        # Jupiter transaction is unsigned, need to sign with user's keypair
        recent_blockhash = get_recent_blockhash()
        transaction.sign([kp], recent_blockhash)
            
    except Exception as e:
        raise HTTPException(400, f"Failed to deserialize or sign Jupiter transaction: {str(e)}")
    
    # Submit transaction
    result = submit_transaction(transaction)
    
    return {
        "signature": result["signature"],
        "transaction": result["transaction"],
        "balances": balances_of(str(kp.pubkey())),
        "explorer_link": result.get("explorer_link"),
        "solscan_link": result.get("solscan_link")
    }

# -------- NEW: build Transaction (ký ở FE) --------
def build_path_send_transaction(source_public: str, destination: str,
                               source_token: TokenRef, source_amount: str,
                               dest_token: TokenRef, dest_min: str,
                               route: Optional[List[dict]] = None) -> str:
    """Build unsigned swap transaction for frontend signing (exact input)"""
    if not valid_pub(source_public): 
        raise HTTPException(400, "Invalid source_public")
    if not valid_pub(destination): 
        raise HTTPException(400, "Invalid destination")
    
    # Convert UI amount to lamports/smallest unit
    converted_amount = _convert_ui_to_lamports(source_amount, source_token)
    
    # Convert native to SOL mint address
    input_mint = source_token.mint
    if input_mint == "native":
        input_mint = "So11111111111111111111111111111111111111112"
    
    output_mint = dest_token.mint
    if output_mint == "native":
        output_mint = "So11111111111111111111111111111111111111112"
    
    # Get quote first
    quote_response = _get_jupiter_quote(
        input_mint=input_mint,
        output_mint=output_mint,
        amount=converted_amount,
        slippage_bps=200
    )
    
    if not quote_response:
        raise HTTPException(400, "No route found for swap")
    
    # Get swap transaction from Jupiter
    swap_transaction_b64 = _get_jupiter_swap_transaction(
        quote_response=quote_response,
        user_public_key=source_public,
        slippage_bps=200
    )
    
    # Return the unsigned transaction (base64 encoded)
    return swap_transaction_b64

def build_path_receive_transaction(source_public: str, destination: str,
                                  dest_token: TokenRef, dest_amount: str,
                                  source_token: TokenRef, source_max: str,
                                  route: Optional[List[dict]] = None) -> str:
    """Build unsigned swap transaction for frontend signing (exact output)"""
    if not valid_pub(source_public): 
        raise HTTPException(400, "Invalid source_public")
    if not valid_pub(destination): 
        raise HTTPException(400, "Invalid destination")
    
    # Convert UI amount to lamports/smallest unit
    converted_dest_amount = _convert_ui_to_lamports(dest_amount, dest_token)
    
    # Convert native to SOL mint address
    input_mint = source_token.mint
    if input_mint == "native":
        input_mint = "So11111111111111111111111111111111111111112"
    
    output_mint = dest_token.mint
    if output_mint == "native":
        output_mint = "So11111111111111111111111111111111111111112"
    
    # Get quote first (simplified approach)
    quote_response = _get_jupiter_quote(
        input_mint=input_mint,
        output_mint=output_mint,
        amount=converted_dest_amount,  # Using converted dest_amount as estimate
        slippage_bps=200
    )
    
    if not quote_response:
        raise HTTPException(400, "No route found for swap")
    
    # Get swap transaction from Jupiter
    swap_transaction_b64 = _get_jupiter_swap_transaction(
        quote_response=quote_response,
        user_public_key=source_public,
        slippage_bps=200
    )
    
    # Return the unsigned transaction (base64 encoded)
    return swap_transaction_b64
# ===== RAYDIUM FUNCTIONS FOR DEVNET =====

def _find_raydium_pool(source_mint: str, dest_mint: str) -> Optional[Dict[str, Any]]:
    """Find appropriate Raydium pool for token pair"""
    # Normalize mints
    if source_mint == "native":
        source_mint = "So11111111111111111111111111111111111111112"
    if dest_mint == "native":
        dest_mint = "So11111111111111111111111111111111111111112"
    
    # Check direct pools
    for pool_name, pool_info in RAYDIUM_DEVNET_POOLS.items():
        if (pool_info["base_mint"] == source_mint and pool_info["quote_mint"] == dest_mint) or \
           (pool_info["base_mint"] == dest_mint and pool_info["quote_mint"] == source_mint):
            return pool_info
    
    return None

def _get_rate_string(source_mint: str, dest_mint: str) -> str:
    """Get rate string for token pair using real market prices when available"""
    # Get real market prices from CoinGecko
    source_price = get_token_price(source_mint)
    dest_price = get_token_price(dest_mint)
    
    if source_price and dest_price:
        # Use real market prices
        market_rate = float(source_price) / float(dest_price)
        
        if source_mint == "native" and dest_mint == DUSDC_MINT:
            return f"1 SOL = {market_rate:.2f} dUSDC (Real Market Rate)"
        elif source_mint == "native" and dest_mint == DUSDT_MINT:
            return f"1 SOL = {market_rate:.2f} dUSDT (Real Market Rate)"
        elif source_mint == DUSDC_MINT and dest_mint == DUSDT_MINT:
            return f"1 dUSDC = {market_rate:.2f} dUSDT (Real Market Rate)"
        elif source_mint == DUSDT_MINT and dest_mint == DUSDC_MINT:
            return f"1 dUSDT = {1/market_rate:.2f} dUSDC (Real Market Rate)"
        elif source_mint == DUSDC_MINT and dest_mint == "native":
            return f"{market_rate:.2f} dUSDC = 1 SOL (Real Market Rate)"
        elif source_mint == DUSDT_MINT and dest_mint == "native":
            return f"{market_rate:.2f} dUSDT = 1 SOL (Real Market Rate)"
        else:
            return f"1:100 (Real Market Rate: {market_rate:.2f})"
    else:
        # Fallback to mock rates
        if source_mint == "native" and dest_mint == DUSDC_MINT:
            return "1 SOL = 200 dUSDC (Mock Rate)"
        elif source_mint == "native" and dest_mint == DUSDT_MINT:
            return "1 SOL = 180 dUSDT (Mock Rate)"
        elif source_mint == DUSDC_MINT and dest_mint == DUSDT_MINT:
            return "1 dUSDC = 1 dUSDT (Mock Rate)"
        elif source_mint == DUSDT_MINT and dest_mint == DUSDC_MINT:
            return "1 dUSDT = 1 dUSDC (Mock Rate)"
        elif source_mint == DUSDC_MINT and dest_mint == "native":
            return "200 dUSDC = 1 SOL (Mock Rate)"
        elif source_mint == DUSDT_MINT and dest_mint == "native":
            return "180 dUSDT = 1 SOL (Mock Rate)"
        else:
            return "1:100 (Mock Rate)"

def _get_raydium_quote(
    input_mint: str,
    output_mint: str, 
    amount: str,
    pool_info: Dict[str, Any]
) -> Dict[str, Any]:
    """Get quote from Raydium pool using real market prices when available"""
    try:
        # Get real market prices from CoinGecko
        input_price = get_token_price(input_mint)
        output_price = get_token_price(output_mint)
        
        input_amount = float(amount)
        
        # Use real market prices if available
        if input_price and output_price:
            # Calculate rate based on real market prices
            market_rate = float(input_price) / float(output_price)
            
            # Apply market rate to calculate output (in UI amounts)
            output_amount_ui = input_amount * market_rate
            
            # Apply 0.3% fee (Raydium standard)
            fee_ui = output_amount_ui * 0.003
            output_amount_ui -= fee_ui
            
            # Convert to raw amounts for return
            if input_mint == "native":
                input_amount_raw = int(input_amount * 1_000_000_000)
            else:
                input_amount_raw = int(input_amount * 1_000_000)
                
            if output_mint == "native":
                output_amount_raw = int(output_amount_ui * 1_000_000_000)
            else:
                output_amount_raw = int(output_amount_ui * 1_000_000)
            
            return {
                "inputAmount": str(input_amount_raw),
                "outputAmount": str(output_amount_raw),
                "priceImpact": "0.1",  # Mock price impact
                "fee": str(int(fee_ui * 1_000_000)),  # Convert fee to raw
                "poolId": pool_info["pool_id"],
                "market_rate": market_rate,
                "using_real_prices": True,
                "input_price_usd": float(input_price),
                "output_price_usd": float(output_price),
                "output_amount_ui": output_amount_ui
            }
        else:
            # Fallback to AMM calculation if prices not available
            if input_mint == pool_info["base_mint"]:
                # Swapping base to quote
                base_reserve = float(pool_info["base_reserve"])
                quote_reserve = float(pool_info["quote_reserve"])
                
                # Calculate output using constant product formula
                # output = (input * quote_reserve) / (base_reserve + input)
                output_amount = (input_amount * quote_reserve) / (base_reserve + input_amount)
                
                # Apply 0.3% fee (Raydium standard)
                fee = output_amount * 0.003
                output_amount -= fee
                
            else:
                # Swapping quote to base
                base_reserve = float(pool_info["base_reserve"])
                quote_reserve = float(pool_info["quote_reserve"])
                
                # Calculate output using constant product formula
                output_amount = (input_amount * base_reserve) / (quote_reserve + input_amount)
                
                # Apply 0.3% fee
                fee = output_amount * 0.003
                output_amount -= fee
            
            return {
                "inputAmount": str(int(input_amount)),
                "outputAmount": str(int(output_amount)),
                "priceImpact": "0.1",  # Mock price impact
                "fee": str(int(fee)),
                "poolId": pool_info["pool_id"],
                "using_real_prices": False
            }
        
    except Exception as e:
        raise HTTPException(500, f"Raydium quote calculation failed: {str(e)}")

def _create_sol_transfer_transaction(
    kp: Keypair,
    destination: str,
    amount_lamports: int
) -> Transaction:
    """Create a real SOL transfer transaction for devnet"""
    try:
        # Create transfer instruction
        system_program_id = Pubkey.from_string("11111111111111111111111111111111")
        
        # System program transfer instruction data: [2, 0, 0, 0] + 8-byte lamports
        instruction_data = bytes([2, 0, 0, 0]) + amount_lamports.to_bytes(8, 'little')
        
        transfer_ix = Instruction(
            program_id=system_program_id,
            accounts=[
                AccountMeta(pubkey=kp.pubkey(), is_signer=True, is_writable=True),
                AccountMeta(pubkey=Pubkey.from_string(destination), is_signer=False, is_writable=True),
            ],
            data=instruction_data
        )
        
        # Build transaction
        recent_blockhash = get_recent_blockhash()
        message = Message.new_with_blockhash(
            instructions=[transfer_ix],
            payer=kp.pubkey(),
            blockhash=recent_blockhash
        )
        
        # Create unsigned transaction
        transaction = Transaction.new_unsigned(message)
        transaction.sign([kp], recent_blockhash)
        
        return transaction
        
    except Exception as e:
        raise HTTPException(500, f"Failed to create SOL transfer transaction: {str(e)}")

def _mock_raydium_execution(
    kp: Keypair,
    source_token: TokenRef,
    source_amount: str,
    dest_token: TokenRef,
    dest_min: str,
    mode: str = "send"
) -> Dict[str, Any]:
    """Mock Raydium execution for devnet testing"""
    
    # Generate a mock signature
    mock_data = f"{str(kp.pubkey())}{source_amount}{int(time.time())}"
    mock_signature = hashlib.sha256(mock_data.encode()).hexdigest()[:64]
    
    # Get current balances
    current_balances = balances_of(str(kp.pubkey()))
    
    # Calculate balance changes using real market prices when available
    source_amount_float = float(source_amount)
    
    # Get real market prices from CoinGecko
    source_price = get_token_price(source_token.mint)
    dest_price = get_token_price(dest_token.mint)
    
    if mode == "send":
        # For send mode: calculate destination amount
        if source_price and dest_price:
            # Use real market prices
            market_rate = float(source_price) / float(dest_price)
            dest_amount_float = source_amount_float * market_rate
        else:
            # Fallback to mock rates
            if source_token.mint == "native" and dest_token.mint == DUSDC_MINT:
                # Mock rate: 1 SOL = 200 dUSDC
                dest_amount_float = source_amount_float * 200.0
            elif source_token.mint == "native" and dest_token.mint == DUSDT_MINT:
                # Mock rate: 1 SOL = 180 dUSDT
                dest_amount_float = source_amount_float * 180.0
            elif source_token.mint == DUSDC_MINT and dest_token.mint == DUSDT_MINT:
                # Mock rate: 1 dUSDC = 1 dUSDT (1:1)
                dest_amount_float = source_amount_float * 1.0
            else:
                # Generic mock rate: 1:100
                dest_amount_float = source_amount_float * 100.0
    else:
        # For receive mode: calculate source amount
        dest_amount_float = float(dest_min)  # dest_min is actually dest_amount in receive mode
        if source_price and dest_price:
            # Use real market prices
            market_rate = float(source_price) / float(dest_price)
            source_amount_float = dest_amount_float / market_rate
        else:
            # Fallback to mock rates
            if source_token.mint == "native" and dest_token.mint == DUSDC_MINT:
                # Mock rate: 1 SOL = 200 dUSDC
                source_amount_float = dest_amount_float / 200.0
            elif source_token.mint == "native" and dest_token.mint == DUSDT_MINT:
                # Mock rate: 1 SOL = 180 dUSDT
                source_amount_float = dest_amount_float / 180.0
            elif source_token.mint == DUSDC_MINT and dest_token.mint == DUSDT_MINT:
                # Mock rate: 1 dUSDC = 1 dUSDT (1:1)
                source_amount_float = dest_amount_float / 1.0
            else:
                # Generic mock rate: 1:100
                source_amount_float = dest_amount_float / 100.0
    
    # Update balances (mock) - use deep copy to avoid modifying original
    import copy
    updated_balances = copy.deepcopy(current_balances)
    
    if source_token.mint == "native":
        # Reduce SOL balance
        current_sol = float(updated_balances["SOL"]["balance_ui"])
        new_sol = current_sol - source_amount_float
        updated_balances["SOL"]["balance_ui"] = str(max(0, new_sol))
        updated_balances["SOL"]["balance"] = str(int(max(0, new_sol) * 1_000_000_000))
    
    if dest_token.mint == DUSDC_MINT:
        # Increase dUSDC balance
        current_dusdc = float(updated_balances["dUSDC"]["balance_ui"])
        new_dusdc = current_dusdc + dest_amount_float
        updated_balances["dUSDC"]["balance_ui"] = str(new_dusdc)
        updated_balances["dUSDC"]["balance"] = str(int(new_dusdc * 1_000_000))
    elif dest_token.mint == DUSDT_MINT:
        # Increase dUSDT balance
        current_dusdt = float(updated_balances["dUSDT"]["balance_ui"])
        new_dusdt = current_dusdt + dest_amount_float
        updated_balances["dUSDT"]["balance_ui"] = str(new_dusdt)
        updated_balances["dUSDT"]["balance"] = str(int(new_dusdt * 1_000_000))
    
    return {
        "signature": mock_signature,
        "transaction": "mock_raydium_transaction_for_devnet",
        "balances": updated_balances,
        "explorer_link": f"https://explorer.solana.com/tx/{mock_signature}?cluster=devnet",
        "solscan_link": f"https://solscan.io/tx/{mock_signature}?cluster=devnet",
        "solanafm_link": f"https://solana.fm/tx/{mock_signature}?cluster=devnet",
        "beach_link": f"https://solanabeach.io/transaction/{mock_signature}",
        "raydium_mode": True,
        "note": "Mock Raydium execution for devnet testing",
        "swap_details": {
            "mode": mode,
            "source_amount": source_amount,
            "dest_amount": str(dest_amount_float),
            "dex": "Raydium",
            "pool_id": _find_raydium_pool(source_token.mint, dest_token.mint)["pool_id"] if _find_raydium_pool(source_token.mint, dest_token.mint) else "unknown",
            "rate": _get_rate_string(source_token.mint, dest_token.mint)
        }
    }

def exec_real_sol_transfer_devnet(
    secret: str,
    destination: str,
    amount: str
) -> Dict[str, Any]:
    """Execute real SOL transfer on devnet for testing"""
    if not valid_secret(secret):
        raise HTTPException(400, "Invalid secret")
    if not valid_pub(destination):
        raise HTTPException(400, "Invalid destination")

    kp = Keypair.from_base58_string(secret)
    
    try:
        # Convert amount to lamports
        amount_float = float(amount)
        amount_lamports = int(amount_float * 1_000_000_000)
        
        # Create real SOL transfer transaction
        transaction = _create_sol_transfer_transaction(kp, destination, amount_lamports)
        
        # Submit real transaction to devnet
        result = submit_transaction(transaction)
        
        # Get updated balances
        from services.solana import balances_of_with_retry
        updated_balances = balances_of_with_retry(str(kp.pubkey()), max_retries=3, delay=2.0)
        
        return {
            "signature": result["signature"],
            "transaction": result["transaction"],
            "balances": updated_balances,
            "explorer_link": result.get("explorer_link"),
            "solscan_link": result.get("solscan_link"),
            "solanafm_link": f"https://solana.fm/tx/{result['signature']}?cluster=devnet",
            "beach_link": f"https://solanabeach.io/transaction/{result['signature']}",
            "real_transaction": True,
            "note": "Real SOL transfer submitted to Solana devnet",
            "transfer_details": {
                "amount": amount,
                "amount_lamports": amount_lamports,
                "from": str(kp.pubkey()),
                "to": destination
            }
        }
        
    except Exception as e:
        raise HTTPException(500, f"Real SOL transfer failed: {str(e)}")

def quote_send_raydium(
    source_token: TokenRef,
    source_amount: str,
    dest_token: TokenRef,
    source_account: Optional[str] = None,
    slippage_bps: int = 200
) -> Dict[str, Any]:
    """Get Raydium quote for devnet (send mode)"""
    
    source_amount_float = float(source_amount)
    
    # Find appropriate pool for token pair
    pool_info = _find_raydium_pool(source_token.mint, dest_token.mint)
    if not pool_info:
        raise HTTPException(400, f"No Raydium pool found for {source_token.mint} -> {dest_token.mint} on devnet")
    
    # Determine input/output mints
    if source_token.mint == "native":
        input_mint = pool_info["base_mint"]
        output_mint = pool_info["quote_mint"]
    else:
        input_mint = pool_info["quote_mint"]
        output_mint = pool_info["base_mint"]
    
    # Get quote from Raydium (pass UI amount, let _get_raydium_quote handle conversion)
    quote_response = _get_raydium_quote(input_mint, output_mint, source_amount, pool_info)
    
    # Convert output back to UI units
    if "output_amount_ui" in quote_response:
        # Use pre-calculated UI amount if available
        dest_amount_float = quote_response["output_amount_ui"]
    else:
        # Fallback to raw amount conversion
        if dest_token.mint == "native":
            dest_amount_float = float(quote_response["outputAmount"]) / 1_000_000_000  # SOL from lamports
        else:
            dest_amount_float = float(quote_response["outputAmount"]) / (10 ** (dest_token.decimals or 6))
    
    # Apply slippage
    slip = float(slippage_bps) / 10000.0
    dest_min = dest_amount_float * (1.0 - slip)
    
    return {
        "found": True,
        "mode": "send",
        "source_token": source_token.mint,
        "destination_token": dest_token.mint,
        "source_amount": str(source_amount_float),
        "destination_amount": str(dest_amount_float),
        "implied_price": str(dest_amount_float / source_amount_float),
        "implied_price_inverse": str(source_amount_float / dest_amount_float),
        "slippage_bps": slippage_bps,
        "dest_min_suggest": str(dest_min),
        "source_max_suggest": None,
        "route_tokens": [input_mint, output_mint],
        "usd_values": {
            "source_usd": None,
            "dest_usd": None,
            "source_usd_formatted": "N/A",
            "dest_usd_formatted": "N/A"
        },
        "raw": {
            "raydium": True,
            "pool_id": pool_info["pool_id"],
            "input_amount": quote_response["inputAmount"],
            "output_amount": quote_response["outputAmount"],
            "fee": quote_response["fee"],
            "price_impact": quote_response["priceImpact"]
        },
        "network_fee_lamports": "5000",
        "network_fee_sol": "0.000005",
        "estimated_base_fee": "5000",
        "execute_suggest": {
            "mode": "send",
            "source_amount": str(source_amount_float),
            "dest_min": str(dest_min),
            "route": [{"mint": input_mint}, {"mint": output_mint}]
        },
        "raydium_mode": True,
        "note": "Raydium quote for devnet testing with dUSDC"
    }

def quote_receive_raydium(
    dest_token: TokenRef,
    dest_amount: str,
    source_token: TokenRef,
    source_account: Optional[str] = None,
    slippage_bps: int = 200
) -> Dict[str, Any]:
    """Get Raydium quote for devnet (receive mode)"""
    
    dest_amount_float = float(dest_amount)
    
    # Find appropriate pool for token pair
    pool_info = _find_raydium_pool(source_token.mint, dest_token.mint)
    if not pool_info:
        raise HTTPException(400, f"No Raydium pool found for {source_token.mint} -> {dest_token.mint} on devnet")
    
    # Convert to smallest units
    if dest_token.mint == "native":
        output_mint = pool_info["base_mint"]
        input_mint = pool_info["quote_mint"]
        output_amount = str(int(dest_amount_float * 1_000_000_000))  # SOL to lamports
    else:
        output_mint = pool_info["quote_mint"]
        input_mint = pool_info["base_mint"]
        output_amount = str(int(dest_amount_float * (10 ** (dest_token.decimals or 6))))
    
    # Get quote from Raydium (reverse calculation)
    quote_response = _get_raydium_quote(input_mint, output_mint, output_amount, pool_info)
    
    # Convert input back to UI units
    if source_token.mint == "native":
        source_amount_float = float(quote_response["inputAmount"]) / 1_000_000_000  # SOL from lamports
    else:
        source_amount_float = float(quote_response["inputAmount"]) / (10 ** (source_token.decimals or 6))
    
    # Apply slippage
    slip = float(slippage_bps) / 10000.0
    source_max = source_amount_float * (1.0 + slip)
    
    return {
        "found": True,
        "mode": "receive",
        "source_token": source_token.mint,
        "destination_token": dest_token.mint,
        "source_amount": str(source_amount_float),
        "destination_amount": str(dest_amount_float),
        "implied_price": str(dest_amount_float / source_amount_float),
        "implied_price_inverse": str(source_amount_float / dest_amount_float),
        "slippage_bps": slippage_bps,
        "dest_min_suggest": None,
        "source_max_suggest": str(source_max),
        "route_tokens": [input_mint, output_mint],
        "usd_values": {
            "source_usd": None,
            "dest_usd": None,
            "source_usd_formatted": "N/A",
            "dest_usd_formatted": "N/A"
        },
        "raw": {
            "raydium": True,
            "pool_id": pool_info["pool_id"],
            "input_amount": quote_response["inputAmount"],
            "output_amount": quote_response["outputAmount"],
            "fee": quote_response["fee"],
            "price_impact": quote_response["priceImpact"]
        },
        "network_fee_lamports": "5000",
        "network_fee_sol": "0.000005",
        "estimated_base_fee": "5000",
        "execute_suggest": {
            "mode": "receive",
            "dest_amount": str(dest_amount_float),
            "source_max": str(source_max),
            "route": [{"mint": input_mint}, {"mint": output_mint}]
        },
        "raydium_mode": True,
        "note": "Raydium quote for devnet testing with dUSDC"
    }

def exec_send_raydium(
    secret: str,
    destination: str,
    source_token: TokenRef,
    source_amount: str,
    dest_token: TokenRef,
    dest_min: str,
    route: Optional[list] = None
) -> Dict[str, Any]:
    """Execute Raydium swap for devnet (send mode)"""
    if not valid_secret(secret):
        raise HTTPException(400, "Invalid secret")
    if not valid_pub(destination):
        raise HTTPException(400, "Invalid destination")

    kp = Keypair.from_base58_string(secret)
    
    # Use mock Raydium execution for devnet
    return _mock_raydium_execution(kp, source_token, source_amount, dest_token, dest_min, "send")

def exec_receive_raydium(
    secret: str,
    destination: str,
    dest_token: TokenRef,
    dest_amount: str,
    source_token: TokenRef,
    source_max: str,
    route: Optional[list] = None
) -> Dict[str, Any]:
    """Execute Raydium swap for devnet (receive mode)"""
    if not valid_secret(secret):
        raise HTTPException(400, "Invalid secret")
    if not valid_pub(destination):
        raise HTTPException(400, "Invalid destination")

    kp = Keypair.from_base58_string(secret)
    
    # Use mock Raydium execution for devnet
    return _mock_raydium_execution(kp, source_token, source_max, dest_token, dest_amount, "receive")
