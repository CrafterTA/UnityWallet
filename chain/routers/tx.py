from fastapi import APIRouter, HTTPException
from services.solana import get_transaction, get_account_transactions
from typing import Optional

router = APIRouter(prefix="/tx", tags=["tx"])

@router.get("/lookup")
def lookup(signature: str):
    """Lookup transaction by signature"""
    try:
        data = get_transaction(signature)
        return {
            "signature": data.get("signature"),
            "success": data.get("success"),
            "slot": data.get("slot"),
            "block_time": data.get("block_time"),
            "fee": data.get("fee"),
            "logs": data.get("logs", []),
            "explorer_link": f"https://explorer.solana.com/tx/{signature}?cluster=devnet",
            "solscan_link": f"https://solscan.io/tx/{signature}?cluster=devnet"
        }
    except Exception as e:
        raise HTTPException(404, f"Transaction not found: {e}")

@router.get("/view/{signature}")
def view_transaction(signature: str):
    """View transaction details with multiple explorer links"""
    try:
        data = get_transaction(signature)
        return {
            "signature": data.get("signature"),
            "success": data.get("success"),
            "slot": data.get("slot"),
            "block_time": data.get("block_time"),
            "fee": data.get("fee"),
            "logs": data.get("logs", []),
            "explorers": {
                "solana_explorer": f"https://explorer.solana.com/tx/{signature}?cluster=devnet",
                "solscan": f"https://solscan.io/tx/{signature}?cluster=devnet",
                "solana_fm": f"https://solana.fm/tx/{signature}?cluster=devnet"
            }
        }
    except Exception as e:
        raise HTTPException(404, f"Transaction not found: {e}")

@router.get("/history")
def get_transaction_history(
    public_key: str,
    limit: int = 10,
    before: Optional[str] = None,
    type: str = "all"  # "all", "payments", "swaps"
):
    """Get transaction history for an account"""
    try:
        return get_account_transactions(public_key, limit, before)
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch transaction history: {e}")
