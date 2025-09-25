from typing import List, Optional
from fastapi import HTTPException
from stellar_sdk import Asset, TransactionBuilder, LiquidityPoolAsset
from core.config import (
    server, NET, SYP_CODE, ISS_PUB, ISS_SEC, DST_PUB, DST_SEC,
    AIRDROP_AMOUNT, AUTH_REQUIRED_FALLBACK
)

# -------- helpers over Horizon --------
def issuer_auth_required(issuer_pub: Optional[str] = None) -> bool:
    """
    Đọc cờ auth_required của issuer. Nếu không truyền, mặc định dùng ISS_PUB (SYP issuer).
    """
    issuer = issuer_pub or ISS_PUB
    try:
        acc = server.accounts().account_id(issuer).call()
        return bool(acc.get("flags", {}).get("auth_required", False))
    except Exception:
        return AUTH_REQUIRED_FALLBACK

def has_trustline(pub: str, code: str, issuer: str) -> bool:
    try:
        acc = server.accounts().account_id(pub).call()
        for b in acc.get("balances", []):
            if b.get("asset_type") == "native":
                continue
            if b.get("asset_code") == code and b.get("asset_issuer") == issuer:
                return True
        return False
    except Exception:
        return False

# -------- builders --------
def build_change_trust_tx(user_pub: str, asset: Asset, limit: str = "1000000000"):
    acc = server.load_account(user_pub)
    return (TransactionBuilder(acc, network_passphrase=NET, base_fee=server.fetch_base_fee())
            .append_change_trust_op(asset=asset, limit=limit)
            .set_timeout(180).build())

def build_change_trust_multi_tx(user_pub: str, assets: List[Asset], limit: str = "1000000000"):
    acc = server.load_account(user_pub)
    tb = TransactionBuilder(acc, network_passphrase=NET, base_fee=server.fetch_base_fee())
    for a in assets:
        if a.is_native():
            continue
        tb.append_change_trust_op(asset=a, limit=limit)
    return tb.set_timeout(180).build()

def build_allow_trust_tx(issuer_pub: str, trustor_pub: str, asset_code: str):
    acc = server.load_account(issuer_pub)
    return (TransactionBuilder(acc, network_passphrase=NET, base_fee=server.fetch_base_fee())
            .append_allow_trust_op(trustor=trustor_pub, asset_code=asset_code, authorize=True)
            .set_timeout(180).build())

def build_payment_tx(dist_pub: str, dest_pub: str, asset: Asset, amount: str):
    acc = server.load_account(dist_pub)
    return (TransactionBuilder(acc, network_passphrase=NET, base_fee=server.fetch_base_fee())
            .append_payment_op(destination=dest_pub, asset=asset, amount=str(amount))
            .set_timeout(180).build())

def airdrop_syp(dst_pub: str):
    if not DST_SEC:
        raise HTTPException(500, "Distribution secret missing")
    acc = server.load_account(DST_PUB)
    syp = Asset(SYP_CODE, ISS_PUB)
    tb = (TransactionBuilder(acc, network_passphrase=NET, base_fee=server.fetch_base_fee())
          .append_payment_op(destination=dst_pub, asset=syp, amount=str(AIRDROP_AMOUNT))
          .set_timeout(180).build())
    tb.sign(DST_SEC)
    return server.submit_transaction(tb)

