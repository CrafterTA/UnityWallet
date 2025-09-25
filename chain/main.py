from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import wallet, send, swap, tx

app = FastAPI(title="Solana Wallet API", version="2.1.0", description="Wallet API for Solana blockchain with USDT support")

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
app.include_router(send.router)
app.include_router(swap.router)
app.include_router(tx.router)

@app.get("/")
def root():
    return {
        "message": "Solana Wallet API",
        "version": "2.1.0",
        "network": "devnet",
        "supported_tokens": ["SOL", "USDT"],
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "network": "solana-devnet"}


