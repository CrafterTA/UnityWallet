"""
ML Service cho UnityWallet
Cung cấp feature engineering, phân tích giao dịch và cảnh báo bất thường
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ml.routers import analytics, anomaly_detection, chatbot
from ml.core.config import settings

app = FastAPI(
    title="UnityWallet ML Service",
    description="Machine Learning services for transaction analysis and anomaly detection",
    version="1.0.0"
)

# CORS middleware - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Include routers
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(anomaly_detection.router, prefix="/anomaly", tags=["anomaly"])
app.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "UnityWallet ML Service", "status": "running"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ml", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ml"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
