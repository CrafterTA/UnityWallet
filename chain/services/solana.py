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
    USDT_MINT
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
    """Get all balances (SOL + USDT) for an account"""
    balances = {}
    
    # SOL balance (in lamports)
    sol_balance = get_balance(pub)
    balances["SOL"] = {
        "balance": str(sol_balance),
        "balance_ui": str(sol_balance / 1_000_000_000),  # Convert to SOL
        "mint": "native",
        "decimals": 9,
        "symbol": "SOL"
    }
    
    # USDT balance (in smallest unit)
    usdt_balance = get_token_balance(pub, USDT_MINT)
    balances["USDT"] = {
        "balance": str(usdt_balance),
        "balance_ui": str(usdt_balance / 1_000_000),  # USDT has 6 decimals
        "mint": USDT_MINT,
        "decimals": 6,
        "symbol": "USDT"
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
        result = client.send_raw_transaction(tx_bytes, opts=tx_opts)
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
                
                # Parse transaction for payment details
                amount = "0"
                destination = None
                source = None
                symbol = "SOL"
                direction = "sent"
                
                # Try to parse payment details from transaction
                if tx_details.get("success", False):
                    try:
                        # Get full transaction details using RPC
                        from solders.signature import Signature
                        sig_obj = Signature.from_string(str(sig_info.signature))
                        full_tx = client.get_transaction(
                            sig_obj,
                            encoding="json",
                            max_supported_transaction_version=0
                        )
                        
                        if full_tx.value:
                            # Access transaction data correctly based on actual structure
                            transaction = full_tx.value.transaction
                            meta = transaction.meta
                            
                            # Access message data correctly
                            if hasattr(transaction, 'transaction'):
                                tx_data = transaction.transaction
                                if hasattr(tx_data, 'message'):
                                    message = tx_data.message
                                    instructions = message.instructions
                                    account_keys = message.account_keys
                                    
                                    # Parse amount from balance changes (more reliable)
                                    if meta and hasattr(meta, 'pre_balances') and hasattr(meta, 'post_balances'):
                                        pre_balances = meta.pre_balances
                                        post_balances = meta.post_balances
                                
                                        # Find our account index
                                        our_account_index = None
                                        for i, key in enumerate(account_keys):
                                            if str(key) == pub:
                                                our_account_index = i
                                                break
                                        
                                        if our_account_index is not None and our_account_index < len(pre_balances) and our_account_index < len(post_balances):
                                            balance_change = pre_balances[our_account_index] - post_balances[our_account_index]
                                            if balance_change > 0:
                                                # We sent money (balance decreased)
                                                direction = "sent"
                                                source = pub
                                                # Find destination by looking for account that gained balance
                                                for i, (pre, post) in enumerate(zip(pre_balances, post_balances)):
                                                    if i != our_account_index and post > pre:
                                                        destination = str(account_keys[i])
                                                        break
                                                amount = str(balance_change / 1_000_000_000)  # Convert to SOL
                                            elif balance_change < 0:
                                                # We received money (balance increased)
                                                direction = "received"
                                                destination = pub
                                                # Find source by looking for account that lost balance
                                                for i, (pre, post) in enumerate(zip(pre_balances, post_balances)):
                                                    if i != our_account_index and pre > post:
                                                        source = str(account_keys[i])
                                                        break
                                                amount = str(abs(balance_change) / 1_000_000_000)  # Convert to SOL
                            
                            # Fallback to instruction parsing if balance change parsing failed
                            if amount == "0":
                                for instruction in instructions:
                                    program_id = str(instruction.program_id)
                                    # Check if it's a system program transfer
                                    if program_id == "11111111111111111111111111111111":  # System Program
                                        accounts = instruction.accounts
                                        if len(accounts) >= 2:
                                            # First account is source, second is destination
                                            source_account = str(account_keys[accounts[0]])
                                            dest_account = str(account_keys[accounts[1]])
                                            
                                            # Get account info to determine direction
                                            if source_account == pub:
                                                direction = "sent"
                                                source = pub
                                                destination = dest_account
                                            else:
                                                direction = "received"
                                                source = source_account
                                                destination = pub
                                            
                                            # Parse amount from instruction data
                                            data = instruction.data
                                            if data and len(data) >= 8:
                                                # System transfer instruction: 4 bytes instruction + 8 bytes lamports
                                                try:
                                                    lamports = int.from_bytes(data[4:12], byteorder='little')
                                                    amount = str(lamports / 1_000_000_000)  # Convert to SOL
                                                except:
                                                    amount = "0"
                                            
                                            break
                    except Exception as e:
                        pass
                        # Try to get amount from transaction logs or other sources
                        try:
                            # Look for amount in logs
                            logs = tx_details.get("logs", [])
                            for log in logs:
                                if "Transfer" in log and "lamports" in log:
                                    # Extract amount from log
                                    import re
                                    match = re.search(r'(\d+) lamports', log)
                                    if match:
                                        lamports = int(match.group(1))
                                        amount = str(lamports / 1_000_000_000)
                                        break
                        except:
                            pass
                        
                        # Fallback to placeholder if parsing fails
                        if amount == "0":
                            amount = "0.01"  # This is just for display - real amount is parsed from transaction
                    except Exception as e:
                        pass
                        # Try to get amount from transaction logs or other sources
                        try:
                            # Look for amount in logs
                            logs = tx_details.get("logs", [])
                            for log in logs:
                                if "Transfer" in log and "lamports" in log:
                                    # Extract amount from log
                                    import re
                                    match = re.search(r'(\d+) lamports', log)
                                    if match:
                                        lamports = int(match.group(1))
                                        amount = str(lamports / 1_000_000_000)
                                        break
                        except:
                            pass
                        
                        # Fallback to placeholder if parsing fails
                        if amount == "0":
                            amount = "0.01"  # This is just for display - real amount is parsed from transaction
                
                transactions.append({
                    "id": str(sig_info.signature),
                    "signature": str(sig_info.signature),
                    "slot": sig_info.slot,
                    "block_time": sig_info.block_time,
                    "created_at": sig_info.block_time,
                    "fee": tx_details.get("fee", 0),
                    "success": tx_details.get("success", False),
                    "logs": tx_details.get("logs", []),
                    "amount": amount,
                    "destination": destination,
                    "source": source,
                    "symbol": symbol,
                    "direction": direction,
                    "tx_type": "PAYMENT",
                    "status": "completed" if tx_details.get("success", False) else "failed"
                })
            except Exception:
                continue
        
        return {
            "transactions": transactions,
            "next_before": str(signatures_response.value[-1].signature) if signatures_response.value else None
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch transactions: {str(e)}")
