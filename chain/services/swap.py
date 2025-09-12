from typing import Optional, Dict, Any, List
from decimal import Decimal, ROUND_DOWN, InvalidOperation
from fastapi import HTTPException
from stellar_sdk import Keypair, TransactionBuilder, Asset
from chain.core.config import server, NET
from chain.services.stellar import (
    valid_secret, valid_pub, asset_from_ref, balances_of, base_fee, asset_to_str
)
from chain.models.schemas import AssetRef

def _path_to_assets_str(path: List[dict]) -> List[str]:
    out = []
    for p in path or []:
        typ = (p.get("asset_type") or "").lower()
        if typ == "native":
            out.append("XLM")
        else:
            out.append(f'{p["asset_code"]}:{p["asset_issuer"]}')
    return out

def _horizon_path_to_assets(path: Optional[List[dict]]) -> List[Asset]:
    assets: List[Asset] = []
    for p in path or []:
        t = (p.get("asset_type") or "").lower()
        if t == "native":
            assets.append(Asset.native())
        else:
            code = p.get("asset_code")
            issuer = p.get("asset_issuer")
            if not code or not issuer:
                raise HTTPException(400, "Invalid path element from Horizon (missing code/issuer).")
            assets.append(asset_from_ref(code, issuer))
    return assets

def _to7(x: str | float | Decimal) -> str:
    try:
        d = Decimal(str(x))
    except (InvalidOperation, ValueError):
        d = Decimal("0")
    return str(d.quantize(Decimal("0.0000001"), rounding=ROUND_DOWN))

def _net_fee_fields(op_count: int = 1) -> Dict[str, str]:
    fee_stroops = base_fee() * op_count
    fee_xlm = Decimal(fee_stroops) / Decimal(10_000_000)
    return {
        "network_fee_stroops": str(fee_stroops),
        "network_fee_xlm": _to7(fee_xlm),
        "op_count_estimate": op_count,
        "estimated_base_fee": str(base_fee()),
    }

def _apply_source_account(builder, account: Optional[str]):
    if not account:
        return builder
    try:
        meth = getattr(builder, "source_account", None)
        if callable(meth):
            return meth(account)
    except Exception:
        pass
    try:
        if hasattr(builder, "params"):
            builder.params["source_account"] = account
    except Exception:
        pass
    return builder

# -------- Quotes (giữ nguyên) --------
def quote_send(source_asset: AssetRef, source_amount: str, dest_asset: AssetRef,
               source_account: Optional[str] = None, max_paths: int = 5, slippage_bps: int = 200) -> Dict[str, Any]:
    sa = asset_from_ref(source_asset.code, source_asset.issuer)
    da = asset_from_ref(dest_asset.code, dest_asset.issuer)

    q = server.strict_send_paths(source_asset=sa, source_amount=source_amount, destination=[da])
    q = _apply_source_account(q, source_account)
    data = q.call()
    recs = data.get("_embedded", {}).get("records", [])[:max_paths]
    if not recs:
        return {"found": False, "mode": "send"}

    best = max(recs, key=lambda r: Decimal(r["destination_amount"]))
    dest_amt = Decimal(best["destination_amount"])
    src_amt = Decimal(source_amount)
    implied_price = dest_amt / src_amt if src_amt > 0 else Decimal("0")

    slip = Decimal(slippage_bps) / Decimal(10_000)
    dest_min = dest_amt * (Decimal(1) - slip)

    out = {
        "found": True,
        "mode": "send",
        "source_asset": asset_to_str(sa),
        "destination_asset": asset_to_str(da),
        "source_amount": _to7(src_amt),
        "destination_amount": _to7(dest_amt),
        "implied_price": _to7(implied_price),
        "implied_price_inverse": _to7(Decimal(1) / implied_price) if implied_price > 0 else "0",
        "slippage_bps": slippage_bps,
        "dest_min_suggest": _to7(dest_min),
        "source_max_suggest": None,
        "path_assets": _path_to_assets_str(best.get("path", [])),
        "raw": best,
    }
    out.update(_net_fee_fields(op_count=1))
    out["execute_suggest"] = {
        "mode": "send",
        "source_amount": _to7(src_amt),
        "dest_min": _to7(dest_min),
        "path": best.get("path", [])
    }
    return out

def quote_receive(dest_asset: AssetRef, dest_amount: str, source_asset: AssetRef,
                  source_account: Optional[str] = None, max_paths: int = 5, slippage_bps: int = 200) -> Dict[str, Any]:
    sa = asset_from_ref(source_asset.code, source_asset.issuer)
    da = asset_from_ref(dest_asset.code, dest_asset.issuer)

    q = server.strict_receive_paths(source=[sa], destination_asset=da, destination_amount=dest_amount)
    q = _apply_source_account(q, source_account)
    data = q.call()
    recs = data.get("_embedded", {}).get("records", [])[:max_paths]
    if not recs:
        return {"found": False, "mode": "receive"}

    best = min(recs, key=lambda r: Decimal(r["source_amount"]))
    src_amt = Decimal(best["source_amount"])
    dst_amt = Decimal(dest_amount)
    implied_price = dst_amt / src_amt if src_amt > 0 else Decimal("0")

    slip = Decimal(slippage_bps) / Decimal(10_000)
    source_max = src_amt * (Decimal(1) + slip)

    out = {
        "found": True,
        "mode": "receive",
        "source_asset": asset_to_str(sa),
        "destination_asset": asset_to_str(da),
        "source_amount": _to7(src_amt),
        "destination_amount": _to7(dst_amt),
        "implied_price": _to7(implied_price),
        "implied_price_inverse": _to7(Decimal(1) / implied_price) if implied_price > 0 else "0",
        "slippage_bps": slippage_bps,
        "dest_min_suggest": None,
        "source_max_suggest": _to7(source_max),
        "path_assets": _path_to_assets_str(best.get("path", [])),
        "raw": best,
    }
    out.update(_net_fee_fields(op_count=1))
    out["execute_suggest"] = {
        "mode": "receive",
        "dest_amount": _to7(dst_amt),
        "source_max": _to7(source_max),
        "path": best.get("path", [])
    }
    return out

# -------- Execute (ký ở BE cũ) --------
def exec_send(secret: str, destination: str,
              source_asset: AssetRef, source_amount: str,
              dest_asset: AssetRef, dest_min: str,
              path: Optional[List[dict]] = None) -> Dict[str, Any]:
    if not valid_secret(secret): raise HTTPException(400, "Invalid secret")
    if not valid_pub(destination): raise HTTPException(400, "Invalid destination")

    kp = Keypair.from_secret(secret)
    sa = asset_from_ref(source_asset.code, source_asset.issuer)
    da = asset_from_ref(dest_asset.code, dest_asset.issuer)

    path_assets = _horizon_path_to_assets(path)

    acc = server.load_account(kp.public_key)
    tx = (TransactionBuilder(acc, network_passphrase=NET, base_fee=server.fetch_base_fee())
          .append_path_payment_strict_send_op(destination=destination,
                                              send_asset=sa, send_amount=source_amount,
                                              dest_asset=da, dest_min=dest_min,
                                              path=path_assets)
          .set_timeout(180).build())
    tx.sign(kp)
    resp = server.submit_transaction(tx)
    return {
        "hash": resp["hash"],
        "envelope_xdr": resp.get("envelope_xdr"),
        "result_xdr": resp.get("result_xdr"),
        "balances": balances_of(kp.public_key)
    }

def exec_receive(secret: str, destination: str,
                 dest_asset: AssetRef, dest_amount: str,
                 source_asset: AssetRef, source_max: str,
                 path: Optional[List[dict]] = None) -> Dict[str, Any]:
    if not valid_secret(secret): raise HTTPException(400, "Invalid secret")
    if not valid_pub(destination): raise HTTPException(400, "Invalid destination")

    kp = Keypair.from_secret(secret)
    sa = asset_from_ref(source_asset.code, source_asset.issuer)
    da = asset_from_ref(dest_asset.code, dest_asset.issuer)

    path_assets = _horizon_path_to_assets(path)

    acc = server.load_account(kp.public_key)
    tx = (TransactionBuilder(acc, network_passphrase=NET, base_fee=server.fetch_base_fee())
          .append_path_payment_strict_receive_op(destination=destination,
                                                 send_asset=sa, send_max=source_max,
                                                 dest_asset=da, dest_amount=dest_amount,
                                                 path=path_assets)
          .set_timeout(180).build())
    tx.sign(kp)
    resp = server.submit_transaction(tx)
    return {
        "hash": resp["hash"],
        "envelope_xdr": resp.get("envelope_xdr"),
        "result_xdr": resp.get("result_xdr"),
        "balances": balances_of(kp.public_key)
    }

# -------- NEW: build XDR (ký ở FE) --------
def build_path_send_xdr(source_public: str, destination: str,
                        source_asset: AssetRef, source_amount: str,
                        dest_asset: AssetRef, dest_min: str,
                        path: Optional[List[dict]] = None) -> str:
    if not valid_pub(source_public): raise HTTPException(400, "Invalid source_public")
    if not valid_pub(destination): raise HTTPException(400, "Invalid destination")
    sa = asset_from_ref(source_asset.code, source_asset.issuer)
    da = asset_from_ref(dest_asset.code, dest_asset.issuer)
    acc = server.load_account(source_public)
    path_assets = _horizon_path_to_assets(path)
    tx = (TransactionBuilder(acc, network_passphrase=NET, base_fee=server.fetch_base_fee())
          .append_path_payment_strict_send_op(destination=destination,
                                              send_asset=sa, send_amount=source_amount,
                                              dest_asset=da, dest_min=dest_min,
                                              path=path_assets)
          .set_timeout(180).build())
    return tx.to_xdr()

def build_path_receive_xdr(source_public: str, destination: str,
                           dest_asset: AssetRef, dest_amount: str,
                           source_asset: AssetRef, source_max: str,
                           path: Optional[List[dict]] = None) -> str:
    if not valid_pub(source_public): raise HTTPException(400, "Invalid source_public")
    if not valid_pub(destination): raise HTTPException(400, "Invalid destination")
    sa = asset_from_ref(source_asset.code, source_asset.issuer)
    da = asset_from_ref(dest_asset.code, dest_asset.issuer)
    acc = server.load_account(source_public)
    path_assets = _horizon_path_to_assets(path)
    tx = (TransactionBuilder(acc, network_passphrase=NET, base_fee=server.fetch_base_fee())
          .append_path_payment_strict_receive_op(destination=destination,
                                                 send_asset=sa, send_max=source_max,
                                                 dest_asset=da, dest_amount=dest_amount,
                                                 path=path_assets)
          .set_timeout(180).build())
    return tx.to_xdr()
