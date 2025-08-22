import requests, time
from fastapi import HTTPException
from stellar_sdk import Keypair, Asset, TransactionBuilder
from chain.core.config import (
    server, NET, FRIENDBOT,
    SYP_CODE, ISS_PUB, ISS_SEC, DST_PUB, DST_SEC,
    AUTH_REQUIRED_FALLBACK, AIRDROP_AMOUNT, MNEMONIC_OK
)

# --------- VALIDATION ----------
def valid_pub(pub: str) -> bool:
    try:
        Keypair.from_public_key(pub); return True
    except Exception:
        return False

def valid_secret(sec: str) -> bool:
    try:
        Keypair.from_secret(sec); return True
    except Exception:
        return False

# --------- FRIEND BOT / BALANCES ----------
def friendbot_fund(pub: str):
    try:
        requests.get(FRIENDBOT, params={"addr": pub}, timeout=15)
    except Exception:
        pass

def balances_of(pub: str):
    try:
        acc = server.accounts().account_id(pub).call()
        return acc.get("balances", [])
    except Exception:
        return []

# --------- MNEMONIC (optional) ----------
if MNEMONIC_OK:
    from bip_utils import Bip39SeedGenerator, Bip39MnemonicGenerator, Bip44, Bip44Coins, Bip44Changes

def derive_stellar_from_mnemonic(mnemonic: str, passphrase: str = "", account_index: int = 0):
    if not MNEMONIC_OK:
        raise HTTPException(501, "Mnemonic endpoints not enabled (install bip-utils)")
    seed_bytes = Bip39SeedGenerator(mnemonic).Generate(passphrase)
    ctx = (Bip44.FromSeed(seed_bytes, Bip44Coins.STELLAR)
           .Purpose().Coin().Account(account_index).Change(Bip44Changes.CHAIN_EXT).AddressIndex(0))
    priv_bytes = ctx.PrivateKey().Raw().ToBytes()
    kp = Keypair.from_raw_ed25519_seed(priv_bytes)
    return kp.public_key, kp.secret

def generate_mnemonic(words: int = 12):
    if not MNEMONIC_OK:
        raise HTTPException(501, "Mnemonic endpoints not enabled (install bip-utils)")
    if words not in (12, 24):
        raise HTTPException(400, "words must be 12 or 24")
    return Bip39MnemonicGenerator().FromWordsNumber(words).ToStr()

# --------- ISSUER FLAGS / TRUSTLINE UTIL ----------
def issuer_auth_required(issuer_pub: str) -> bool:
    try:
        acc = server.accounts().account_id(issuer_pub).call()
        return bool(acc.get("flags", {}).get("auth_required", False))
    except Exception:
        return AUTH_REQUIRED_FALLBACK

def has_trustline(pub: str, code: str, issuer: str) -> bool:
    try:
        acc = server.accounts().account_id(pub).call()
        for b in acc.get("balances", []):
            if b.get("asset_type") == "native":
                continue
            if b.get("asset_code") == code and b.get("asset_issuer") == issuer:
                return True
        return False
    except Exception:
        return False

# --------- BUILDERS ----------
def build_change_trust_tx(user_pub: str, asset: Asset, limit: str = "1000000000"):
    acc = server.load_account(user_pub)
    return (TransactionBuilder(acc, network_passphrase=NET, base_fee=server.fetch_base_fee())
            .append_change_trust_op(asset=asset, limit=limit)
            .set_timeout(180).build())

def build_allow_trust_tx(issuer_pub: str, trustor_pub: str, asset_code: str):
    acc = server.load_account(issuer_pub)
    return (TransactionBuilder(acc, network_passphrase=NET, base_fee=server.fetch_base_fee())
            .append_allow_trust_op(trustor=trustor_pub, asset_code=asset_code, authorize=True)
            .set_timeout(180).build())

def build_payment_tx(dist_pub: str, dest_pub: str, asset: Asset, amount: str):
    acc = server.load_account(dist_pub)
    return (TransactionBuilder(acc, network_passphrase=NET, base_fee=server.fetch_base_fee())
            .append_payment_op(destination=dest_pub, asset=asset, amount=str(amount))
            .set_timeout(180).build())
