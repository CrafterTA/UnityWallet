from stellar_sdk import Asset, Keypair, TransactionBuilder, LiquidityPoolAsset
from core.config import server, NET
from services.stellar import asset_from_ref, balances_of
from models.schemas import AssetRef

def pool_id_from_pair(a: Asset, b: Asset, fee_bps: int) -> str:
    lpa = LiquidityPoolAsset(a, b, fee_bps)
    return lpa.liquidity_pool_id

def pool_info(asset_a: AssetRef, asset_b: AssetRef, fee_bps: int = 30):
    a = asset_from_ref(asset_a.code, asset_a.issuer)
    b = asset_from_ref(asset_b.code, asset_b.issuer)
    data = server.liquidity_pools().for_reserves(a, b).for_fee(fee_bps).limit(1).call()
    recs = data.get("_embedded", {}).get("records", [])
    if not recs:
        return {"exists": False}
    r = recs[0]
    return {
        "exists": True,
        "id": r["id"],
        "fee_bp": r["fee_bp"],
        "reserves": {i["asset"]: i["amount"] for i in r["reserves"]},
        "total_shares": r["total_shares"]
    }

def deposit(secret: str, asset_a: AssetRef, asset_b: AssetRef,
            max_amount_a: str, max_amount_b: str,
            min_price: str, max_price: str, fee_bps: int = 30):
    kp = Keypair.from_secret(secret)
    a = asset_from_ref(asset_a.code, asset_a.issuer)
    b = asset_from_ref(asset_b.code, asset_b.issuer)
    pool_id = pool_id_from_pair(a, b, fee_bps)
    acc = server.load_account(kp.public_key)
    tx = (TransactionBuilder(acc, network_passphrase=NET, base_fee=server.fetch_base_fee())
          .append_liquidity_pool_deposit_op(liquidity_pool_id=pool_id,
                                            max_amount_a=max_amount_a,
                                            max_amount_b=max_amount_b,
                                            min_price=min_price,
                                            max_price=max_price)
          .set_timeout(180).build())
    tx.sign(kp)
    resp = server.submit_transaction(tx)
    return {"hash": resp["hash"], "pool_id": pool_id, "balances": balances_of(kp.public_key)}

def withdraw(secret: str, asset_a: AssetRef, asset_b: AssetRef,
             amount_shares: str, min_amount_a: str, min_amount_b: str, fee_bps: int = 30):
    kp = Keypair.from_secret(secret)
    a = asset_from_ref(asset_a.code, asset_a.issuer)
    b = asset_from_ref(asset_b.code, asset_b.issuer)
    pool_id = pool_id_from_pair(a, b, fee_bps)
    acc = server.load_account(kp.public_key)
    tx = (TransactionBuilder(acc, network_passphrase=NET, base_fee=server.fetch_base_fee())
          .append_liquidity_pool_withdraw_op(liquidity_pool_id=pool_id,
                                             amount=amount_shares,
                                             min_amount_a=min_amount_a,
                                             min_amount_b=min_amount_b)
          .set_timeout(180).build())
    tx.sign(kp)
    resp = server.submit_transaction(tx)
    return {"hash": resp["hash"], "pool_id": pool_id, "balances": balances_of(kp.public_key)}
