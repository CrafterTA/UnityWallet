import os
from pathlib import Path
from dotenv import load_dotenv, find_dotenv
from solana.rpc.api import Client
from solana.rpc.types import TxOpts

load_dotenv(find_dotenv(filename=".env", usecwd=True), override=False)

root_env = Path(__file__).resolve().parents[2] / ".env"
if root_env.exists():
    load_dotenv(root_env.as_posix(), override=False)

chain_env = Path(__file__).resolve().parents[1] / ".env"
if chain_env.exists():
    load_dotenv(chain_env.as_posix(), override=True)

# ---- Solana Network Configuration ----
RPC_URL = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")
COMMITMENT = os.getenv("SOLANA_COMMITMENT", "confirmed")
NETWORK = os.getenv("SOLANA_NETWORK", "devnet")

# ---- Token Configuration ----
USDT_MINT = os.getenv("USDT_MINT", "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB")  # Devnet USDT (Tether)
USDC_MINT = os.getenv("USDC_MINT", "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU")  # Devnet USDC

# ---- Faucet Configuration ----
FAUCET_URL = os.getenv("FAUCET_URL", "https://faucet.solana.com")

# ---- Solana Client ----
client = Client(RPC_URL)
tx_opts = TxOpts(skip_preflight=False, preflight_commitment=COMMITMENT)

