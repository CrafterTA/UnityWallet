import time
from fastapi import APIRouter, HTTPException
from stellar_sdk import Asset, TransactionBuilder
from ..models.schemas import Pubkey, SignedXDR
from ..core.config import server, NET, SYP_CODE, ISS_PUB, ISS_SEC, DST_PUB, DST_SEC, AIRDROP_AMOUNT
from ..services.stellar import balances_of, issuer_auth_required

router = APIRouter(tags=["onboard"])

@router.post("/onboard")
def onboard(body: Pubkey):
    try:
        server.load_account(body.public_key)
    except Exception as e:
        raise HTTPException(400, f"Cannot load account: {e}")

    syp = Asset(SYP_CODE, ISS_PUB)
    acc = server.load_account(body.public_key)
    tx = (TransactionBuilder(acc, network_passphrase=NET, base_fee=server.fetch_base_fee())
          .append_change_trust_op(asset=syp)
          .set_timeout(180).build())

    return {"change_trust_xdr": tx.to_xdr(),
            "asset": {"code": SYP_CODE, "issuer": ISS_PUB},
            "hint": "Sign this XDR with the user's key, then POST to /trustline/submit"}

@router.post("/trustline/submit")
def trustline_submit(body: SignedXDR):
    try:
        resp = server.submit_transaction(body.xdr)
        trust_tx = resp["hash"]
    except Exception as e:
        raise HTTPException(400, f"Submit ChangeTrust failed: {e}")

    allow_tx = None
    if issuer_auth_required(ISS_PUB):
        if not ISS_SEC:
            raise HTTPException(500, "Issuer secret not configured for AllowTrust")
        issuer_acc = server.load_account(ISS_PUB)
        atx = (TransactionBuilder(issuer_acc, network_passphrase=NET, base_fee=server.fetch_base_fee())
               .append_allow_trust_op(trustor=body.public_key, asset_code=SYP_CODE, authorize=True)
               .set_timeout(180).build())
        atx.sign(ISS_SEC)
        allow_tx = server.submit_transaction(atx)["hash"]

    dist_acc = server.load_account(DST_PUB)
    syp = Asset(SYP_CODE, ISS_PUB)
    ptx = (TransactionBuilder(dist_acc, network_passphrase=NET, base_fee=server.fetch_base_fee())
           .append_payment_op(destination=body.public_key, asset=syp, amount=str(AIRDROP_AMOUNT))
           .set_timeout(180).build())
    ptx.sign(DST_SEC)
    pay_tx = server.submit_transaction(ptx)["hash"]

    time.sleep(0.8)
    return {"change_trust_tx": trust_tx, "allow_trust_tx": allow_tx,
            "airdrop_tx": pay_tx, "airdrop_amount": AIRDROP_AMOUNT,
            "asset": {"code": SYP_CODE, "issuer": ISS_PUB},
            "balances": balances_of(body.public_key)}
