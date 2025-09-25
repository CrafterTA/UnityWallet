from fastapi import APIRouter, HTTPException
from stellar_sdk import Keypair, TransactionEnvelope
from models.schemas import (
    QuoteBody, QuoteSendReq, QuoteReceiveReq,
    ExecuteSwapReq, DexQuoteReq, DexExecuteReq, AssetRef,
    SwapBeginBody, SwapBeginSendReq, SwapBeginReceiveReq, SubmitSignedXDRReq
)
from services.swap import (
    quote_send, quote_receive, exec_send, exec_receive,
    build_path_send_xdr, build_path_receive_xdr
)
from services.stellar import asset_from_ref, asset_to_str, valid_pub, balances_of
from core.config import server, NET

router = APIRouter(prefix="/swap", tags=["swap"])

@router.post("/quote")
def quote(body: QuoteBody):
    if body.mode == "send":
        return quote_send(
            source_asset=body.source_asset,
            source_amount=body.source_amount,
            dest_asset=body.dest_asset,
            source_account=body.source_account,
            max_paths=body.max_paths,
            slippage_bps=body.slippage_bps,
        )
    return quote_receive(
        dest_asset=body.dest_asset,
        dest_amount=body.dest_amount,
        source_asset=body.source_asset,
        source_account=body.source_account,
        max_paths=body.max_paths,
        slippage_bps=body.slippage_bps,
    )

@router.post("/execute")  # cũ: BE ký
def exec_swap_unified(body: ExecuteSwapReq):
    try:
        kp = Keypair.from_secret(body.secret)
    except Exception as e:
        raise HTTPException(400, f"Invalid secret: {str(e)}")

    destination = body.destination or kp.public_key
    if not valid_pub(destination):
        raise HTTPException(400, "Invalid destination")

    try:
        if body.mode == "send":
            if not body.source_amount or not body.dest_min:
                raise HTTPException(400, "source_amount và dest_min là bắt buộc cho mode=send")
            return exec_send(body.secret, destination, body.source_asset,
                             body.source_amount, body.dest_asset, body.dest_min, body.path)

        if body.mode == "receive":
            if not body.dest_amount or not body.source_max:
                raise HTTPException(400, "dest_amount và source_max là bắt buộc cho mode=receive")
            return exec_receive(body.secret, destination, body.dest_asset, body.dest_amount,
                                body.source_asset, body.source_max, body.path)

        raise HTTPException(400, "mode phải là 'send' hoặc 'receive'")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Swap execution failed: {str(e)}")

# NEW: 2-bước FE ký
@router.post("/begin")
def swap_begin(body: SwapBeginBody):
    if isinstance(body, SwapBeginSendReq):
        destination = body.destination or body.source_public
        xdr = build_path_send_xdr(
            source_public=body.source_public,
            destination=destination,
            source_asset=body.source_asset,
            source_amount=body.source_amount,
            dest_asset=body.dest_asset,
            dest_min=body.dest_min,
            path=body.path,
        )
    else:
        destination = body.destination or body.source_public
        xdr = build_path_receive_xdr(
            source_public=body.source_public,
            destination=destination,
            dest_asset=body.dest_asset,
            dest_amount=body.dest_amount,
            source_asset=body.source_asset,
            source_max=body.source_max,
            path=body.path,
        )
    return {
        "xdr": xdr,
        "network_passphrase": NET,
        "estimated_base_fee": server.fetch_base_fee(),
        "op_count": 1
    }

@router.post("/complete")
def swap_complete(body: SubmitSignedXDRReq):
    if not body.signed_xdr or not body.signed_xdr.strip():
        raise HTTPException(400, "signed_xdr is required")
    te = TransactionEnvelope.from_xdr(body.signed_xdr, network_passphrase=NET)
    if body.public_key:
        kp = Keypair.from_public_key(body.public_key)
        h = te.hash()
        ok = False
        for sig in te.signatures:
            try:
                kp.verify(h, sig.signature)
                ok = True
                break
            except Exception:
                continue
        if not ok:
            raise HTTPException(400, "XDR not signed by provided public_key")

    resp = server.submit_transaction(te)
    signer = te.transaction.source.account_id
    return {
        "hash": resp["hash"],
        "envelope_xdr": resp.get("envelope_xdr"),
        "result_xdr": resp.get("result_xdr"),
        "balances": balances_of(signer)
    }
