import os
from pathlib import Path
from dotenv import load_dotenv, find_dotenv
from stellar_sdk import Server, Network

load_dotenv(find_dotenv(filename=".env", usecwd=True), override=False)

root_env = Path(__file__).resolve().parents[2] / ".env"
if root_env.exists():
    load_dotenv(root_env.as_posix(), override=False)

chain_env = Path(__file__).resolve().parents[1] / ".env"
if chain_env.exists():
    load_dotenv(chain_env.as_posix(), override=True)

# ---- Network / Horizon ----
HORIZON = os.getenv("HORIZON", "https://horizon-testnet.stellar.org")
FRIENDBOT = os.getenv("FRIENDBOT", "https://friendbot.stellar.org")
NET = os.getenv("NETWORK_PASSPHRASE", Network.TESTNET_NETWORK_PASSPHRASE)

SYP_CODE = os.getenv("SYP_CODE", "SYP")
ISS_PUB  = os.getenv("SYP_ISSUER_PUBLIC", "")
ISS_SEC  = os.getenv("SYP_ISSUER_SECRET", "")
DST_PUB  = os.getenv("SYP_DISTRIBUTION_PUBLIC", "")
DST_SEC  = os.getenv("SYP_DISTRIBUTION_SECRET", "")

AUTH_REQUIRED_FALLBACK = os.getenv("AUTH_REQUIRED", "true").lower() == "true"
AIRDROP_AMOUNT = int(os.getenv("AIRDROP_AMOUNT", "500"))

USDC_CODE   = os.getenv("USDC_CODE", "USDC")
USDC_ISSUER = os.getenv("USDC_ISSUER", "")

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/sovico_ecosystem")

server = Server(HORIZON)

def is_ia_or_da(pub: str) -> bool:
    return pub in {ISS_PUB, DST_PUB}
