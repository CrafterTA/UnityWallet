from fastapi import APIRouter, HTTPException
from stellar_sdk import Keypair
from chain.models.schemas import CreateWalletReq, ImportSecretReq, ImportMnemonicReq
from chain.services.stellar import friendbot_fund, balances_of, valid_secret, account_exists
from chain.services.mnemonic import generate_mnemonic, derive_keypair_from_mnemonic

router = APIRouter(prefix="/wallet", tags=["wallet"])

@router.post("/create")
def create_wallet(body: CreateWalletReq):
    if body.use_mnemonic:
        if body.words not in (12, 24):
            raise HTTPException(400, "words must be 12 or 24")
        mnemonic = generate_mnemonic(words=body.words)
        public_key, secret = derive_keypair_from_mnemonic(
            mnemonic, body.passphrase, body.account_index
        )
    else:
        kp = Keypair.random()
        mnemonic = None
        public_key, secret = kp.public_key, kp.secret

    funded = False
    fund_error = None
    if body.fund:
        try:
            if not account_exists(public_key):
                friendbot_fund(public_key)
                funded = True
            else:
                funded = True
        except Exception as e:
            fund_error = str(e)

    return {
        "mode": "mnemonic" if body.use_mnemonic else "random",
        "mnemonic": mnemonic,
        "passphrase_used": bool(body.passphrase) if body.use_mnemonic else False,
        "account_index": body.account_index if body.use_mnemonic else None,
        "public_key": public_key,
        "secret": secret,
        "account_exists": account_exists(public_key),
        "funded_or_existing": funded,
        "fund_error": fund_error,
        "balances": balances_of(public_key) if (funded or account_exists(public_key)) else {},
    }

@router.post("/import")
def import_wallet(body: ImportSecretReq):
    if not valid_secret(body.secret):
        raise HTTPException(400, "Invalid secret")
    kp = Keypair.from_secret(body.secret)

    existed = account_exists(kp.public_key)
    funded = False
    fund_error = None

    if body.fund and not existed:
        try:
            friendbot_fund(kp.public_key)
            funded = True
        except Exception as e:
            fund_error = str(e)

    can_read_bal = existed or funded
    return {
        "public_key": kp.public_key,
        "account_exists": existed,
        "funded_now": funded,
        "fund_error": fund_error,
        "balances": balances_of(kp.public_key) if can_read_bal else {},
    }

@router.post("/import-mnemonic")
def import_wallet_from_mnemonic(body: ImportMnemonicReq):
    pub, sec = derive_keypair_from_mnemonic(body.mnemonic, body.passphrase, body.account_index)

    existed = account_exists(pub)
    funded = False
    fund_error = None

    if body.fund and not existed:
        try:
            friendbot_fund(pub)
            funded = True
        except Exception as e:
            fund_error = str(e)

    can_read_bal = existed or funded
    return {
        "public_key": pub,
        "secret": sec,
        "account_exists": existed,
        "funded_now": funded,
        "fund_error": fund_error,
        "balances": balances_of(pub) if can_read_bal else {},
    }

@router.get("/balances")
def get_balances(public_key: str):
    if not account_exists(public_key):
        raise HTTPException(404, "Account not found on testnet")
    return {"public_key": public_key, "balances": balances_of(public_key)}
