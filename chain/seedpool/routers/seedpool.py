from fastapi import APIRouter
from chain.models.schemas import SeedAllReq, AssetRef
from chain.core.config import SYP_CODE, ISS_PUB, USDC_CODE, USDC_ISSUER
from chain.services.amm import pool_info, deposit, withdraw

router = APIRouter()

@router.get("/seedpool/info")
def get_pool_info(code_a: str, issuer_a: str, code_b: str, issuer_b: str, fee_bps: int = 30):
    return pool_info(AssetRef(code_a, issuer_a), AssetRef(code_b, issuer_b), fee_bps)

@router.post("/seedpool/deposit")
def seed_deposit(secret: str, code_a: str, issuer_a: str, code_b: str, issuer_b: str,
                 max_amount_a: str, max_amount_b: str, min_price: str, max_price: str, fee_bps: int = 30):
    return deposit(secret, AssetRef(code_a, issuer_a), AssetRef(code_b, issuer_b),
                   max_amount_a, max_amount_b, min_price, max_price, fee_bps)

@router.post("/seedpool/withdraw")
def seed_withdraw(secret: str, code_a: str, issuer_a: str, code_b: str, issuer_b: str,
                  lp_amount: str, min_amount_a: str = "0", min_amount_b: str = "0", fee_bps: int = 30):
    return withdraw(secret, AssetRef(code_a, issuer_a), AssetRef(code_b, issuer_b),
                    lp_amount, min_amount_a, min_amount_b, fee_bps)

@router.post("/seedpool/seed-all")
def seed_all(req: SeedAllReq):
    result = {}
    def do(pair_key: str, asset_a: AssetRef, asset_b: AssetRef):
        cfg_price = req.target_prices.get(pair_key)
        cfg_amt = req.amounts.get(pair_key)
        if cfg_price is None or cfg_amt is None:
            result[pair_key] = {"skipped": "missing config"}
            return
        P = float(cfg_price)  # price = B per 1 A
        min_price = str(P * 0.98)
        max_price = str(P * 1.02)
        aa = cfg_amt["a"]; bb = cfg_amt["b"]
        result[pair_key] = deposit(req.secret, asset_a, asset_b, aa, bb, min_price, max_price, req.fee_bps)

    do("SYP_XLM",  AssetRef(SYP_CODE, ISS_PUB), AssetRef("XLM", "native"))
    if USDC_ISSUER:
        do("SYP_USDC", AssetRef(SYP_CODE, ISS_PUB), AssetRef(USDC_CODE, USDC_ISSUER))
        do("XLM_USDC", AssetRef("XLM", "native"), AssetRef(USDC_CODE, USDC_ISSUER))
    else:
        result["SYP_USDC"] = {"skipped": "missing USDC_ISSUER"}
        result["XLM_USDC"] = {"skipped": "missing USDC_ISSUER"}
    return result
