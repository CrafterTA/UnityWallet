"""
Financial Copilot Router - API endpoints for chat interface
Tích hợp ML với LLM qua REST API
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
from .financial_copilot import FinancialCopilot

router = APIRouter(prefix="/copilot", tags=["Financial Copilot"])

# Request/Response Models
class ChatRequest(BaseModel):
    message: str
    user_id: str
    context: Optional[Dict] = None

class ChatResponse(BaseModel):
    response: str
    intent: str
    actions: List[Dict[str, str]]
    ml_insights: Dict[str, Any]
    timestamp: str

class QuickInsightRequest(BaseModel):
    user_id: str
    period: str = "monthly"  # monthly, weekly, daily

class FraudAlertRequest(BaseModel):
    user_id: str
    transaction_id: str

# Global copilot instance
copilot = FinancialCopilot()

@router.post("/chat", response_model=ChatResponse)
async def chat_with_copilot(request: ChatRequest):
    """
    Main chat endpoint - tích hợp ML insights với LLM conversation
    
    Examples:
    - "Tóm tắt chi tiêu tháng này"
    - "Có giao dịch bất thường nào không?"
    - "Gợi ý tiết kiệm 15% khi bay"
    """
    
    try:
        # Load user transactions (mock data for demo)
        transactions_df = _load_user_transactions(request.user_id)
        
        # Process chat request
        result = copilot.chat(
            user_message=request.message,
            user_id=request.user_id,
            transactions_df=transactions_df
        )
        
        return ChatResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@router.get("/quick-insights/{user_id}")
async def get_quick_insights(user_id: str, period: str = "monthly"):
    """
    Quick insights for dashboard widgets
    Bảng phân loại chi tiêu: biểu đồ danh mục, xu hướng tháng
    """
    
    try:
        transactions_df = _load_user_transactions(user_id)
        
        # Get spending by category
        category_analysis = copilot._analyze_categories(
            transactions_df[transactions_df['user_id'] == user_id]
        )
        
        # Get trends
        insights = copilot.insight_generator.generate_insights(user_id, transactions_df)
        
        return {
            "period": period,
            "categories": category_analysis,
            "trends": {
                "total_spending": insights.get("total_amount", 0),
                "transaction_count": insights.get("transaction_count", 0),
                "avg_transaction": insights.get("avg_transaction_amount", 0)
            },
            "top_merchants": insights.get("top_merchants", []),
            "spending_pattern": insights.get("spending_patterns", {})
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insights error: {str(e)}")

@router.post("/fraud-alert")
async def check_fraud_alert(request: FraudAlertRequest):
    """
    Cảnh báo gian lận: flag giao dịch bất thường, 1-tap khóa thẻ/khóa ví
    """
    
    try:
        transactions_df = _load_user_transactions(request.user_id)
        user_txns = transactions_df[transactions_df['user_id'] == request.user_id]
        
        if user_txns.empty:
            return {"alert": False, "message": "Không có dữ liệu giao dịch"}
        
        # Get latest transaction for analysis
        latest_txn = user_txns.iloc[-1].to_dict()
        
        # Run anomaly detection
        fraud_result = copilot.anomaly_detector.predict_anomaly(
            request.user_id, latest_txn, transactions_df
        )
        
        # Prepare alert response
        alert_response = {
            "alert": fraud_result.get("is_anomaly", False),
            "risk_level": fraud_result.get("risk_level", "low"),
            "confidence": fraud_result.get("confidence", 0),
            "reasons": fraud_result.get("reasons", []),
            "suggested_actions": []
        }
        
        # Add suggested actions if fraud detected
        if alert_response["alert"]:
            alert_response["suggested_actions"] = [
                {
                    "type": "security",
                    "action": "lock_card",
                    "title": "Khóa thẻ tạm thời",
                    "description": "Khóa thẻ để bảo vệ tài khoản"
                },
                {
                    "type": "verification", 
                    "action": "verify_transaction",
                    "title": "Xác thực giao dịch",
                    "description": "Xác nhận đây có phải giao dịch của bạn"
                },
                {
                    "type": "contact",
                    "action": "contact_support", 
                    "title": "Liên hệ hỗ trợ",
                    "description": "Gọi hotline để được hỗ trợ"
                }
            ]
        
        return alert_response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fraud check error: {str(e)}")

@router.post("/savings-advice/{user_id}")
async def get_savings_advice(user_id: str, target_percentage: float = 15.0):
    """
    Gợi ý tiết kiệm thông minh dựa trên ML analysis
    Example: "Gợi ý tiết kiệm 15% khi bay"
    """
    
    try:
        transactions_df = _load_user_transactions(user_id)
        insights = copilot.insight_generator.generate_insights(user_id, transactions_df)
        
        # Calculate current spending
        total_spending = insights.get("total_amount", 0)
        target_savings = total_spending * (target_percentage / 100)
        
        # Get category breakdown
        categories = copilot._analyze_categories(
            transactions_df[transactions_df['user_id'] == user_id]
        )
        
        # Generate savings suggestions
        suggestions = []
        
        # Travel savings
        if "Travel" in categories and categories["Travel"] > 0:
            travel_savings = categories["Travel"] * 0.15  # 15% savings potential
            suggestions.append({
                "category": "Travel",
                "current_spending": categories["Travel"],
                "potential_savings": travel_savings,
                "tips": [
                    "Đặt vé máy bay sớm để được giá tốt",
                    "Sử dụng loyalty program và điểm tích lũy",
                    "So sánh giá trên nhiều website",
                    "Chọn ngày bay linh hoạt"
                ]
            })
        
        # Food & Dining savings
        if "F&B" in categories and categories["F&B"] > 0:
            food_savings = categories["F&B"] * 0.20  # 20% savings potential
            suggestions.append({
                "category": "Ăn uống",
                "current_spending": categories["F&B"], 
                "potential_savings": food_savings,
                "tips": [
                    "Nấu ăn tại nhà thường xuyên hơn",
                    "Sử dụng voucher và mã giảm giá",
                    "Chọn combo set thay vì gọi món lẻ",
                    "Uống nước lọc thay vì nước ngọt"
                ]
            })
        
        # Shopping savings
        if "Shopping" in categories and categories["Shopping"] > 0:
            shopping_savings = categories["Shopping"] * 0.25  # 25% savings potential
            suggestions.append({
                "category": "Mua sắm",
                "current_spending": categories["Shopping"],
                "potential_savings": shopping_savings, 
                "tips": [
                    "Lập danh sách mua sắm trước khi đi",
                    "Chờ sale và khuyến mãi lớn",
                    "So sánh giá online vs offline",
                    "Mua hàng bulk cho nhu yếu phẩm"
                ]
            })
        
        return {
            "target_percentage": target_percentage,
            "current_total_spending": total_spending,
            "target_savings_amount": target_savings,
            "suggestions": suggestions,
            "summary": f"Bạn có thể tiết kiệm {target_savings:,.0f} VND ({target_percentage}%) mỗi tháng"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Savings advice error: {str(e)}")

def _load_user_transactions(user_id: str) -> pd.DataFrame:
    """Load user transactions - placeholder implementation"""
    
    # Mock data for demo
    import numpy as np
    from datetime import datetime, timedelta
    
    # Generate sample transactions
    categories = ["F&B", "Travel", "Shopping", "Transportation", "Entertainment"]
    merchants = ["Phở Hồng", "Grab", "Vinmart", "VietJet", "CGV Cinema"]
    
    transactions = []
    for i in range(50):
        transactions.append({
            "user_id": user_id,
            "transaction_id": f"txn_{i}",
            "amount": np.random.randint(10000, 2000000),
            "description": f"Giao dịch {i}",
            "merchant": np.random.choice(merchants),
            "category": np.random.choice(categories),
            "transaction_date": (datetime.now() - timedelta(days=np.random.randint(0, 30))).isoformat(),
            "mcc": np.random.choice(["5812", "4121", "5411", "3000", "7832"])
        })
    
    return pd.DataFrame(transactions)
