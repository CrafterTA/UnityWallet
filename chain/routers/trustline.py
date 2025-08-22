import time
from fastapi import APIRouter, HTTPException
from stellar_sdk import Keypair, Asset
from ..models.schemas import TrustlineDemoReq
from ..core.config import SYP_CODE, ISS_PUB, ISS_SEC, DST_PUB, DST_SEC, AIRDROP_AMOUNT
from ..services.stellar import (
    balances_of, has_trustline, issuer_auth_required,
    valid_secret, build_change_trust_tx, build_allow_trust_tx, build_payment_tx
)

router = APIRouter(tags=["trustline"])

@router.post("/trustline/demo")
def trustline_demo(body: TrustlineDemoReq):
    if not valid_secret(body.secret):
        raise HTTPException(400, "Invalid Stellar secret key")
    if not all([ISS_PUB, ISS_SEC, DST_PUB, DST_SEC]):
        raise HTTPException(500, "Issuer/Distribution keys are not fully configured in ENV")

    try:
        user_kp = Keypair.from_secret(body.secret)
        user_pub = user_kp.public_key
    except Exception as e:
        raise HTTPException(400, f"Cannot load user keypair: {str(e)}")

    syp = Asset(SYP_CODE, ISS_PUB)

    try:
        # 3) ChangeTrust
        if not has_trustline(user_pub, SYP_CODE, ISS_PUB):
            trust_tx = build_change_trust_tx(user_pub, syp, limit="1000000000")
            trust_tx.sign(user_kp)
            trust_hash = trust_tx.hash_hex()
            trust_resp = trust_tx.to_xdr()  # just to build; submit next line
            trust_hash = (await_submit(trust_tx))  # see helper below
            time.sleep(0.8)
        else:
            trust_hash = "skipped_already_trusted"

        # 4) AllowTrust nếu cần
        if issuer_auth_required(ISS_PUB):
            allow_tx = build_allow_trust_tx(ISS_PUB, user_pub, SYP_CODE)
            allow_tx.sign(ISS_SEC)
            allow_hash = await_submit(allow_tx)
            time.sleep(0.8)
        else:
            allow_hash = "skipped_auth_not_required"

        # 5) Payment (Airdrop)
        pay_tx = build_payment_tx(DST_PUB, user_pub, syp, str(AIRDROP_AMOUNT))
        pay_tx.sign(DST_SEC)
        pay_hash = await_submit(pay_tx)

        return {"status": "success",
                "steps": {"change_trust": trust_hash, "allow_trust": allow_hash, "payment_airdrop": pay_hash},
                "airdrop_amount": AIRDROP_AMOUNT,
                "asset": {"code": SYP_CODE, "issuer": ISS_PUB},
                "user_public_key": user_pub,
                "balances": balances_of(user_pub)}
    except Exception as e:
        raise HTTPException(500, f"Trustline demo failed: {str(e)}")

# --- local submit helper (tránh lặp) ---
from chain.core.config import server
def await_submit(tx):
    resp = server.submit_transaction(tx)
    return resp["hash"]
