from fastapi import APIRouter, HTTPException
from stellar_sdk import Keypair
from chain.models.schemas import (
    QuoteBody, QuoteSendReq, QuoteReceiveReq,
    ExecuteSendReq, ExecuteReceiveReq, ExecuteSwapReq,
    DexQuoteReq, DexExecuteReq, AssetRef
)
from chain.services.swap import quote_send, quote_receive, exec_send, exec_receive
from chain.services.stellar import asset_from_ref, asset_to_str, valid_pub

router = APIRouter(prefix="/swap", tags=["swap"])

# ===== Unified /swap/quote (Swagger hiển thị đúng fields theo mode) =====
@router.post("/quote", include_in_schema=False)
def quote(body: QuoteBody):
    """
    Trả về ước tính kiểu DEX:
    - source_amount / destination_amount
    - implied_price & inverse
    - slippage_bps, dest_min_suggest/source_max_suggest
    - network_fee_xlm, path_assets, raw
    - execute_suggest (gợi ý params để gọi /swap/execute)
    """
    if body.mode == "send":
        return quote_send(
            source_asset=body.source_asset,
            source_amount=body.source_amount,
            dest_asset=body.dest_asset,
            source_account=body.source_account,
            max_paths=body.max_paths,
            slippage_bps=body.slippage_bps,
        )
    # body.mode == "receive"
    return quote_receive(
        dest_asset=body.dest_asset,
        dest_amount=body.dest_amount,
        source_asset=body.source_asset,
        source_account=body.source_account,
        max_paths=body.max_paths,
        slippage_bps=body.slippage_bps,
    )

# ===== Legacy execute (giữ để tương thích) =====
@router.post("/execute/send", include_in_schema=False)
def exec_swap_send(body: ExecuteSendReq):
    return exec_send(body.secret, body.destination, body.source_asset,
                     body.source_amount, body.dest_asset, body.dest_min, body.path)

@router.post("/execute/receive", include_in_schema=False)
def exec_swap_receive(body: ExecuteReceiveReq):
    return exec_receive(body.secret, body.destination, body.dest_asset, body.dest_amount,
                        body.source_asset, body.source_max, body.path)

# ===== Unified /swap/execute =====
@router.post("/execute", include_in_schema=False)
def exec_swap_unified(body: ExecuteSwapReq):
    try:
        kp = Keypair.from_secret(body.secret)
    except Exception:
        raise HTTPException(400, "Invalid secret")

    destination = body.destination or kp.public_key
    if not valid_pub(destination):
        raise HTTPException(400, "Invalid destination")

    if body.mode == "send":
        if not body.source_amount or not body.dest_min:
            raise HTTPException(400, "source_amount and dest_min are required for mode=send")
        return exec_send(body.secret, destination, body.source_asset,
                         body.source_amount, body.dest_asset, body.dest_min, body.path)

    if body.mode == "receive":
        if not body.dest_amount or not body.source_max:
            raise HTTPException(400, "dest_amount and source_max are required for mode=receive")
        return exec_receive(body.secret, destination, body.dest_asset, body.dest_amount,
                            body.source_asset, body.source_max, body.path)

    raise HTTPException(400, "mode must be 'send' or 'receive'")

# ===== DEX-friendly alias: /swap/dex/* (input ngắn gọn như sàn) =====
@router.post("/dex/quote")
def dex_quote(body: DexQuoteReq):
    if body.side == "sell":
        q = quote_send(
            source_asset=AssetRef(code=body.from_code),
            source_amount=body.amount,
            dest_asset=AssetRef(code=body.to_code),
            source_account=body.account,
            max_paths=5,
            slippage_bps=body.slippage_bps,
        )
        if not q.get("found"):
            return {"found": False, "side": "sell"}
        return {
            "found": True,
            "side": "sell",
            "from": asset_to_str(asset_from_ref(body.from_code)),
            "to": asset_to_str(asset_from_ref(body.to_code)),
            "amount_in": q["source_amount"],
            "amount_out": q["destination_amount"],
            "price": q["implied_price"],
            "price_inverse": q["implied_price_inverse"],
            "slippage_bps": q["slippage_bps"],
            "min_received": q["dest_min_suggest"],
            "network_fee_xlm": q["network_fee_xlm"],
            "route": q["path_assets"],
            "execute_suggest": {
                "mode": "send",
                "source_amount": q["source_amount"],
                "dest_min": q["dest_min_suggest"],
                "path": q["raw"]["path"],
            },
            "raw": q["raw"],
        }

    # side == "buy"
    q = quote_receive(
        dest_asset=AssetRef(code=body.to_code),
        dest_amount=body.amount,
        source_asset=AssetRef(code=body.from_code),
        source_account=body.account,
        max_paths=5,
        slippage_bps=body.slippage_bps,
    )
    if not q.get("found"):
        return {"found": False, "side": "buy"}
    return {
        "found": True,
        "side": "buy",
        "from": asset_to_str(asset_from_ref(body.from_code)),
        "to": asset_to_str(asset_from_ref(body.to_code)),
        "amount_in": q["source_amount"],
        "amount_out": q["destination_amount"],
        "price": q["implied_price"],
        "price_inverse": q["implied_price_inverse"],
        "slippage_bps": q["slippage_bps"],
        "max_sold": q["source_max_suggest"],
        "network_fee_xlm": q["network_fee_xlm"],
        "route": q["path_assets"],
        "execute_suggest": {
            "mode": "receive",
            "dest_amount": q["destination_amount"],
            "source_max": q["source_max_suggest"],
            "path": q["raw"]["path"],
        },
        "raw": q["raw"],
    }

@router.post("/dex/execute")
def dex_execute(body: DexExecuteReq):
    try:
        kp = Keypair.from_secret(body.secret)
    except Exception:
        raise HTTPException(400, "Invalid secret")
    destination = body.destination or kp.public_key
    if not valid_pub(destination):
        raise HTTPException(400, "Invalid destination")

    if body.side == "sell":
        q = quote_send(
            source_asset=AssetRef(code=body.from_code),
            source_amount=body.amount,
            dest_asset=AssetRef(code=body.to_code),
            source_account=kp.public_key,
            max_paths=5,
            slippage_bps=body.slippage_bps,
        )
        if not q.get("found"):
            raise HTTPException(400, "No path found for this sell.")
        return exec_send(
            secret=body.secret,
            destination=destination,
            source_asset=AssetRef(code=body.from_code),
            source_amount=q["source_amount"],
            dest_asset=AssetRef(code=body.to_code),
            dest_min=q["dest_min_suggest"],
            path=q["raw"]["path"],
        )

    # side == "buy"
    q = quote_receive(
        dest_asset=AssetRef(code=body.to_code),
        dest_amount=body.amount,
        source_asset=AssetRef(code=body.from_code),
        source_account=kp.public_key,
        max_paths=5,
        slippage_bps=body.slippage_bps,
    )
    if not q.get("found"):
        raise HTTPException(400, "No path found for this buy.")
    return exec_receive(
        secret=body.secret,
        destination=destination,
        dest_asset=AssetRef(code=body.to_code),
        dest_amount=q["destination_amount"],
        source_asset=AssetRef(code=body.from_code),
        source_max=q["source_max_suggest"],
        path=q["raw"]["path"],
    )
