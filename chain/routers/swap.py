import base64
import time
from fastapi import APIRouter, HTTPException
from solders.keypair import Keypair
from solders.transaction import Transaction
from models.schemas import (
    QuoteBody, QuoteSendReq, QuoteReceiveReq,
    ExecuteSwapReq, TokenRef,
    SwapBeginBody, SwapBeginSendReq, SwapBeginReceiveReq, SubmitSignedTransactionReq
)
from services.swap import (
    quote_send, quote_receive, exec_send, exec_receive,
    build_path_send_transaction, build_path_receive_transaction,
    quote_send_raydium, quote_receive_raydium, exec_send_raydium, exec_receive_raydium,
    exec_real_sol_transfer_devnet
)
from services.solana import (
    valid_pub, balances_of, balances_of_with_retry, submit_transaction,
    get_balance, get_token_balance, account_exists, valid_secret
)
from core.config import client, tx_opts

router = APIRouter(prefix="/swap", tags=["swap"])

def _is_devnet() -> bool:
    """Check if we're running on devnet"""
    try:
        # Try to get a simple account info to determine network
        from core.config import RPC_URL
        return "devnet" in RPC_URL.lower()
    except:
        return False

@router.get("/network-status")
def get_network_status():
    """Get current network status and supported DEX information"""
    is_devnet = _is_devnet()
    
    if is_devnet:
        return {
            "network": "devnet",
            "supported_dex": "Raydium",
            "jupiter_support": False,
            "note": "Jupiter API does not support devnet. Using Raydium with USDC/USDT for devnet testing.",
            "features": {
                "real_swap": True,
                "raydium_swap": True,
                "quote_support": True,
                "execute_support": True
            },
                   "supported_tokens": {
                       "SOL": "So11111111111111111111111111111111111111112",
                       "USDC": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
                       "USDT": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
                   },
            "raydium_pools": {
                "SOL_USDC": {
                    "pool_id": "mock_pool_sol_usdc",
                    "base_mint": "So11111111111111111111111111111111111111112",
                    "quote_mint": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
                    "rate": "1 SOL = 200 USDC"
                },
                "SOL_USDT": {
                    "pool_id": "mock_pool_sol_usdt",
                    "base_mint": "So11111111111111111111111111111111111111112",
                    "quote_mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
                    "rate": "1 SOL = 180 USDT"
                },
                "USDC_USDT": {
                    "pool_id": "mock_pool_usdc_usdt",
                    "base_mint": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
                    "quote_mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
                    "rate": "1 USDC = 1 USDT"
                }
            }
        }
    else:
        return {
            "network": "mainnet",
            "supported_dex": "Jupiter",
            "jupiter_support": True,
            "note": "Full Jupiter API support available for real swaps.",
            "features": {
                "real_swap": True,
                "mock_swap": False,
                "quote_support": True,
                "execute_support": True
            }
        }

@router.post("/quote")
def quote(body: QuoteBody):
    """
    Get swap quote with validation and enhanced error handling
    """
    # Validate slippage
    if body.slippage_bps < 1 or body.slippage_bps > 10000:
        raise HTTPException(400, "slippage_bps must be between 1 and 10000 (0.01% to 100%)")
    
    # Validate token addresses
    if not valid_pub(body.source_token.mint) and body.source_token.mint != "native":
        raise HTTPException(400, f"Invalid source_token mint: {body.source_token.mint}")
    
    if not valid_pub(body.dest_token.mint) and body.dest_token.mint != "native":
        raise HTTPException(400, f"Invalid dest_token mint: {body.dest_token.mint}")
    
    # Check if source account exists (if provided)
    if body.source_account and not account_exists(body.source_account):
        raise HTTPException(400, "Source account does not exist on blockchain")
    
    try:
        # Check if we're on devnet and use appropriate service
        use_devnet = _is_devnet()
        
        if body.mode == "send":
            # Validate source amount
            try:
                amount_float = float(body.source_amount)
                if amount_float <= 0:
                    raise HTTPException(400, "source_amount must be greater than 0")
            except ValueError:
                raise HTTPException(400, "Invalid source_amount format")
            
            if use_devnet:
                result = quote_send_raydium(
                    source_token=body.source_token,
                    source_amount=body.source_amount,
                    dest_token=body.dest_token,
                    source_account=body.source_account,
                    slippage_bps=body.slippage_bps,
                )
            else:
                result = quote_send(
                    source_token=body.source_token,
                    source_amount=body.source_amount,
                    dest_token=body.dest_token,
                    source_account=body.source_account,
                    slippage_bps=body.slippage_bps,
                )
        else:
            # Validate dest amount
            try:
                amount_float = float(body.dest_amount)
                if amount_float <= 0:
                    raise HTTPException(400, "dest_amount must be greater than 0")
            except ValueError:
                raise HTTPException(400, "Invalid dest_amount format")
            
            if use_devnet:
                result = quote_receive_raydium(
                    dest_token=body.dest_token,
                    dest_amount=body.dest_amount,
                    source_token=body.source_token,
                    source_account=body.source_account,
                    slippage_bps=body.slippage_bps,
                )
            else:
                result = quote_receive(
                    dest_token=body.dest_token,
                    dest_amount=body.dest_amount,
                    source_token=body.source_token,
                    source_account=body.source_account,
                    slippage_bps=body.slippage_bps,
                )
        
        # Add metadata to result
        result["quote_metadata"] = {
            "timestamp": int(time.time()),
            "slippage_bps": body.slippage_bps,
            "slippage_percent": f"{body.slippage_bps / 100:.2f}%",
            "network": "devnet",
            "quote_valid_for": "30 seconds"
        }
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Quote failed: {str(e)}")

@router.post("/validate")
def validate_swap(body: QuoteBody):
    """
    Validate swap request without getting quote
    Useful for frontend pre-validation
    """
    validation_result = {
        "valid": True,
        "errors": [],
        "warnings": [],
        "balance_info": {},
        "swap_info": {}
    }
    
    # Validate slippage
    if body.slippage_bps < 1 or body.slippage_bps > 10000:
        validation_result["valid"] = False
        validation_result["errors"].append("slippage_bps must be between 1 and 10000 (0.01% to 100%)")
    
    # Validate token addresses
    if not valid_pub(body.source_token.mint) and body.source_token.mint != "native":
        validation_result["valid"] = False
        validation_result["errors"].append(f"Invalid source_token mint: {body.source_token.mint}")
    
    if not valid_pub(body.dest_token.mint) and body.dest_token.mint != "native":
        validation_result["valid"] = False
        validation_result["errors"].append(f"Invalid dest_token mint: {body.dest_token.mint}")
    
    # Check if source account exists (if provided)
    if body.source_account and not account_exists(body.source_account):
        validation_result["valid"] = False
        validation_result["errors"].append("Source account does not exist on blockchain")
    
    if not validation_result["valid"]:
        return validation_result
    
    # Validate amounts
    try:
        if body.mode == "send":
            amount_float = float(body.source_amount)
            if amount_float <= 0:
                validation_result["valid"] = False
                validation_result["errors"].append("source_amount must be greater than 0")
            
            # Check source balance
            if body.source_account:
                if body.source_token.mint == "native" or body.source_token.mint == "So11111111111111111111111111111111111111112":
                    current_balance = get_balance(body.source_account)
                    required_amount = int(amount_float * 1_000_000_000)
                    validation_result["balance_info"] = {
                        "token": "SOL",
                        "current_balance": str(current_balance / 1_000_000_000),
                        "required_amount": body.source_amount,
                        "sufficient": current_balance >= required_amount
                    }
                else:
                    current_balance = get_token_balance(body.source_account, body.source_token.mint)
                    decimals = body.source_token.decimals or 6
                    required_amount = int(amount_float * (10 ** decimals))
                    available_ui = current_balance / (10 ** decimals)
                    validation_result["balance_info"] = {
                        "token": body.source_token.symbol or "Unknown",
                        "current_balance": str(available_ui),
                        "required_amount": body.source_amount,
                        "sufficient": current_balance >= required_amount
                    }
                    
                    if current_balance < required_amount:
                        validation_result["valid"] = False
                        validation_result["errors"].append(f"Insufficient token balance. Required: {body.source_amount}, Available: {available_ui}")
        else:
            amount_float = float(body.dest_amount)
            if amount_float <= 0:
                validation_result["valid"] = False
                validation_result["errors"].append("dest_amount must be greater than 0")
    
    except ValueError as e:
        validation_result["valid"] = False
        validation_result["errors"].append(f"Invalid amount format: {str(e)}")
    except Exception as e:
        validation_result["valid"] = False
        validation_result["errors"].append(f"Balance check failed: {str(e)}")
    
    # Add swap info
    validation_result["swap_info"] = {
        "mode": body.mode,
        "source_token": body.source_token.mint,
        "dest_token": body.dest_token.mint,
        "slippage_bps": body.slippage_bps,
        "slippage_percent": f"{body.slippage_bps / 100:.2f}%"
    }
    
    return validation_result

@router.post("/execute")  # Backend signing
def exec_swap_unified(body: ExecuteSwapReq):
    """
    Execute swap with backend signing (legacy method)
    """
    # Validate secret key
    if not valid_secret(body.secret):
        raise HTTPException(400, "Invalid secret key format")
    
    try:
        kp = Keypair.from_base58_string(body.secret)
    except Exception as e:
        raise HTTPException(400, f"Invalid secret: {str(e)}")

    destination = body.destination or str(kp.pubkey())
    if not valid_pub(destination):
        raise HTTPException(400, "Invalid destination")

    # Validate mode
    if body.mode not in ["send", "receive"]:
        raise HTTPException(400, "mode must be 'send' or 'receive'")

    # Pre-flight balance checks
    source_public = str(kp.pubkey())
    if not account_exists(source_public):
        raise HTTPException(400, "Source account does not exist on blockchain")

    try:
        if body.mode == "send":
            if not body.source_amount:
                raise HTTPException(400, "source_amount is required for mode=send")
            
            # Validate source amount
            try:
                source_amount_float = float(body.source_amount)
                if source_amount_float <= 0:
                    raise HTTPException(400, "source_amount must be greater than 0")
            except ValueError:
                raise HTTPException(400, "Invalid source_amount format")
            
            # Get quote to calculate dest_min automatically
            use_devnet = _is_devnet()
            if use_devnet:
                quote_result = quote_send_raydium(
                    source_token=body.source_token,
                    source_amount=body.source_amount,
                    dest_token=body.dest_token,
                    source_account=source_public,
                    slippage_bps=200
                )
            else:
                quote_result = quote_send(
                    source_token=body.source_token,
                    source_amount=body.source_amount,
                    dest_token=body.dest_token,
                    source_account=source_public,
                    slippage_bps=200
                )
            
            if not quote_result.get("found"):
                raise HTTPException(400, "No swap route found")
            
            # Use calculated dest_min from quote
            dest_min = quote_result.get("dest_min_suggest", "0")
            try:
                dest_min_float = float(dest_min)
                if dest_min_float <= 0:
                    raise HTTPException(400, "Calculated dest_min is invalid")
            except ValueError:
                raise HTTPException(400, "Invalid calculated dest_min format")
            
            # Check source balance
            if body.source_token.mint == "native" or body.source_token.mint == "So11111111111111111111111111111111111111112":
                current_balance = get_balance(source_public)
                required_amount = int(source_amount_float * 1_000_000_000)
                if current_balance < required_amount:
                    raise HTTPException(400, f"Insufficient SOL balance. Required: {body.source_amount} SOL, Available: {current_balance / 1_000_000_000:.9f} SOL")
            else:
                current_balance = get_token_balance(source_public, body.source_token.mint)
                decimals = body.source_token.decimals or 6
                required_amount = int(source_amount_float * (10 ** decimals))
                if current_balance < required_amount:
                    available_ui = current_balance / (10 ** decimals)
                    raise HTTPException(400, f"Insufficient token balance. Required: {body.source_amount}, Available: {available_ui}")
            
            # Execute swap with calculated dest_min
            if use_devnet:
                result = exec_send_raydium(body.secret, destination, body.source_token,
                                          body.source_amount, body.dest_token, dest_min, body.route)
                if result.get("raydium_mode"):
                    # Keep simulated balances for mock Raydium execution and expose actual on-chain snapshot separately
                    result["balances_onchain"] = balances_of(source_public)
                else:
                    updated_balances = balances_of_with_retry(source_public, max_retries=3, delay=2.0)
                    result["balances"] = updated_balances
            else:
                result = exec_send(body.secret, destination, body.source_token,
                                 body.source_amount, body.dest_token, dest_min, body.route)
                updated_balances = balances_of_with_retry(source_public, max_retries=3, delay=2.0)
                result["balances"] = updated_balances
            result["swap_info"] = {
                "mode": "send",
                "source_token": body.source_token.mint,
                "dest_token": body.dest_token.mint,
                "source_amount": body.source_amount,
                "dest_min": dest_min,
                "calculated_dest_min": True
            }
            
            return result

        if body.mode == "receive":
            if not body.dest_amount:
                raise HTTPException(400, "dest_amount is required for mode=receive")
            
            # Validate dest amount
            try:
                dest_amount_float = float(body.dest_amount)
                if dest_amount_float <= 0:
                    raise HTTPException(400, "dest_amount must be greater than 0")
            except ValueError:
                raise HTTPException(400, "Invalid dest_amount format")
            
            # Get quote to calculate source_max automatically
            use_devnet = _is_devnet()
            if use_devnet:
                quote_result = quote_receive_raydium(
                    dest_token=body.dest_token,
                    dest_amount=body.dest_amount,
                    source_token=body.source_token,
                    source_account=source_public,
                    slippage_bps=200
                )
            else:
                quote_result = quote_receive(
                    dest_token=body.dest_token,
                    dest_amount=body.dest_amount,
                    source_token=body.source_token,
                    source_account=source_public,
                    slippage_bps=200
                )
            
            if not quote_result.get("found"):
                raise HTTPException(400, "No swap route found")
            
            # Use calculated source_max from quote
            source_max = quote_result.get("source_max_suggest", "0")
            try:
                source_max_float = float(source_max)
                if source_max_float <= 0:
                    raise HTTPException(400, "Calculated source_max is invalid")
            except ValueError:
                raise HTTPException(400, "Invalid calculated source_max format")
            
            # Execute swap with calculated source_max
            if use_devnet:
                result = exec_receive_raydium(body.secret, destination, body.dest_token, body.dest_amount,
                                              body.source_token, source_max, body.route)
                if result.get("raydium_mode"):
                    result["balances_onchain"] = balances_of(source_public)
                else:
                    updated_balances = balances_of_with_retry(source_public, max_retries=3, delay=2.0)
                    result["balances"] = updated_balances
            else:
                result = exec_receive(body.secret, destination, body.dest_token, body.dest_amount,
                                    body.source_token, source_max, body.route)
                updated_balances = balances_of_with_retry(source_public, max_retries=3, delay=2.0)
                result["balances"] = updated_balances
            result["swap_info"] = {
                "mode": "receive",
                "source_token": body.source_token.mint,
                "dest_token": body.dest_token.mint,
                "dest_amount": body.dest_amount,
                "source_max": source_max,
                "calculated_source_max": True
            }
            
            return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Swap execution failed: {str(e)}")

# NEW: 2-bước FE ký
@router.post("/begin")
def swap_begin(body: SwapBeginBody):
    if isinstance(body, SwapBeginSendReq):
        destination = body.destination or body.source_public
        transaction_b64 = build_path_send_transaction(
            source_public=body.source_public,
            destination=destination,
            source_token=body.source_token,
            source_amount=body.source_amount,
            dest_token=body.dest_token,
            dest_min=body.dest_min,
            route=body.route,
        )
    else:
        destination = body.destination or body.source_public
        transaction_b64 = build_path_receive_transaction(
            source_public=body.source_public,
            destination=destination,
            dest_token=body.dest_token,
            dest_amount=body.dest_amount,
            source_token=body.source_token,
            source_max=body.source_max,
            route=body.route,
        )
    return {
        "transaction": transaction_b64,
        "network": "devnet",
        "estimated_base_fee": 5000,
        "note": "Sign this transaction on frontend and submit via /swap/complete"
    }

@router.post("/complete")
def swap_complete(body: SubmitSignedTransactionReq):
    if not body.signed_transaction or not body.signed_transaction.strip():
        raise HTTPException(400, "signed_transaction is required")
    
    try:
        # Deserialize the signed transaction
        transaction_bytes = base64.b64decode(body.signed_transaction)
        transaction = Transaction.from_bytes(transaction_bytes)
        
        # Optional: verify signature belongs to declared public_key
        if body.public_key:
            if not valid_pub(body.public_key):
                raise HTTPException(400, "Invalid public_key")
            # Simplified signature verification
            if len(transaction.signatures) == 0:
                raise HTTPException(400, "Transaction not signed")

        # Submit transaction
        result = submit_transaction(transaction)
        
        # Get signer from transaction
        signer = str(transaction.message.account_keys[0])  # First account is usually the signer
        
        # Get updated balances with retry for fresh transaction
        updated_balances = balances_of_with_retry(signer, max_retries=2, delay=1.0)
        
        return {
            "signature": result["signature"],
            "transaction": result["transaction"],
            "balances": updated_balances,
            "explorer_link": result.get("explorer_link"),
            "solscan_link": result.get("solscan_link"),
            "note": "Balances updated after transaction confirmation"
        }
    except Exception as e:
        raise HTTPException(400, f"Transaction submission failed: {str(e)}")

