import base64
from fastapi import APIRouter, HTTPException
from solders.transaction import Transaction
from solders.keypair import Keypair
from models.schemas import SendEstimateReq, SendExecReq, SendBeginReq, SubmitSignedTransactionReq
from services.payments import estimate_payment_fee, execute_payment, build_payment_transaction
from core.config import client, tx_opts
from services.solana import (
    balances_of, balances_of_with_retry, valid_pub, submit_transaction,
    get_balance, get_token_balance, account_exists
)

router = APIRouter(prefix="/send", tags=["send"])

@router.post("/estimate")
def estimate(body: SendEstimateReq):
    fee_lamports = estimate_payment_fee()
    return {
        "estimated_base_fee_lamports": fee_lamports,
        "estimated_base_fee_sol": "0.000005",  # 5000 lamports = 0.000005 SOL
        "note": "Actual fee is returned in tx result."
    }

@router.post("/validate")
def validate_send(body: SendBeginReq):
    """
    Validate send request without creating transaction
    Useful for frontend pre-validation
    """
    validation_result = {
        "valid": True,
        "errors": [],
        "warnings": [],
        "balance_info": {},
        "fee_info": {}
    }
    
    # Validate public keys
    if not valid_pub(body.source_public):
        validation_result["valid"] = False
        validation_result["errors"].append("Invalid source_public key format")
    
    if not valid_pub(body.destination):
        validation_result["valid"] = False
        validation_result["errors"].append("Invalid destination key format")
    
    if not validation_result["valid"]:
        return validation_result
    
    # Check account existence
    if not account_exists(body.source_public):
        validation_result["valid"] = False
        validation_result["errors"].append("Source account does not exist on blockchain")
    
    # Check balances
    try:
        if body.token.mint == "native" or body.token.mint == "So11111111111111111111111111111111111111112":
            # SOL transfer
            current_balance = get_balance(body.source_public)
            required_amount = int(float(body.amount) * 1_000_000_000)
            estimated_fee = 5000
            
            validation_result["balance_info"] = {
                "token": "SOL",
                "current_balance": str(current_balance / 1_000_000_000),
                "required_amount": body.amount,
                "estimated_fee": "0.000005",
                "total_required": str((required_amount + estimated_fee) / 1_000_000_000)
            }
            
            if current_balance < (required_amount + estimated_fee):
                validation_result["valid"] = False
                validation_result["errors"].append(f"Insufficient SOL balance. Required: {body.amount} SOL + fee, Available: {current_balance / 1_000_000_000:.9f} SOL")
        else:
            # SPL token transfer
            current_balance = get_token_balance(body.source_public, body.token.mint)
            decimals = body.token.decimals or 6
            required_amount = int(float(body.amount) * (10 ** decimals))
            sol_balance = get_balance(body.source_public)
            
            validation_result["balance_info"] = {
                "token": body.token.symbol or "Unknown",
                "current_balance": str(current_balance / (10 ** decimals)),
                "required_amount": body.amount,
                "sol_balance": str(sol_balance / 1_000_000_000)
            }
            
            if current_balance < required_amount:
                available_ui = current_balance / (10 ** decimals)
                validation_result["valid"] = False
                validation_result["errors"].append(f"Insufficient token balance. Required: {body.amount}, Available: {available_ui}")
            
            if sol_balance < 5000:
                validation_result["valid"] = False
                validation_result["errors"].append(f"Insufficient SOL for transaction fee. Required: 0.000005 SOL, Available: {sol_balance / 1_000_000_000:.9f} SOL")
    
    except ValueError as e:
        validation_result["valid"] = False
        validation_result["errors"].append(f"Invalid amount format: {str(e)}")
    except Exception as e:
        validation_result["valid"] = False
        validation_result["errors"].append(f"Balance check failed: {str(e)}")
    
    # Fee information
    validation_result["fee_info"] = {
        "estimated_base_fee": 5000,
        "estimated_base_fee_sol": "0.000005",
        "note": "Actual fee may vary based on network conditions"
    }
    
    return validation_result

@router.post("/execute")  # cũ: BE ký
def execute(body: SendExecReq):
    return execute_payment(body.secret, body.destination, body.source, body.amount)

# NEW: 2-bước FE ký
@router.post("/begin")
def send_begin(body: SendBeginReq):
    """
    Create unsigned transaction for frontend signing with pre-flight validation
    """
    # Validate inputs
    if not valid_pub(body.source_public):
        raise HTTPException(400, "Invalid source_public key")
    if not valid_pub(body.destination):
        raise HTTPException(400, "Invalid destination key")
    
    # Check if source account exists
    if not account_exists(body.source_public):
        raise HTTPException(400, "Source account does not exist on blockchain")
    
    # Pre-flight balance check
    try:
        if body.token.mint == "native" or body.token.mint == "So11111111111111111111111111111111111111112":
            # SOL transfer
            current_balance = get_balance(body.source_public)
            required_amount = int(float(body.amount) * 1_000_000_000)  # Convert to lamports
            estimated_fee = 5000  # Base fee
            
            if current_balance < (required_amount + estimated_fee):
                raise HTTPException(400, f"Insufficient SOL balance. Required: {body.amount} SOL + fee, Available: {current_balance / 1_000_000_000:.9f} SOL")
        else:
            # SPL token transfer
            current_balance = get_token_balance(body.source_public, body.token.mint)
            decimals = body.token.decimals or 6
            required_amount = int(float(body.amount) * (10 ** decimals))
            
            if current_balance < required_amount:
                available_ui = current_balance / (10 ** decimals)
                raise HTTPException(400, f"Insufficient token balance. Required: {body.amount}, Available: {available_ui}")
            
            # Check SOL balance for transaction fee
            sol_balance = get_balance(body.source_public)
            if sol_balance < 5000:
                raise HTTPException(400, f"Insufficient SOL for transaction fee. Required: 0.000005 SOL, Available: {sol_balance / 1_000_000_000:.9f} SOL")
    
    except ValueError as e:
        raise HTTPException(400, f"Invalid amount format: {str(e)}")
    
    # Build transaction
    try:
        transaction_b64 = build_payment_transaction(body.source_public, body.destination, body.token, body.amount)
    except Exception as e:
        raise HTTPException(400, f"Failed to build transaction: {str(e)}")
    
    # Get current balances for reference
    current_balances = balances_of(body.source_public)
    
    return {
        "transaction": transaction_b64,
        "network": "devnet",
        "estimated_base_fee": 5000,
        "estimated_base_fee_sol": "0.000005",
        "current_balances": current_balances,
        "transfer_info": {
            "source": body.source_public,
            "destination": body.destination,
            "token": body.token,
            "amount": body.amount
        },
        "note": "Sign this transaction on frontend and submit via /send/complete",
        "status": "ready_for_signing"
    }

def _signed_by(transaction: Transaction, pub: str) -> bool:
    """Check if transaction is signed by the given public key"""
    try:
        kp = Keypair.from_base58_string(pub)
        # In Solana, we check if the transaction has signatures
        # This is a simplified check - in production you'd want more thorough verification
        return len(transaction.signatures) > 0
    except Exception:
        return False

@router.post("/complete")
def send_complete(body: SubmitSignedTransactionReq):
    """
    Submit signed transaction and return updated balances
    """
    if not body.signed_transaction or not body.signed_transaction.strip():
        raise HTTPException(400, "signed_transaction is required")
    
    try:
        # Deserialize the signed transaction
        transaction_bytes = base64.b64decode(body.signed_transaction)
        transaction = Transaction.from_bytes(transaction_bytes)
        
        # Validate transaction structure
        if len(transaction.message.account_keys) == 0:
            raise HTTPException(400, "Invalid transaction: no account keys found")
        
        if len(transaction.signatures) == 0:
            raise HTTPException(400, "Transaction is not signed")
        
        # Get signer from transaction
        signer = str(transaction.message.account_keys[0])  # First account is usually the signer
        
        # Optional: verify signature belongs to declared public_key
        if body.public_key:
            if not valid_pub(body.public_key):
                raise HTTPException(400, "Invalid public_key format")
            if body.public_key != signer:
                raise HTTPException(400, f"Transaction signer ({signer}) does not match provided public_key ({body.public_key})")
        
        # Get balances before transaction for comparison
        balances_before = balances_of(signer)
        
        # Submit transaction
        result = submit_transaction(transaction)
        
        # Get updated balances with retry for fresh transaction
        updated_balances = balances_of_with_retry(signer, max_retries=3, delay=1.5)
        
        # Calculate balance changes
        balance_changes = {}
        for token, new_balance in updated_balances.items():
            if token in balances_before:
                old_balance = balances_before[token]
                change = float(new_balance["balance_ui"]) - float(old_balance["balance_ui"])
                balance_changes[token] = {
                    "before": old_balance["balance_ui"],
                    "after": new_balance["balance_ui"],
                    "change": f"{change:+.9f}" if token == "SOL" else f"{change:+.6f}"
                }
        
        return {
            "success": True,
            "signature": result["signature"],
            "transaction": result["transaction"],
            "balances": updated_balances,
            "balance_changes": balance_changes,
            "explorer_link": result.get("explorer_link"),
            "solscan_link": result.get("solscan_link"),
            "network": "devnet",
            "note": "Transaction submitted successfully. Balances updated after confirmation.",
            "status": "completed"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Transaction submission failed: {str(e)}")
