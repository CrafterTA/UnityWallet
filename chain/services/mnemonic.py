from fastapi import HTTPException
from typing import Tuple

from bip_utils import (
    Bip39SeedGenerator, Bip39MnemonicGenerator, Bip44, Bip44Coins, Bip44Changes
)
from stellar_sdk import Keypair

def generate_mnemonic(words: int = 12) -> str:
    if words not in (12, 24):
        raise HTTPException(400, "words must be 12 or 24")
    return Bip39MnemonicGenerator().FromWordsNumber(words).ToStr()

def derive_keypair_from_mnemonic(
    mnemonic: str, passphrase: str = "", account_index: int = 0
) -> Tuple[str, str]:
    seed_bytes = Bip39SeedGenerator(mnemonic).Generate(passphrase)
    ctx = (Bip44.FromSeed(seed_bytes, Bip44Coins.STELLAR)
           .Purpose().Coin().Account(account_index).Change(Bip44Changes.CHAIN_EXT).AddressIndex(0))
    priv_bytes = ctx.PrivateKey().Raw().ToBytes()
    kp = Keypair.from_raw_ed25519_seed(priv_bytes)
    return kp.public_key, kp.secret
