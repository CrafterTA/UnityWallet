import os
from dotenv import load_dotenv
from stellar_sdk import Server, Network

load_dotenv()

HORIZON = os.getenv("HORIZON", "https://horizon-testnet.stellar.org")
FRIENDBOT = os.getenv("FRIENDBOT", "https://friendbot.stellar.org")
NET = Network.TESTNET_NETWORK_PASSPHRASE
server = Server(HORIZON)

SYP_CODE = os.getenv("SYP_CODE", "SYP")
ISS_PUB  = os.getenv("SYP_ISSUER_PUBLIC")
ISS_SEC  = os.getenv("SYP_ISSUER_SECRET")
DST_PUB  = os.getenv("SYP_DISTRIBUTION_PUBLIC")
DST_SEC  = os.getenv("SYP_DISTRIBUTION_SECRET")

# fallback nếu không đọc được flags từ mạng
AUTH_REQUIRED_FALLBACK = os.getenv("AUTH_REQUIRED", "true").lower() == "true"

AIRDROP_AMOUNT = os.getenv("AIRDROP_AMOUNT", "100")

# Mnemonic optional
MNEMONIC_OK = True
try:
    from bip_utils import Bip39SeedGenerator, Bip39MnemonicGenerator, Bip44, Bip44Coins, Bip44Changes
except Exception:
    MNEMONIC_OK = False
