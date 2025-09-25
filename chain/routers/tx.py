from fastapi import APIRouter, HTTPException
from services.stellar import tx_lookup, get_account_transactions, get_account_payments
from typing import Optional

router = APIRouter(prefix="/tx", tags=["tx"])

@router.get("/lookup")
def lookup(hash: str):
    try:
        data = tx_lookup(hash)
        return {
            "hash": data.get("hash"),
            "successful": data.get("successful"),
            "ledger": data.get("ledger"),
            "created_at": data.get("created_at"),
            "fee_charged": data.get("fee_charged"),
            "operation_count": data.get("operation_count"),
            "envelope_xdr": data.get("envelope_xdr"),
            "result_xdr": data.get("result_xdr"),
            "horizon_link": f"https://stellar.expert/explorer/testnet/tx/{data.get('hash')}"
        }
    except Exception as e:
        raise HTTPException(404, f"Transaction not found: {e}")

@router.get("/history")
def get_transaction_history(
    public_key: str,
    limit: int = 10,
    cursor: Optional[str] = None,
    type: str = "all"  # "all", "payments", "swaps"
):
    """Get transaction history for an account"""
    try:
        if type == "payments":
            return get_account_payments(public_key, limit, cursor)
        else:
            return get_account_transactions(public_key, limit, cursor)
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch transaction history: {e}")
