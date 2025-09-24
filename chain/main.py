from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from chain.routers import wallet, onboard, send, swap, tx, sovico
import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

app = FastAPI(title="Wallet API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:5173", 
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,       # Bật True để hỗ trợ credentials
    allow_methods=["*"],          # quan trọng cho preflight
    allow_headers=["*"],          # quan trọng cho preflight (Content-Type)
    expose_headers=["*"],
    max_age=600,
)

# Include routers
app.include_router(wallet.router)
app.include_router(onboard.router)
app.include_router(send.router)
app.include_router(swap.router)
app.include_router(tx.router)
app.include_router(sovico.router, prefix="/sovico", tags=["sovico"])

@app.get("/")
async def root():
    return {"message": "UnityWallet API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}


