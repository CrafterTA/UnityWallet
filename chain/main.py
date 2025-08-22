from fastapi import FastAPI
# from chain.routers import wallet, onboard, trustline
from .routers import wallet, onboard, trustline 
app = FastAPI(title="$SYP (Sky Point) Onboarding & Wallet APIs (Testnet)")

app.include_router(wallet.router)
app.include_router(onboard.router)
app.include_router(trustline.router)
