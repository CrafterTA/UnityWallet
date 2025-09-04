import os
import time
from fastapi import APIRouter, HTTPException
from stellar_sdk import Keypair, Asset
from chain.models.schemas import TrustlineDemoReq
from chain.core.config import (
    server, SYP_CODE as CFG_SYP_CODE,
    ISS_PUB as CFG_ISS_PUB, ISS_SEC as CFG_ISS_SEC,
    DST_PUB as CFG_DST_PUB, DST_SEC as CFG_DST_SEC,
    AIRDROP_AMOUNT as CFG_AIRDROP_AMOUNT,
    USDC_CODE as CFG_USDC_CODE, USDC_ISSUER as CFG_USDC_ISSUER,
)
from chain.services.stellar import (
    balances_of, valid_secret, account_exists, friendbot_fund
)
from chain.services.trust import (
    has_trustline, issuer_auth_required,
    build_change_trust_tx, build_change_trust_multi_tx,
    build_allow_trust_tx, build_payment_tx
)

router = APIRouter(tags=["trustline"])

def _submit(tx):
    resp = server.submit_transaction(tx)
    return resp["hash"]

def _env_runtime():
    """Đọc ENV."""
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

@router.post("/trustline/demo", operation_id="trustline_demo_v2", name="trustline_demo_v2")
def trustline_demo(body: TrustlineDemoReq):
    """
    0) Auto-fund nếu user account chưa tồn tại
    1) ChangeTrust **SYP + USDC** (nếu thiếu bất kỳ)
    2) AllowTrust **SYP** (nếu issuer bật auth_required)
    3) Airdrop **SYP** (AIRDROP_AMOUNT) từ Distribution
    """
    if not valid_secret(body.secret):
        raise HTTPException(400, "Invalid Stellar secret key")

    R = _env_runtime()
    missing = [k for k in ["ISS_PUB", "ISS_SEC", "DST_PUB", "DST_SEC"] if not R[k]]
    if missing:
        raise HTTPException(
            500,
            f"Missing ENV at runtime: {', '.join(missing)}. "
            "Đặt đúng trong .env (chain/.env hoặc root) và restart server."
        )

    try:
        user_kp = Keypair.from_secret(body.secret)
        user_pub = user_kp.public_key
    except Exception as e:
        raise HTTPException(400, f"Cannot load user keypair: {e}")

    syp = Asset(R["SYP_CODE"], R["ISS_PUB"])
    usdc = Asset(R["USDC_CODE"], R["USDC_ISSUER"]) if R["USDC_ISSUER"] else None
    steps = {}

    try:
        # 0) Auto-fund
        if not account_exists(user_pub):
            try:
                friendbot_fund(user_pub)
                steps["friendbot_fund"] = "ok"
                time.sleep(1.0)
            except Exception as e:
                steps["friendbot_fund"] = f"failed: {e}"

        # 1) ChangeTrust SYP + USDC
        missing_assets = []
        if not has_trustline(user_pub, R["SYP_CODE"], R["ISS_PUB"]):
            missing_assets.append(syp)
        if usdc is not None and not has_trustline(user_pub, R["USDC_CODE"], R["USDC_ISSUER"]):
            missing_assets.append(usdc)

        if missing_assets:
            tx = build_change_trust_multi_tx(user_pub, missing_assets, limit="1000000000")
            tx.sign(user_kp)
            steps["change_trust_multi"] = _submit(tx)
            time.sleep(0.8)
        else:
            steps["change_trust_multi"] = "skipped_already_trusted"

        # 2) AllowTrust SYP (nếu cần)
        if issuer_auth_required(R["ISS_PUB"]):
            atx = build_allow_trust_tx(R["ISS_PUB"], user_pub, R["SYP_CODE"])
            atx.sign(R["ISS_SEC"])
            steps["allow_trust_syp"] = _submit(atx)
            time.sleep(0.6)
        else:
            steps["allow_trust_syp"] = "skipped_auth_not_required"

        # 3) Airdrop SYP
        ptx = build_payment_tx(R["DST_PUB"], user_pub, syp, str(R["AIRDROP_AMOUNT"]))
        ptx.sign(R["DST_SEC"])
        steps["airdrop_syp"] = _submit(ptx)

        return {
            "status": "success",
            "user_public_key": user_pub,
            "assets_trusted": {
                R["SYP_CODE"]: {"issuer": R["ISS_PUB"]},
                R["USDC_CODE"]: {"issuer": R["USDC_ISSUER"]} if R["USDC_ISSUER"] else "skipped_missing_issuer",
            },
            "airdrop_amount": R["AIRDROP_AMOUNT"],
            "steps": steps,
            "balances": balances_of(user_pub),
            "env_snapshot": {  # giúp debug nhanh trên Swagger, không lộ secret
                "ISS_PUB_set": bool(R["ISS_PUB"]),
                "ISS_SEC_set": bool(R["ISS_SEC"]),
                "DST_PUB_set": bool(R["DST_PUB"]),
                "DST_SEC_set": bool(R["DST_SEC"]),
                "USDC_ISSUER_set": bool(R["USDC_ISSUER"]),
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Trustline demo failed: {e}")
