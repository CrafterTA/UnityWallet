"""Main FastAPI application"""
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import text
import logging
from typing import Dict, Any, Optional
from .common.config import settings
from .common.database import create_tables, get_db, get_redis
from .common.logging import setup_logging, get_logger
from .common.middleware import setup_middleware
from .common.horizon import get_horizon_client
from .auth_svc.router import router as auth_router
from .wallet_svc.router import router as wallet_router
from .payments_svc.router import router as payments_router
from .loyalty_svc.router import router as loyalty_router
from .analytics_svc.router import router as analytics_router
from .qr_svc.router import router as qr_router

# Setup logger for health checks
logger = get_logger("health")

# Setup logging
setup_logging()


# Health Check Helper Functions
async def check_database_health() -> Dict[str, Any]:
    """Check database connectivity and basic query execution."""
    try:
        # Get database session
        db_gen = get_db()
        db = next(db_gen)
        
        # Execute simple query to test connection
        result = db.execute(text("SELECT 1 as healthy")).fetchone()
        db.close()
        
        if result and result.healthy == 1:
            logger.debug("Database health check passed")
            return {"status": "healthy", "service": "database"}
        else:
            logger.error("Database health check failed: unexpected query result")
            return {"status": "unhealthy", "service": "database", "error": "Unexpected query result"}
            
    except Exception as e:
        error_msg = f"Database health check failed: {str(e)}"
        logger.error(error_msg, extra={"error": str(e), "service": "database"})
        return {"status": "unhealthy", "service": "database", "error": str(e)}


async def check_redis_health() -> Dict[str, Any]:
    """Check Redis connectivity and basic operations."""
    try:
        redis_client = get_redis()
        
        # Test basic Redis operations
        test_key = "health_check_test"
        test_value = "ok"
        
        # Set and get test value
        redis_client.redis.set(test_key, test_value, ex=10)  # 10 second TTL
        retrieved_value = redis_client.redis.get(test_key)
        
        if retrieved_value == test_value:
            # Clean up test key
            redis_client.redis.delete(test_key)
            logger.debug("Redis health check passed")
            return {"status": "healthy", "service": "redis"}
        else:
            logger.error("Redis health check failed: set/get test failed")
            return {"status": "unhealthy", "service": "redis", "error": "Set/get test failed"}
            
    except Exception as e:
        error_msg = f"Redis health check failed: {str(e)}"
        logger.error(error_msg, extra={"error": str(e), "service": "redis"})
        return {"status": "unhealthy", "service": "redis", "error": str(e)}


async def check_horizon_health() -> Dict[str, Any]:
    """Check Horizon connectivity using the failover client."""
    try:
        horizon_client = get_horizon_client()
        
        # Use the built-in health check method
        is_healthy = horizon_client.health_check()
        
        if is_healthy:
            logger.debug("Horizon health check passed")
            return {"status": "healthy", "service": "horizon"}
        else:
            logger.error("Horizon health check failed: no endpoints responding")
            return {"status": "unhealthy", "service": "horizon", "error": "No endpoints responding"}
            
    except Exception as e:
        error_msg = f"Horizon health check failed: {str(e)}"
        logger.error(error_msg, extra={"error": str(e), "service": "horizon"})
        return {"status": "unhealthy", "service": "horizon", "error": str(e)}

# Create FastAPI application
app = FastAPI(
    title="Unity Wallet API",
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
app.include_router(qr_router)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    create_tables()

@app.get("/", tags=["Health"])
async def root():
    """Root endpoint with basic API information and health status"""
    return {
        "status": "healthy",
        "message": "Unity Wallet API is running",
        "version": settings.APP_VERSION,
        "environment": settings.ENV,
        "dry_run": settings.STELLAR_DRY_RUN,
        "docs": "/docs",
        "health": "/healthz",
        "ready": "/readyz"
    }


@app.get("/healthz", tags=["Health"])
async def health_check():
    """Lightweight health check endpoint - always returns 200 if service is running"""
    logger.debug("Health check requested")
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "timestamp": "2025-08-21T00:00:00Z",  # Will be set by middleware
            "version": settings.APP_VERSION
        }
    )


@app.get("/readyz", tags=["Health"])
async def readiness_check():
    """Comprehensive readiness check - tests all external dependencies"""
    logger.info("Readiness check requested")
    
    # Perform all health checks
    checks = {
        "database": await check_database_health(),
        "redis": await check_redis_health(),
        "horizon": await check_horizon_health()
    }
    
    # Determine overall status
    all_healthy = all(check["status"] == "healthy" for check in checks.values())
    
    if all_healthy:
        logger.info("Readiness check passed - all services healthy")
        return JSONResponse(
            status_code=200,
            content={
                "status": "ready",
                "timestamp": "2025-08-21T00:00:00Z",  # Will be set by middleware
                "version": settings.APP_VERSION,
                "checks": checks
            }
        )
    else:
        # Log individual service failures
        failed_services = [service for service, check in checks.items() if check["status"] != "healthy"]
        logger.error(
            f"Readiness check failed - unhealthy services: {', '.join(failed_services)}",
            extra={"failed_services": failed_services, "checks": checks}
        )
        
        return JSONResponse(
            status_code=503,  # Service Unavailable
            content={
                "status": "not_ready",
                "timestamp": "2025-08-21T00:00:00Z",  # Will be set by middleware
                "version": settings.APP_VERSION,
                "checks": checks,
                "failed_services": failed_services
            }
        )