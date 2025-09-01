"""
FastAPI Integration cho Financial Copilot
REST API endpoints để tích hợp với Unity Wallet Frontend
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import asyncio
from datetime import datetime
import logging

# Import Financial Copilot
from .backend_integration import EnhancedFinancialCopilot

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Financial Copilot API",
    description="AI Assistant API cho Unity Wallet",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global copilot instance
copilot: Optional[EnhancedFinancialCopilot] = None

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    user_id: str
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    intent: str
    model_used: str
    suggestions: List[str]
    data_source: str
    timestamp: str

class FraudCheckRequest(BaseModel):
    user_id: str
    transaction_id: Optional[str] = None

class FraudCheckResponse(BaseModel):
    is_suspicious: bool
    risk_level: str
    risk_score: float
    reasons: List[str]
    suggested_actions: List[str]

class SpendingAnalysisRequest(BaseModel):
    user_id: str
    period: str = "month"  # week, month, quarter, year

class SpendingAnalysisResponse(BaseModel):
    total_spending: float
    categories: Dict[str, float]
    budget_status: Dict[str, Any]
    insights: List[str]
    recommendations: List[str]

class CreditAnalysisRequest(BaseModel):
    user_id: str

class CreditAnalysisResponse(BaseModel):
    credit_score: float
    credit_rating: str
    factors: Dict[str, Any]
    improvement_tips: List[str]

class SavingsAdviceRequest(BaseModel):
    user_id: str

class SavingsAdviceResponse(BaseModel):
    current_savings: float
    savings_potential: float
    goals_progress: Dict[str, Any]
    recommendations: List[str]

# Dependency to get copilot instance
async def get_copilot() -> EnhancedFinancialCopilot:
    global copilot
    if copilot is None:
        # Initialize copilot with backend configuration
        backend_url = "http://localhost:8000"  # Unity Wallet Backend
        api_key = "your-api-key"  # From environment
        copilot = EnhancedFinancialCopilot(backend_url, api_key)
    return copilot

@app.on_event("startup")
async def startup_event():
    """Initialize copilot on startup"""
    global copilot
    logger.info("Starting Financial Copilot API...")
    copilot = await get_copilot()
    logger.info("Financial Copilot initialized successfully")

@app.get("/")
async def root():
    return {"message": "Financial Copilot API", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    copilot_instance = await get_copilot()
    
    # Check if models are available
    models = copilot_instance.base_copilot._get_ollama_models()
    
    return {
        "status": "healthy",
        "available_models": models,
        "backend_status": "connected" if copilot_instance.backend else "disconnected",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat_with_copilot(request: ChatRequest, copilot_instance: EnhancedFinancialCopilot = Depends(get_copilot)):
    """
    Main chat endpoint - xử lý tất cả queries
    """
    try:
        logger.info(f"Chat request from user {request.user_id}: {request.message}")
        
        result = await copilot_instance.chat_with_backend(request.message, request.user_id)
        
        return ChatResponse(
            response=result["response"],
            intent=result["intent"],
            model_used=result["model_used"],
            suggestions=result["suggestions"],
            data_source=result["data_source"],
            timestamp=result["timestamp"]
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/fraud-check", response_model=FraudCheckResponse)
async def fraud_check(request: FraudCheckRequest, copilot_instance: EnhancedFinancialCopilot = Depends(get_copilot)):
    """
    Dedicated fraud detection endpoint
    """
    try:
        logger.info(f"Fraud check request for user {request.user_id}")
        
        # Get enriched fraud context
        context = await copilot_instance.get_enriched_context(request.user_id, 'fraud_detection')
        
        fraud_alerts = context.get('fraud_alerts', [])
        high_risk_transactions = context.get('high_risk_transactions', [])
        
        # Calculate risk score
        risk_score = len(fraud_alerts) * 0.3 + len(high_risk_transactions) * 0.2
        risk_score = min(1.0, risk_score)  # Cap at 1.0
        
        # Determine risk level
        if risk_score >= 0.7:
            risk_level = "High"
        elif risk_score >= 0.4:
            risk_level = "Medium"
        else:
            risk_level = "Low"
        
        # Generate reasons and actions
        reasons = []
        if fraud_alerts:
            reasons.append(f"{len(fraud_alerts)} cảnh báo gian lận active")
        if high_risk_transactions:
            reasons.append(f"{len(high_risk_transactions)} giao dịch nguy cơ cao")
        
        suggested_actions = []
        if risk_score >= 0.5:
            suggested_actions.extend([
                "Khóa thẻ tạm thời",
                "Liên hệ hotline ngân hàng",
                "Thay đổi mật khẩu"
            ])
        
        return FraudCheckResponse(
            is_suspicious=risk_score >= 0.5,
            risk_level=risk_level,
            risk_score=risk_score,
            reasons=reasons,
            suggested_actions=suggested_actions
        )
        
    except Exception as e:
        logger.error(f"Error in fraud check: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/spending-analysis", response_model=SpendingAnalysisResponse)
async def spending_analysis(request: SpendingAnalysisRequest, copilot_instance: EnhancedFinancialCopilot = Depends(get_copilot)):
    """
    Spending analysis endpoint
    """
    try:
        logger.info(f"Spending analysis for user {request.user_id}, period: {request.period}")
        
        context = await copilot_instance.get_enriched_context(request.user_id, 'spending_analysis')
        
        spending_analytics = context.get('spending_analytics', {})
        budget_status = context.get('budget_status', {})
        
        # Generate insights
        insights = []
        total_spending = spending_analytics.get('total_amount', 0)
        categories = spending_analytics.get('categories', {})
        
        if categories:
            top_category = max(categories.items(), key=lambda x: x[1])
            insights.append(f"Chi tiêu nhiều nhất: {top_category[0]} ({top_category[1]:,.0f} VND)")
        
        # Budget analysis
        over_budget_categories = [
            cat for cat, status in budget_status.items() 
            if status.get('status') == 'over'
        ]
        if over_budget_categories:
            insights.append(f"Vượt ngân sách: {', '.join(over_budget_categories)}")
        
        # Generate recommendations
        recommendations = context.get('savings_potential', {}).get('recommendations', [])
        
        return SpendingAnalysisResponse(
            total_spending=total_spending,
            categories=categories,
            budget_status=budget_status,
            insights=insights,
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"Error in spending analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/credit-analysis", response_model=CreditAnalysisResponse)
async def credit_analysis(request: CreditAnalysisRequest, copilot_instance: EnhancedFinancialCopilot = Depends(get_copilot)):
    """
    Credit score analysis endpoint
    """
    try:
        logger.info(f"Credit analysis for user {request.user_id}")
        
        context = await copilot_instance.get_enriched_context(request.user_id, 'credit_analysis')
        
        credit_data = context.get('credit_score', {})
        payment_behavior = context.get('payment_behavior', {})
        
        credit_score = credit_data.get('score', 0)
        credit_rating = credit_data.get('rating', 'Unknown')
        
        # Factors affecting credit score
        factors = {
            'payment_history': payment_behavior.get('consistency_score', 0) * 100,
            'credit_utilization': context.get('credit_utilization', 0) * 100,
            'transaction_pattern': payment_behavior.get('daily_frequency', 0)
        }
        
        # Improvement tips
        improvement_tips = []
        if credit_score < 700:
            improvement_tips.extend([
                "Thanh toán đúng hạn 100% các khoản nợ",
                "Giảm tỷ lệ sử dụng tín dụng xuống dưới 30%",
                "Duy trì lịch sử tín dụng lâu dài"
            ])
        
        return CreditAnalysisResponse(
            credit_score=credit_score,
            credit_rating=credit_rating,
            factors=factors,
            improvement_tips=improvement_tips
        )
        
    except Exception as e:
        logger.error(f"Error in credit analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/savings-advice", response_model=SavingsAdviceResponse)
async def savings_advice(request: SavingsAdviceRequest, copilot_instance: EnhancedFinancialCopilot = Depends(get_copilot)):
    """
    Savings advice endpoint
    """
    try:
        logger.info(f"Savings advice for user {request.user_id}")
        
        context = await copilot_instance.get_enriched_context(request.user_id, 'savings_advice')
        
        balance = context.get('balance', {})
        savings_potential = context.get('savings_potential', {})
        goal_progress = context.get('goal_progress', {})
        
        current_savings = balance.get('savings_balance', 0)
        potential_savings = savings_potential.get('potential_monthly_savings', 0)
        
        # Recommendations
        recommendations = savings_potential.get('recommendations', [])
        if potential_savings > 0:
            recommendations.insert(0, f"Tiết kiệm được {potential_savings:,.0f} VND/tháng")
        
        return SavingsAdviceResponse(
            current_savings=current_savings,
            savings_potential=potential_savings,
            goals_progress=goal_progress,
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"Error in savings advice: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/models")
async def get_available_models(copilot_instance: EnhancedFinancialCopilot = Depends(get_copilot)):
    """
    Get available LLM models
    """
    try:
        models = copilot_instance.base_copilot._get_ollama_models()
        return {
            "available_models": models,
            "primary_model": copilot_instance.base_copilot.nitro5_config.get("primary_model"),
            "fallback_model": copilot_instance.base_copilot.nitro5_config.get("fallback_model")
        }
    except Exception as e:
        logger.error(f"Error getting models: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint for real-time chat
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws/chat/{user_id}")
async def websocket_chat(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint cho real-time chat
    """
    await websocket.accept()
    copilot_instance = await get_copilot()
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            
            logger.info(f"WebSocket message from {user_id}: {data}")
            
            # Process with Financial Copilot
            result = await copilot_instance.chat_with_backend(data, user_id)
            
            # Send response
            await websocket.send_json({
                "type": "response",
                "data": result
            })
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
