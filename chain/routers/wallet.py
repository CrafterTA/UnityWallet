from fastapi import APIRouter, HTTPException
from solders.keypair import Keypair
from models.schemas import CreateWalletReq, ImportSecretReq, ImportMnemonicReq
from services.solana import faucet_fund, balances_of, balances_of_with_retry, valid_secret, account_exists
from services.mnemonic import generate_mnemonic, derive_keypair_from_mnemonic, derive_keypair_from_secret

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
        kp = Keypair()
        mnemonic = None
        public_key, secret = str(kp.pubkey()), str(kp)

    funded = False
    fund_error = None
    if body.fund:
        # Faucet temporarily disabled
        fund_error = "Faucet temporarily disabled. Please use external faucet: https://faucet.solana.com"

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
    
    public_key, secret = derive_keypair_from_secret(body.secret)

    existed = account_exists(public_key)
    funded = False
    fund_error = None

    if body.fund and not existed:
        # Faucet temporarily disabled
        fund_error = "Faucet temporarily disabled. Please use external faucet: https://faucet.solana.com"

    can_read_bal = existed or funded
    return {
        "public_key": public_key,
        "account_exists": existed,
        "funded_now": funded,
        "fund_error": fund_error,
        "balances": balances_of(public_key) if can_read_bal else {},
    }

@router.post("/import-mnemonic")
def import_wallet_from_mnemonic(body: ImportMnemonicReq):
    pub, sec = derive_keypair_from_mnemonic(body.mnemonic, body.passphrase, body.account_index)

    existed = account_exists(pub)
    funded = False
    fund_error = None

    if body.fund and not existed:
        # Faucet temporarily disabled
        fund_error = "Faucet temporarily disabled. Please use external faucet: https://faucet.solana.com"

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
    # Always return balances, even if account doesn't exist (will show 0)
    return {"public_key": public_key, "balances": balances_of(public_key)}

@router.get("/balances/refresh")
def refresh_balances(public_key: str, wait_for_confirmation: bool = False):
    """
    Refresh balances with optional retry mechanism
    - wait_for_confirmation: If True, will retry up to 3 times with delay for fresh updates
    """
    if wait_for_confirmation:
        balances = balances_of_with_retry(public_key, max_retries=3, delay=2.0)
        return {
            "public_key": public_key, 
            "balances": balances,
            "note": "Balances refreshed with confirmation wait"
        }
    else:
        balances = balances_of(public_key)
        return {
            "public_key": public_key, 
            "balances": balances,
            "note": "Balances refreshed immediately"
        }
