import os
import time
from fastapi import APIRouter, HTTPException
from stellar_sdk import Asset, TransactionEnvelope

from models.schemas import OnboardBeginReq, OnboardCompleteReq
from core.config import (
    server, NET,
    SYP_CODE as CFG_SYP_CODE,
    ISS_PUB as CFG_ISS_PUB, ISS_SEC as CFG_ISS_SEC,
    DST_PUB as CFG_DST_PUB, DST_SEC as CFG_DST_SEC,
    AIRDROP_AMOUNT as CFG_AIRDROP_AMOUNT,
    USDC_CODE as CFG_USDC_CODE, USDC_ISSUER as CFG_USDC_ISSUER,
)
from services.stellar import (
    balances_of, account_exists, friendbot_fund, valid_pub,
)
from services.trust import (
    has_trustline, issuer_auth_required,
    build_change_trust_multi_tx, build_allow_trust_tx, build_payment_tx,
)

router = APIRouter(prefix="/onboard", tags=["onboard"])

def _env_runtime():
    return {
        "SYP_CODE": os.getenv("SYP_CODE") or CFG_SYP_CODE,
        "ISS_PUB": os.getenv("SYP_ISSUER_PUBLIC") or CFG_ISS_PUB,
        "ISS_SEC": os.getenv("SYP_ISSUER_SECRET") or CFG_ISS_SEC,
        "DST_PUB": os.getenv("SYP_DISTRIBUTION_PUBLIC") or CFG_DST_PUB,
        "DST_SEC": os.getenv("SYP_DISTRIBUTION_SECRET") or CFG_DST_SEC,
        "AIRDROP_AMOUNT": int(os.getenv("AIRDROP_AMOUNT") or str(CFG_AIRDROP_AMOUNT)),
        "USDC_CODE": os.getenv("USDC_CODE") or CFG_USDC_CODE,
        "USDC_ISSUER": os.getenv("USDC_ISSUER") or CFG_USDC_ISSUER,
    }

def _submit_hash(tx):
    resp = server.submit_transaction(tx)
    return resp["hash"]

@router.post("/begin")
def onboard_begin(body: OnboardBeginReq):
    if not valid_pub(body.public_key):
        raise HTTPException(400, "Invalid public key")

    R = _env_runtime()
    missing = [k for k in ["ISS_PUB", "DST_PUB"] if not R[k]]
    if missing:
        raise HTTPException(500, f"Missing ENV: {', '.join(missing)}")

    syp = Asset(R["SYP_CODE"], R["ISS_PUB"])
    usdc = Asset(R["USDC_CODE"], R["USDC_ISSUER"]) if R["USDC_ISSUER"] else None

    steps = {}
    if not account_exists(body.public_key):
        try:
            friendbot_fund(body.public_key)
            steps["friendbot_fund"] = "ok"
            time.sleep(1.0)
        except Exception as e:
            steps["friendbot_fund"] = f"failed: {e}"

    missing_assets = []
    if not has_trustline(body.public_key, syp.code, syp.issuer):
        missing_assets.append(syp)
    if usdc is not None and not has_trustline(body.public_key, usdc.code, usdc.issuer):
        missing_assets.append(usdc)

    if missing_assets:
        tx = build_change_trust_multi_tx(body.public_key, missing_assets, limit="1000000000")
        xdr = tx.to_xdr()  # trả về để FE ký
        steps["change_trust"] = {"needed": True, "assets": [f"{a.code}:{a.issuer}" for a in missing_assets]}
        return {
            "status": "ready_to_sign",
            "user_public_key": body.public_key,
            "xdr": xdr,
            "note": "Ký XDR này trên FE rồi gọi /onboard/complete.",
            "steps": steps,
        }

    steps["change_trust"] = {"needed": False, "assets": []}
    return {
        "status": "skip_sign",
        "user_public_key": body.public_key,
        "xdr": None,
        "note": "User đã có trustlines cần thiết. Có thể gửi signed_xdr rỗng ở bước complete.",
        "steps": steps,
    }

@router.post("/complete")
def onboard_complete(body: OnboardCompleteReq):
    if not valid_pub(body.public_key):
        raise HTTPException(400, "Invalid public key")

    R = _env_runtime()
    missing = [k for k in ["ISS_PUB", "ISS_SEC", "DST_PUB", "DST_SEC"] if not R[k]]
    if missing:
        raise HTTPException(500, f"Missing ENV: {', '.join(missing)}")

    syp = Asset(R["SYP_CODE"], R["ISS_PUB"])
    steps = {}

    if body.signed_xdr and body.signed_xdr.strip():
        try:
            te = TransactionEnvelope.from_xdr(body.signed_xdr, network_passphrase=NET)
            steps["submit_user_signed_change_trust"] = _submit_hash(te)
            time.sleep(0.6)
        except Exception as e:
            raise HTTPException(400, f"Submit signed XDR failed: {e}")
    else:
        steps["submit_user_signed_change_trust"] = "skipped_empty_xdr"

    try:
        if issuer_auth_required(R["ISS_PUB"]):
            atx = build_allow_trust_tx(R["ISS_PUB"], body.public_key, R["SYP_CODE"])
            atx.sign(R["ISS_SEC"])
            steps["allow_trust_syp"] = _submit_hash(atx)
            time.sleep(0.5)
        else:
            steps["allow_trust_syp"] = "skipped_auth_not_required"
    except Exception as e:
        raise HTTPException(500, f"AllowTrust failed: {e}")

    try:
        ptx = build_payment_tx(R["DST_PUB"], body.public_key, syp, str(R["AIRDROP_AMOUNT"]))
        ptx.sign(R["DST_SEC"])
        steps["airdrop_syp"] = _submit_hash(ptx)
    except Exception as e:
        raise HTTPException(500, f"Airdrop failed: {e}")

    return {
        "status": "success",
        "user_public_key": body.public_key,
        "airdrop_amount": R["AIRDROP_AMOUNT"],
        "steps": steps,
        "balances": balances_of(body.public_key),
        "env_snapshot": {
            "ISS_PUB_set": bool(R["ISS_PUB"]),
            "ISS_SEC_set": bool(R["ISS_SEC"]),
            "DST_PUB_set": bool(R["DST_PUB"]),
            "DST_SEC_set": bool(R["DST_SEC"]),
            "USDC_ISSUER_set": bool(R["USDC_ISSUER"]),
        },
    }
