from fastapi import HTTPException
from stellar_sdk import Keypair, TransactionBuilder
from chain.core.config import server, NET
from chain.services.stellar import valid_secret, valid_pub, asset_from_ref, balances_of, base_fee
from chain.models.schemas import AssetRef

def estimate_payment_fee(op_count: int = 1) -> int:
    return base_fee() * op_count

def execute_payment(secret: str, destination: str, asset_ref: AssetRef, amount: str):
    if not valid_secret(secret):
        raise HTTPException(400, "Invalid secret")
    if not valid_pub(destination):
        raise HTTPException(400, "Invalid destination")
    kp = Keypair.from_secret(secret)
    a = asset_from_ref(asset_ref.code, asset_ref.issuer)
    acc = server.load_account(kp.public_key)
    tx = (TransactionBuilder(acc, network_passphrase=NET, base_fee=server.fetch_base_fee())
          .append_payment_op(destination=destination, asset=a, amount=amount)
          .set_timeout(180).build())
    tx.sign(kp)
    resp = server.submit_transaction(tx)
    return {
        "hash": resp["hash"],
        "fee_charged": resp.get("fee_charged"),
        "envelope_xdr": resp.get("envelope_xdr"),
        "result_xdr": resp.get("result_xdr"),
        "balances": balances_of(kp.public_key)
    }
