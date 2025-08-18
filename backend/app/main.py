"""Main FastAPI application"""
from fastapi import FastAPI
from .common.config import settings
from .common.database import create_tables
from .common.logging import setup_logging
from .common.middleware import setup_middleware
from .auth_svc.router import router as auth_router
from .wallet_svc.router import router as wallet_router
from .payments_svc.router import router as payments_router
from .loyalty_svc.router import router as loyalty_router
from .analytics_svc.router import router as analytics_router

# Setup logging
setup_logging()

# Create FastAPI application
app = FastAPI(
    title="Stellar Fintech API",
    description="Demo Stellar-based fintech API with wallets, payments, and swaps",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Setup middleware
setup_middleware(app)

# Include routers
app.include_router(auth_router)
app.include_router(wallet_router)
app.include_router(payments_router)
app.include_router(loyalty_router)
app.include_router(analytics_router)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    create_tables()

@app.get("/", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Stellar Fintech API is running",
        "environment": settings.ENV,
        "dry_run": settings.STELLAR_DRY_RUN
    }