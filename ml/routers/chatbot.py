"""
Chatbot API Router
AI Assistant cho phân tích giao dịch
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict, Any, Optional

from models.schemas import ChatbotRequest, ChatbotResponse
from services.solana_data_collector import solana_collector
from services.feature_engineering import feature_service
from services.anomaly_detection import anomaly_service
from services.chatbot import chatbot_service

router = APIRouter()

@router.post("/ask")
async def chat_with_assistant(request: ChatbotRequest):
    """
    Chat với AI assistant về giao dịch và phân tích
    """
    try:
        if len(request.public_key) < 32 or len(request.public_key) > 48:
            raise HTTPException(400, "Invalid Solana public key format")
        
        if not request.message.strip():
            raise HTTPException(400, "Message cannot be empty")
        
        # Collect data for analysis
        days_back = 30  # Default context
        if "tháng" in request.message.lower() or "month" in request.message.lower():
            days_back = 90
        elif "tuần" in request.message.lower() or "week" in request.message.lower():
            days_back = 7
        
        transactions = await solana_collector.collect_full_history(
            account=request.public_key,
            days_back=days_back,
            max_records=1000
        )
        
        if not transactions:
            return ChatbotResponse(
                response="Tôi không thể tìm thấy lịch sử giao dịch nào cho tài khoản này. "
                        "Hãy đảm bảo tài khoản đã có hoạt động giao dịch.",
                suggestions=[
                    "Kiểm tra public key",
                    "Thử với tài khoản khác",
                    "Xem hướng dẫn sử dụng"
                ]
            )
        
        balances = await solana_collector.get_account_balances(request.public_key)
        
        # Calculate features and detect anomalies
        features = feature_service.calculate_features(
            transactions=transactions,
            balances=balances,
            period_days=days_back
        )
        
        anomalies = anomaly_service.detect_anomalies(
            transactions=transactions,
            features=features
        )
        
        # Process with chatbot
        response = chatbot_service.process_message(
            request=request,
            transactions=transactions,
            features=features,
            anomalies=anomalies
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Chat processing failed: {str(e)}")

@router.get("/suggestions/{public_key}")
async def get_chat_suggestions(public_key: str):
    """
    Lấy gợi ý câu hỏi dựa trên hoạt động của wallet
    """
    try:
        if len(public_key) < 32 or len(public_key) > 48:
            raise HTTPException(400, "Invalid Solana public key format")
        
        # Quick analysis for suggestions
        transactions = await solana_collector.collect_full_history(
            account=public_key,
            days_back=30,
            max_records=200
        )
        
        suggestions = []
        
        if not transactions:
            suggestions = [
                "Tài khoản này có hoạt động gì không?",
                "Cách bắt đầu giao dịch đầu tiên",
                "Hướng dẫn sử dụng ví"
            ]
        else:
            # Generate contextual suggestions based on activity
            tx_count = len(transactions)
            payment_count = len([tx for tx in transactions if tx.transaction_type.value == 'payment'])
            swap_count = len([tx for tx in transactions if tx.transaction_type.value == 'swap'])
            
            # Basic suggestions
            suggestions.extend([
                "Số dư hiện tại của tôi là bao nhiêu?",
                "Tôi đã thực hiện bao nhiêu giao dịch?",
                "Có hoạt động bất thường nào không?"
            ])
            
            # Activity-based suggestions
            if payment_count > 0:
                suggestions.append("Tôi đã gửi tiền cho ai nhiều nhất?")
                suggestions.append("Phân tích chi tiêu của tôi")
            
            if swap_count > 0:
                suggestions.append("Tôi đã swap những token nào?")
            
            if tx_count > 20:
                suggestions.append("Xu hướng giao dịch của tôi như thế nào?")
                suggestions.append("Tôi thường giao dịch vào giờ nào?")
            
            # Recent activity
            from datetime import datetime, timedelta, timezone
            recent_txs = [
                tx for tx in transactions 
                if tx.timestamp >= datetime.now(timezone.utc) - timedelta(days=7)
            ]
            
            if recent_txs:
                suggestions.append("Hoạt động tuần này của tôi")
            else:
                suggestions.append("Tại sao gần đây tôi ít giao dịch?")
        
        return {
            "public_key": public_key,
            "suggestions": suggestions[:8],  # Limit to 8 suggestions
            "context": {
                "has_transactions": len(transactions) > 0,
                "total_transactions": len(transactions),
                "suggested_queries": [
                    "balance", "transactions", "spending", 
                    "anomalies", "patterns", "summary"
                ]
            }
        }
        
    except Exception as e:
        raise HTTPException(500, f"Suggestions failed: {str(e)}")

@router.post("/quick-stats")
async def get_quick_stats(request: Dict[str, str]):
    """
    Lấy thống kê nhanh cho chatbot context
    """
    try:
        public_key = request.get("public_key")
        if not public_key or not public_key.startswith('G'):
            raise HTTPException(400, "Valid public_key required")
        
        # Quick data collection
        transactions = await solana_collector.collect_full_history(
            account=public_key,
            days_back=30,
            max_records=500
        )
        
        balances = await solana_collector.get_account_balances(public_key)
        
        if not transactions:
            return {
                "status": "no_data",
                "stats": {
                    "total_transactions": 0,
                    "current_balances": {str(bal.asset): bal.balance for bal in balances}
                }
            }
        
        # Calculate quick stats
        outgoing = [tx for tx in transactions if tx.source == public_key and tx.amount]
        incoming = [tx for tx in transactions if tx.destination == public_key and tx.amount]
        
        stats = {
            "total_transactions": len(transactions),
            "payment_transactions": len([tx for tx in transactions if tx.transaction_type.value == 'payment']),
            "swap_transactions": len([tx for tx in transactions if tx.transaction_type.value == 'swap']),
            "outgoing_count": len(outgoing),
            "incoming_count": len(incoming),
            "total_sent": sum(tx.amount for tx in outgoing),
            "total_received": sum(tx.amount for tx in incoming),
            "current_balances": {str(bal.asset): bal.balance for bal in balances},
            "most_recent_transaction": max(transactions, key=lambda x: x.timestamp).timestamp.isoformat() if transactions else None,
            "account_age_days": (max(transactions, key=lambda x: x.timestamp).timestamp - min(transactions, key=lambda x: x.timestamp).timestamp).days if len(transactions) > 1 else 0
        }
        
        return {
            "status": "success",
            "public_key": public_key,
            "stats": stats,
            "summary": _generate_quick_summary(stats)
        }
        
    except Exception as e:
        raise HTTPException(500, f"Quick stats failed: {str(e)}")

@router.get("/conversation-history/{public_key}")
async def get_conversation_history(
    public_key: str,
    limit: int = 10
):
    """
    Lấy lịch sử hội thoại (mock - trong thực tế sẽ lưu trong DB)
    """
    try:
        # Mock conversation history
        # In reality, this would be retrieved from database
        mock_history = [
            {
                "timestamp": "2025-09-14T10:00:00Z",
                "user_message": "Số dư của tôi là bao nhiêu?",
                "bot_response": "Số dư hiện tại của bạn: XLM: 1000.00",
                "context": {"intent": "balance_inquiry"}
            },
            {
                "timestamp": "2025-09-14T09:30:00Z", 
                "user_message": "Có hoạt động bất thường nào không?",
                "bot_response": "Không phát hiện hoạt động bất thường nào. Tài khoản của bạn có vẻ an toàn! ✅",
                "context": {"intent": "anomaly_check"}
            }
        ]
        
        return {
            "public_key": public_key,
            "conversation_history": mock_history[:limit],
            "total_conversations": len(mock_history)
        }
        
    except Exception as e:
        raise HTTPException(500, f"History retrieval failed: {str(e)}")

def _generate_quick_summary(stats: Dict[str, Any]) -> str:
    """Generate a quick text summary from stats"""
    total_tx = stats["total_transactions"]
    total_sent = stats.get("total_sent", 0)
    total_received = stats.get("total_received", 0)
    
    if total_tx == 0:
        return "Tài khoản chưa có giao dịch nào."
    
    summary_parts = [
        f"Tổng cộng {total_tx} giao dịch"
    ]
    
    if total_sent > 0:
        summary_parts.append(f"đã gửi {total_sent:.2f}")
    
    if total_received > 0:
        summary_parts.append(f"đã nhận {total_received:.2f}")
    
    net_flow = total_received - total_sent
    if net_flow > 0:
        summary_parts.append(f"(thu ròng +{net_flow:.2f})")
    elif net_flow < 0:
        summary_parts.append(f"(chi ròng {net_flow:.2f})")
    
    return ", ".join(summary_parts) + "."
