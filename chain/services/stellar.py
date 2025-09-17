import requests
from typing import Optional
from fastapi import HTTPException
from stellar_sdk import Keypair, Asset
from chain.core.config import (
    server, FRIENDBOT,
    SYP_CODE, ISS_PUB,
    USDC_CODE, USDC_ISSUER,
)

def valid_secret(s: str) -> bool:
    try:
        Keypair.from_secret(s)
        return True
    except Exception:
        return False

def valid_pub(p: str) -> bool:
    try:
        Keypair.from_public_key(p)
        return True
    except Exception:
        return False

def _canon(s: Optional[str]) -> str:
    return (s or "").strip()

def _is_native(code: Optional[str], issuer: Optional[str]) -> bool:
    c = (_canon(code)).upper()
    i = (_canon(issuer)).lower()
    return c in ("XLM", "NATIVE") or i == "native"

def resolve_asset(code: str, issuer: Optional[str] = None) -> Asset:
    """
    Resolver 'thân thiện':
      - XLM/native => Asset.native()
      - code == SYP_CODE => issuer = ISS_PUB (lấy từ .env)
      - code == USDC_CODE => issuer = USDC_ISSUER (lấy từ .env)
      - mã khác: yêu cầu có issuer (nếu thiếu -> 400)
    """
    c = (_canon(code)).upper()
    i = _canon(issuer)

    # Native
    if _is_native(c, i):
        return Asset.native()

    # SYP (ENV)
    if c == (_canon(SYP_CODE).upper() or "SYP"):
        if not ISS_PUB:
            raise HTTPException(500, "Missing SYP_ISSUER_PUBLIC in ENV.")
        return Asset(SYP_CODE, ISS_PUB)

    # USDC (ENV)
    if c == (_canon(USDC_CODE).upper() or "USDC"):
        if not USDC_ISSUER:
            raise HTTPException(400, "Missing USDC_ISSUER in ENV. Provide issuer or set USDC_ISSUER.")
        return Asset(USDC_CODE, USDC_ISSUER)

    # Các mã khác cần issuer
    if not i:
        raise HTTPException(400, f"Missing issuer for non-native asset '{c}'.")
    if i.lower() == "native":
        raise HTTPException(400, "Use code 'XLM' (or omit issuer) for native asset.")
    return Asset(c, i)

# Back-compat alias
def asset_from_ref(code: str, issuer: Optional[str] = None) -> Asset:
    return resolve_asset(code, issuer)

def friendbot_fund(pub: str):
    r = requests.get(FRIENDBOT, params={"addr": pub}, timeout=20)
    if r.status_code != 200:
        raise HTTPException(400, f"Friendbot failed: {r.text}")

def account_exists(pub: str) -> bool:
    try:
        server.accounts().account_id(pub).call()
        return True
    except Exception:
        return False

def balances_of(pub: str):
    acc = server.accounts().account_id(pub).call()
    out = {}
    for b in acc.get("balances", []):
        if b["asset_type"] == "native":
            out["XLM"] = b["balance"]
        else:
            out[f'{b["asset_code"]}:{b["asset_issuer"]}'] = b["balance"]
    return out

def base_fee() -> int:
    return server.fetch_base_fee()

def tx_lookup(hash: str):
    return server.transactions().transaction(hash).call()

def asset_to_str(a: Asset) -> str:
    return "XLM" if a.is_native() else f"{a.code}:{a.issuer}"
