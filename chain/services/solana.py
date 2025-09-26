import base64
import requests
import time
from typing import Optional, Dict, Any, List
from fastapi import HTTPException
from solana.rpc.api import Client
from solana.rpc.types import TxOpts
from solders.pubkey import Pubkey
from solders.keypair import Keypair
from solders.transaction import Transaction
from solders.signature import Signature
from spl.token.client import Token
from spl.token.constants import TOKEN_PROGRAM_ID
from spl.token.instructions import transfer, TransferParams
from core.config import (
    client, tx_opts, RPC_URL, FAUCET_URL,
    USDT_MINT, USDC_MINT
)

def valid_secret(s: str) -> bool:
    """Validate if string is a valid Solana private key (base58)"""
    try:
        Keypair.from_base58_string(s)
        return True
    except Exception:
        return False

def valid_pub(p: str) -> bool:
    """Validate if string is a valid Solana public key"""
    try:
        Pubkey.from_string(p)
        return True
    except Exception:
        return False

def _canon(s: Optional[str]) -> str:
    return (s or "").strip()

def resolve_token(mint: str) -> Pubkey:
    """Resolve token mint address"""
    try:
        return Pubkey.from_string(mint)
    except Exception:
        raise HTTPException(400, f"Invalid mint address: {mint}")

def faucet_fund(pub: str, amount: int = 1000000000):  # 1 SOL in lamports
    """Fund account using Solana faucet (devnet only) - TEMPORARILY DISABLED"""
    # Temporarily disabled due to rate limiting and reliability issues
    # Users can manually fund their accounts using external faucets
    raise HTTPException(400, "Faucet temporarily disabled. Please use external faucet: https://faucet.solana.com")

def account_exists(pub: str) -> bool:
    """Check if account exists on Solana"""
    try:
        account_info = client.get_account_info(Pubkey.from_string(pub))
        return account_info.value is not None
    except Exception:
        return False

def get_balance(pub: str) -> int:
    """Get SOL balance in lamports"""
    try:
        balance = client.get_balance(Pubkey.from_string(pub))
        return balance.value
    except Exception:
        return 0

def get_token_balance(pub: str, mint: str) -> int:
    """Get token balance for a specific mint"""
    try:
        # Get all token accounts for the wallet
        token_accounts = client.get_token_accounts_by_owner(
            Pubkey.from_string(pub),
            {"mint": Pubkey.from_string(mint)}
        )
        
        if not token_accounts.value:
            return 0
            
        # Get the first token account balance
        token_account = token_accounts.value[0]
        account_info = client.get_token_account_balance(token_account.pubkey)
        return account_info.value.amount
    except Exception:
        return 0

def balances_of(pub: str) -> Dict[str, Any]:
    """Get all balances (SOL + dUSDT + dUSDC) for an account from on-chain devnet"""
    balances = {}
    
    # SOL balance (in lamports) - from on-chain devnet
    sol_balance = get_balance(pub)
    balances["SOL"] = {
        "balance": str(sol_balance),
        "balance_ui": str(sol_balance / 1_000_000_000),  # Convert to SOL
        "mint": "native",
        "decimals": 9,
        "symbol": "SOL"
    }
    
    # dUSDT balance (in smallest unit) - from on-chain devnet
    dusdt_balance = get_token_balance(pub, USDT_MINT)
    balances["dUSDT"] = {
        "balance": str(dusdt_balance),
        "balance_ui": str(dusdt_balance / 1_000_000),  # dUSDT has 6 decimals
        "mint": USDT_MINT,
        "decimals": 6,
        "symbol": "dUSDT"
    }
    
    # dUSDC balance (in smallest unit) - from on-chain devnet
    dusdc_balance = get_token_balance(pub, USDC_MINT)
    balances["dUSDC"] = {
        "balance": str(dusdc_balance),
        "balance_ui": str(dusdc_balance / 1_000_000),  # dUSDC has 6 decimals
        "mint": USDC_MINT,
        "decimals": 6,
        "symbol": "dUSDC"
    }
    
    return balances

def balances_of_with_retry(pub: str, max_retries: int = 3, delay: float = 2.0) -> Dict[str, Any]:
    """Get balances with retry mechanism for fresh transaction updates"""
    for attempt in range(max_retries):
        try:
            balances = balances_of(pub)
            if attempt > 0:
                time.sleep(delay)  # Wait before retry
            return balances
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            time.sleep(delay)
    
    return balances_of(pub)  # Fallback

def get_recent_blockhash():
    """Get recent blockhash for transaction"""
    try:
        blockhash = client.get_latest_blockhash()
        return blockhash.value.blockhash  # Return Hash object, not string
    except Exception as e:
        raise HTTPException(500, f"Failed to get blockhash: {str(e)}")


def submit_transaction(transaction: Transaction) -> Dict[str, Any]:
    """Submit transaction to Solana network"""
    try:
        # Serialize transaction
        tx_bytes = bytes(transaction)
        tx_b64 = base64.b64encode(tx_bytes).decode('utf-8')
        
        # Submit transaction
        result = client.send_transaction(transaction, opts=tx_opts)
        signature = str(result.value)
        
        return {
            "signature": signature,
            "transaction": tx_b64,
            "explorer_link": f"https://explorer.solana.com/tx/{signature}?cluster=devnet",
            "solscan_link": f"https://solscan.io/tx/{signature}?cluster=devnet"
        }
    except Exception as e:
        raise HTTPException(500, f"Transaction submission failed: {str(e)}")

def get_transaction(signature: str) -> Dict[str, Any]:
    """Get transaction details by signature"""
    try:
        sig = Signature.from_string(signature)
        tx_info = client.get_transaction(sig, encoding="json")
        
        if not tx_info.value:
            raise HTTPException(404, "Transaction not found")
        
        # Handle different transaction response formats
        if hasattr(tx_info.value, 'meta') and tx_info.value.meta:
            meta = tx_info.value.meta
            return {
                "signature": signature,
                "slot": tx_info.value.slot,
                "block_time": tx_info.value.block_time,
                "fee": meta.fee if hasattr(meta, 'fee') else 0,
                "success": meta.err is None if hasattr(meta, 'err') else True,
                "logs": meta.log_messages if hasattr(meta, 'log_messages') else []
            }
        else:
            # Fallback for different response format
            return {
                "signature": signature,
                "slot": tx_info.value.slot if hasattr(tx_info.value, 'slot') else None,
                "block_time": tx_info.value.block_time if hasattr(tx_info.value, 'block_time') else None,
                "fee": 0,
                "success": True,
                "logs": []
            }
    except Exception as e:
        raise HTTPException(404, f"Transaction lookup failed: {str(e)}")

def get_account_transactions(pub: str, limit: int = 10, before: Optional[str] = None) -> Dict[str, Any]:
    """Get transaction history for an account"""
    try:
        pubkey = Pubkey.from_string(pub)
        
        # Get signatures for the account
        signatures_response = client.get_signatures_for_address(
            pubkey, 
            limit=limit,
            before=Signature.from_string(before) if before else None
        )
        
        transactions = []
        for sig_info in signatures_response.value:
            try:
                tx_details = get_transaction(str(sig_info.signature))
                transactions.append({
                    "signature": str(sig_info.signature),
                    "slot": sig_info.slot,
                    "block_time": sig_info.block_time,
                    "fee": tx_details.get("fee", 0),
                    "success": tx_details.get("success", False),
                    "logs": tx_details.get("logs", [])
                })
            except Exception:
                continue
        
        return {
            "transactions": transactions,
            "next_before": str(signatures_response.value[-1].signature) if signatures_response.value else None
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch transactions: {str(e)}")
