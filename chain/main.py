from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from chain.routers import wallet, onboard, send, swap, tx, trustline
from chain.seedpool.routers import seedpool

app = FastAPI(
    title="SkyPoint SYP API",
    description="Wallet + Trustline + Send + Swap + AMM",
    version="1.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS (mở rộng tùy domain FE của bạn)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(wallet.router)
app.include_router(onboard.router)
app.include_router(trustline.router)
app.include_router(send.router)
app.include_router(swap.router)
app.include_router(tx.router)

# Dev routes
app.include_router(seedpool.router, prefix="/dev", tags=["dev"])
