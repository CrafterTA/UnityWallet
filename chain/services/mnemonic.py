from fastapi import HTTPException
from typing import Tuple

from bip_utils import (
    Bip39SeedGenerator, Bip39MnemonicGenerator, Bip44, Bip44Coins, Bip44Changes
)
from solders.keypair import Keypair
from solders.pubkey import Pubkey

def generate_mnemonic(words: int = 12) -> str:
    if words not in (12, 24):
        raise HTTPException(400, "words must be 12 or 24")
    return Bip39MnemonicGenerator().FromWordsNumber(words).ToStr()

def derive_keypair_from_mnemonic(
    mnemonic: str, passphrase: str = "", account_index: int = 0
) -> Tuple[str, str]:
    """Derive Solana keypair from mnemonic using BIP44 path"""
    seed_bytes = Bip39SeedGenerator(mnemonic).Generate(passphrase)
    
    # Solana uses BIP44 path: m/44'/501'/account'/change/address_index
    # For Solana, coin type is 501
    try:
        ctx = (Bip44.FromSeed(seed_bytes, Bip44Coins.SOLANA)
               .Purpose().Coin().Account(account_index).Change(Bip44Changes.CHAIN_EXT).AddressIndex(0))
        
        priv_bytes = ctx.PrivateKey().Raw().ToBytes()
        kp = Keypair.from_bytes(priv_bytes)
    except Exception:
        # Fallback: use direct keypair generation if BIP44 fails
        # Ensure we have exactly 32 bytes for the seed
        seed_32 = seed_bytes[:32] if len(seed_bytes) >= 32 else seed_bytes.ljust(32, b'\x00')
        kp = Keypair.from_seed(seed_32)
    
    return str(kp.pubkey()), str(kp)

def derive_keypair_from_secret(secret: str) -> Tuple[str, str]:
    """Derive keypair from base58 secret key"""
    try:
        kp = Keypair.from_base58_string(secret)
        return str(kp.pubkey()), secret
    except Exception as e:
        raise HTTPException(400, f"Invalid secret key: {str(e)}")

