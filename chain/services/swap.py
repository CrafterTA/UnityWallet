import base64
import requests
from typing import Optional, Dict, Any, List
from decimal import Decimal, ROUND_DOWN, InvalidOperation
from fastapi import HTTPException
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.transaction import Transaction
from solders.message import MessageV0
from core.config import client, tx_opts
from services.solana import (
    valid_secret, valid_pub, resolve_token, balances_of, 
    get_recent_blockhash, submit_transaction
)
from models.schemas import TokenRef

# Jupiter API configuration
JUPITER_API_URL = "https://quote-api.jup.ag/v6/quote"
JUPITER_SWAP_URL = "https://quote-api.jup.ag/v6/swap"

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
    
    # Deserialize and sign transaction
    try:
        swap_transaction_bytes = base64.b64decode(swap_transaction_b64)
        transaction = Transaction.from_bytes(swap_transaction_bytes)
        
        # Sign transaction
        recent_blockhash = get_recent_blockhash()
        transaction.sign([kp], recent_blockhash)
    except Exception as e:
        # If deserialization fails, try alternative approach
        raise HTTPException(400, f"Failed to deserialize Jupiter transaction: {str(e)}")
    
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
    
    # Deserialize and sign transaction
    try:
        swap_transaction_bytes = base64.b64decode(swap_transaction_b64)
        transaction = Transaction.from_bytes(swap_transaction_bytes)
        
        # Sign transaction
        recent_blockhash = get_recent_blockhash()
        transaction.sign([kp], recent_blockhash)
    except Exception as e:
        # If deserialization fails, try alternative approach
        raise HTTPException(400, f"Failed to deserialize Jupiter transaction: {str(e)}")
    
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
