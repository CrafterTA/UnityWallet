import os
from pathlib import Path
from dotenv import load_dotenv, find_dotenv
from stellar_sdk import Server, Network

# ---- Load .env robust ----
# 1) CWD (nơi chạy uvicorn)
load_dotenv(find_dotenv(filename=".env", usecwd=True), override=False)

# 2) Project root: wallet/.env
root_env = Path(__file__).resolve().parents[2] / ".env"
if root_env.exists():
    load_dotenv(root_env.as_posix(), override=False)

# 3) Package dir: wallet/chain/.env  (cho phép override giá trị rỗng trước đó)
chain_env = Path(__file__).resolve().parents[1] / ".env"
if chain_env.exists():
    load_dotenv(chain_env.as_posix(), override=True)

# ---- Network / Horizon ----
HORIZON = os.getenv("HORIZON", "https://horizon-testnet.stellar.org")
FRIENDBOT = os.getenv("FRIENDBOT", "https://friendbot.stellar.org")
NET = os.getenv("NETWORK_PASSPHRASE", Network.TESTNET_NETWORK_PASSPHRASE)

# ---- SYP / Issuer / Distribution (giá trị "ảnh" tại thời điểm import) ----
SYP_CODE = os.getenv("SYP_CODE", "SYP")
ISS_PUB  = os.getenv("SYP_ISSUER_PUBLIC", "")
ISS_SEC  = os.getenv("SYP_ISSUER_SECRET", "")
DST_PUB  = os.getenv("SYP_DISTRIBUTION_PUBLIC", "")
DST_SEC  = os.getenv("SYP_DISTRIBUTION_SECRET", "")

AUTH_REQUIRED_FALLBACK = os.getenv("AUTH_REQUIRED", "true").lower() == "true"
AIRDROP_AMOUNT = int(os.getenv("AIRDROP_AMOUNT", "500"))

# ---- USDC (tùy chọn) ----
USDC_CODE   = os.getenv("USDC_CODE", "USDC")
USDC_ISSUER = os.getenv("USDC_ISSUER", "")

server = Server(HORIZON)

def is_ia_or_da(pub: str) -> bool:
    return pub in {ISS_PUB, DST_PUB}
