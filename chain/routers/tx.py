from fastapi import APIRouter, HTTPException
from chain.services.stellar import tx_lookup

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
