from fastapi import APIRouter, HTTPException
from stellar_sdk import TransactionEnvelope, Keypair
from chain.models.schemas import SendEstimateReq, SendExecReq, SendBeginReq, SubmitSignedXDRReq
from chain.services.payments import estimate_payment_fee, execute_payment, build_payment_xdr
from chain.core.config import server, NET
from chain.services.stellar import balances_of, valid_pub

router = APIRouter(prefix="/send", tags=["send"])

@router.post("/estimate")
def estimate(body: SendEstimateReq):
    fee_stroops = estimate_payment_fee(op_count=1)
    return {
        "estimated_base_fee_stroops": fee_stroops,
        "note": "Actual fee_charged is returned in tx result."
    }

@router.post("/execute")  # cũ: BE ký
def execute(body: SendExecReq):
    return execute_payment(body.secret, body.destination, body.source, body.amount)

# NEW: 2-bước FE ký
@router.post("/begin")
def send_begin(body: SendBeginReq):
    xdr = build_payment_xdr(body.source_public, body.destination, body.asset, body.amount)
    return {
        "xdr": xdr,
        "network_passphrase": NET,
        "estimated_base_fee": server.fetch_base_fee(),
        "op_count": 1
    }

def _signed_by(te: TransactionEnvelope, pub: str) -> bool:
    try:
        kp = Keypair.from_public_key(pub)
        h = te.hash()
        for sig in te.signatures:
            try:
                kp.verify(h, sig.signature)
                return True
            except Exception:
                continue
    except Exception:
        pass
    return False

@router.post("/complete")
def send_complete(body: SubmitSignedXDRReq):
    if not body.signed_xdr or not body.signed_xdr.strip():
        raise HTTPException(400, "signed_xdr is required")
    te = TransactionEnvelope.from_xdr(body.signed_xdr, network_passphrase=NET)
    # optional: verify chữ ký thuộc về public_key khai báo
    if body.public_key:
        if not valid_pub(body.public_key):
            raise HTTPException(400, "Invalid public_key")
        if not _signed_by(te, body.public_key):
            raise HTTPException(400, "XDR not signed by provided public_key")

    resp = server.submit_transaction(te)
    signer = te.transaction.source.account_id
    return {
        "hash": resp["hash"],
        "envelope_xdr": resp.get("envelope_xdr"),
        "result_xdr": resp.get("result_xdr"),
        "balances": balances_of(signer)
    }
