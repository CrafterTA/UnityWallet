from fastapi import APIRouter, HTTPException
from stellar_sdk import Keypair
from ..models.schemas import CreateWalletReq, ImportSecretReq, ImportMnemonicReq
from ..services.stellar import (
    MNEMONIC_OK, generate_mnemonic, derive_stellar_from_mnemonic,
    friendbot_fund, balances_of
)

router = APIRouter(prefix="/wallet", tags=["wallet"])

@router.post("/create")
def wallet_create(req: CreateWalletReq):
    if req.use_mnemonic:
        if not MNEMONIC_OK:
            raise HTTPException(501, "Mnemonic endpoints not enabled (install bip-utils)")
        mnemonic = generate_mnemonic(req.words)
        pub, sec = derive_stellar_from_mnemonic(mnemonic, req.passphrase, req.account_index)
        if req.fund: friendbot_fund(pub)
        return {"mode":"mnemonic","mnemonic":mnemonic,"account_index":req.account_index,
                "public_key":pub,"secret":sec,"funded":req.fund,"balances":balances_of(pub)}
    else:
        kp = Keypair.random()
        pub, sec = kp.public_key, kp.secret
        if req.fund: friendbot_fund(pub)
        return {"mode":"random","public_key":pub,"secret":sec,"funded":req.fund,"balances":balances_of(pub)}

@router.post("/import")
def wallet_import_secret(req: ImportSecretReq):
    try:
        kp = Keypair.from_secret(req.secret)
    except Exception:
        raise HTTPException(400, "Invalid Stellar secret")
    pub = kp.public_key
    if req.fund: friendbot_fund(pub)
    return {"public_key":pub,"secret":req.secret,"funded":req.fund,"balances":balances_of(pub)}

@router.post("/import-mnemonic")
def wallet_import_mnemonic(req: ImportMnemonicReq):
    if not MNEMONIC_OK:
        raise HTTPException(501, "Mnemonic endpoints not enabled (install bip-utils)")
    pub, sec = derive_stellar_from_mnemonic(req.mnemonic, req.passphrase, req.account_index)
    if req.fund: friendbot_fund(pub)
    return {"mode":"mnemonic","public_key":pub,"secret":sec,"funded":req.fund,"balances":balances_of(pub)}

@router.get("/balances")
def wallet_balances(public_key: str):
    return {"public_key": public_key, "balances": balances_of(public_key)}
