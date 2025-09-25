"""
Enhanced Chatbot Service with LLM Integration
Trợ lý AI thông minh với Gemini LLM support
"""

import re
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import google.generativeai as genai
from core.config import settings
from models.schemas import (
    TransactionRecord, FeatureEngineering, AnomalyDetection,
    ChatbotRequest, ChatbotResponse
)

class EnhancedChatbotService:
    """AI Assistant với LLM integration"""
    
    def __init__(self):
        self.context_cache = {}
        
        # Configure Gemini
        if settings.use_gemini and settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
            self.gemini_model = genai.GenerativeModel(settings.gemini_model)
            self.use_gemini = True
            print(f"Initialized Gemini model: {settings.gemini_model}")
        else:
            self.use_gemini = False
        
        if not self.use_gemini:
            print("Warning: No Gemini API key found, using rule-based responses")
        
        # System prompt for financial analysis
        self.system_prompt = """
Bạn là một trợ lý tài chính thông minh cho ví blockchain UnityWallet. 
Nhiệm vụ của bạn:
1. Phân tích dữ liệu giao dịch và đưa ra insights hữu ích
2. Gợi ý tiết kiệm và quản lý tài chính
3. Cảnh báo về các hoạt động bất thường
4. Trả lời bằng tiếng Việt thân thiện và dễ hiểu

Quy tắc:
- Luôn dựa trên dữ liệu thực tế được cung cấp
- Đưa ra lời khuyên thực tế và có thể thực hiện
- Giữ bảo mật thông tin cá nhân (mask địa chỉ)
- Sử dụng emoji phù hợp để tăng tính thân thiện
"""
    
    async def process_message(
        self, 
        request: ChatbotRequest,
        transactions: List[TransactionRecord],
        features: FeatureEngineering,
        anomalies: List[AnomalyDetection]
    ) -> ChatbotResponse:
        """Xử lý tin nhắn với LLM hoặc rule-based"""
        
        # Prepare context data
        context_data = self._prepare_context(transactions, features, anomalies)
        
        if self.use_gemini:
            response = await self._process_with_gemini(request.message, context_data)
        else:
            response = self._process_with_rules(request.message, context_data)
        
        suggestions = self._generate_smart_suggestions(context_data, request.message)
        
        return ChatbotResponse(
            response=response,
            suggestions=suggestions,
            data=context_data
        )
    
    def _prepare_context(
        self, 
        transactions: List[TransactionRecord],
        features: FeatureEngineering,
        anomalies: List[AnomalyDetection]
    ) -> Dict[str, Any]:
        """Chuẩn bị context data cho LLM"""
        
        # Calculate additional insights
        recent_txs = [
            tx for tx in transactions 
            if tx.timestamp >= datetime.now() - timedelta(days=7)
        ]
        
        outgoing_txs = [
            tx for tx in transactions 
            if tx.source == features.account and tx.amount
        ]
        
        incoming_txs = [
            tx for tx in transactions 
            if tx.destination == features.account and tx.amount
        ]
        
        # Spending pattern analysis
        total_spending = sum(tx.amount for tx in outgoing_txs)
        avg_spending_per_tx = total_spending / len(outgoing_txs) if outgoing_txs else 0
        
        # Asset analysis
        spending_by_asset = {}
        for tx in outgoing_txs:
            asset = str(tx.asset) if tx.asset else "XLM"
            spending_by_asset[asset] = spending_by_asset.get(asset, 0) + tx.amount
        
        # Risk assessment
        risk_score = self._calculate_risk_score(features, anomalies)
        
        # Savings potential
        savings_suggestions = self._analyze_savings_potential(features, transactions)
        
        return {
            "account_summary": {
                "total_transactions": features.total_transactions,
                "monthly_avg": features.transactions_per_month,
                "recent_activity": len(recent_txs),
                "total_spending": total_spending,
                "avg_spending": avg_spending_per_tx,
                "spending_by_asset": spending_by_asset
            },
            "risk_analysis": {
                "risk_score": risk_score,
                "anomaly_count": len(anomalies),
                "high_risk_anomalies": [a for a in anomalies if a.confidence_score > 0.8]
            },
            "behavioral_insights": {
                "peak_hours": features.peak_transaction_hours,
                "frequent_destinations": features.frequent_destinations[:3],
                "debt_ratio": features.debt_to_asset_ratio,
                "refund_frequency": features.refund_frequency
            },
            "savings_analysis": savings_suggestions,
            "balance_info": {
                "current_balances": features.avg_balance,
                "volatility": features.balance_volatility
            }
        }
    
    async def _process_with_gemini(self, message: str, context_data: Dict[str, Any]) -> str:
        """Xử lý với Gemini LLM"""
        try:
            # Prepare context for LLM
            context_summary = json.dumps(context_data, indent=2, ensure_ascii=False, default=str)
            
            prompt = f"""
{self.system_prompt}

Dữ liệu tài khoản người dùng:
{context_summary}

Câu hỏi của người dùng: {message}

Hãy phân tích và trả lời một cách thông minh, đưa ra insights và suggestions phù hợp. Trả lời bằng tiếng Việt.
"""
            
            response = self.gemini_model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            print(f"Gemini LLM Error: {e}")
            return self._process_with_rules(message, context_data)
    

    def _process_with_rules(self, message: str, context_data: Dict[str, Any]) -> str:
        """Fallback rule-based processing"""
        
        message_lower = message.lower()
        account_summary = context_data["account_summary"]
        risk_analysis = context_data["risk_analysis"]
        savings_analysis = context_data["savings_analysis"]
        
        # Intent detection
        if any(word in message_lower for word in ["số dư", "balance", "bao nhiêu tiền"]):
            return self._handle_balance_query(context_data)
        
        elif any(word in message_lower for word in ["tiết kiệm", "saving", "tiết kiệm"]):
            return self._handle_savings_query(savings_analysis)
        
        elif any(word in message_lower for word in ["bất thường", "nguy hiểm", "risk", "anomaly"]):
            return self._handle_risk_query(risk_analysis)
        
        elif any(word in message_lower for word in ["giao dịch", "transaction", "hoạt động"]):
            return self._handle_activity_query(account_summary)
        
        else:
            return self._generate_general_response(context_data)
    
    def _handle_balance_query(self, context_data: Dict[str, Any]) -> str:
        """Xử lý câu hỏi về số dư"""
        balances = context_data["balance_info"]["current_balances"]
        volatility = context_data["balance_info"]["volatility"]
        
        if not balances:
            return "💰 Tôi không thể truy cập thông tin số dư hiện tại. Hãy kiểm tra kết nối với blockchain."
        
        response = "💰 **Thông tin số dư của bạn:**\n\n"
        
        for asset, balance in balances.items():
            vol = volatility.get(asset, 0)
            vol_status = "📈 cao" if vol > 100 else "📊 ổn định" if vol > 10 else "📉 thấp"
            response += f"• {asset}: {balance:.2f} (biến động {vol_status})\n"
        
        # Add insights
        if len(balances) > 1:
            response += f"\n💡 Bạn đang đa dạng hóa với {len(balances)} loại tài sản - điều này rất tốt!"
        
        return response
    
    def _handle_savings_query(self, savings_analysis: Dict[str, Any]) -> str:
        """Xử lý câu hỏi về tiết kiệm"""
        
        if not savings_analysis["has_potential"]:
            return "💚 Tuyệt vời! Thói quen chi tiêu của bạn đã khá tối ưu. Hãy duy trì như vậy!"
        
        response = "💡 **Gợi ý tiết kiệm cho bạn:**\n\n"
        
        for suggestion in savings_analysis["suggestions"]:
            response += f"• {suggestion}\n"
        
        if savings_analysis["potential_savings"] > 0:
            response += f"\n📊 Tiềm năng tiết kiệm: ~{savings_analysis['potential_savings']:.2f} XLM/tháng"
        
        return response
    
    def _handle_risk_query(self, risk_analysis: Dict[str, Any]) -> str:
        """Xử lý câu hỏi về rủi ro"""
        
        risk_score = risk_analysis["risk_score"]
        anomaly_count = risk_analysis["anomaly_count"]
        
        if risk_score < 0.3:
            status_emoji = "✅"
            status_text = "AN TOÀN"
        elif risk_score < 0.7:
            status_emoji = "⚠️"
            status_text = "CẦN CHÚ Ý"
        else:
            status_emoji = "🚨"
            status_text = "NGUY HIỂM"
        
        response = f"{status_emoji} **Đánh giá rủi ro: {status_text}**\n\n"
        response += f"📊 Điểm rủi ro: {risk_score:.2f}/1.0\n"
        response += f"🔍 Phát hiện: {anomaly_count} hoạt động bất thường\n\n"
        
        if risk_analysis["high_risk_anomalies"]:
            response += "🚨 **Cảnh báo quan trọng:**\n"
            for anomaly in risk_analysis["high_risk_anomalies"][:2]:
                response += f"• {anomaly.description}\n"
        
        return response
    
    def _handle_activity_query(self, account_summary: Dict[str, Any]) -> str:
        """Xử lý câu hỏi về hoạt động"""
        
        total_txs = account_summary["total_transactions"]
        monthly_avg = account_summary["monthly_avg"]
        recent_activity = account_summary["recent_activity"]
        
        response = f"📊 **Tổng quan hoạt động:**\n\n"
        response += f"• Tổng giao dịch: {total_txs}\n"
        response += f"• Trung bình/tháng: {monthly_avg:.1f}\n"
        response += f"• Hoạt động 7 ngày qua: {recent_activity}\n\n"
        
        # Activity level assessment
        if monthly_avg >= 30:
            response += "🔥 Bạn là người dùng rất tích cực!"
        elif monthly_avg >= 10:
            response += "📈 Hoạt động của bạn khá ổn định"
        else:
            response += "💤 Bạn sử dụng ví khá ít, có thể tăng hoạt động?"
        
        return response
    
    def _generate_general_response(self, context_data: Dict[str, Any]) -> str:
        """Tạo response chung"""
        
        account_summary = context_data["account_summary"]
        risk_analysis = context_data["risk_analysis"]
        
        response = "🤖 **Tóm tắt tài khoản của bạn:**\n\n"
        response += f"💼 Tổng giao dịch: {account_summary['total_transactions']}\n"
        response += f"📊 Điểm rủi ro: {risk_analysis['risk_score']:.2f}/1.0\n"
        response += f"💰 Tổng chi tiêu: {account_summary['total_spending']:.2f}\n\n"
        
        response += "💡 **Hỏi tôi về:**\n"
        response += "• Số dư và tài sản\n"
        response += "• Gợi ý tiết kiệm\n" 
        response += "• Phân tích rủi ro\n"
        response += "• Thói quen giao dịch"
        
        return response
    
    def _calculate_risk_score(
        self, 
        features: FeatureEngineering,
        anomalies: List[AnomalyDetection]
    ) -> float:
        """Tính risk score tổng hợp"""
        
        base_score = 0.0
        
        # Anomaly-based risk
        if anomalies:
            anomaly_score = sum(a.confidence_score for a in anomalies) / len(anomalies)
            base_score += anomaly_score * 0.6
        
        # Frequency-based risk
        if features.transactions_per_month > 100:  # Very high frequency
            base_score += 0.3
        elif features.transactions_per_month > 50:
            base_score += 0.1
        
        # Debt ratio risk
        if features.debt_to_asset_ratio and features.debt_to_asset_ratio > 1.5:
            base_score += 0.2
        
        # Large transaction frequency
        if features.large_transaction_count > features.total_transactions * 0.1:
            base_score += 0.1
        
        return min(1.0, base_score)
    
    def _analyze_savings_potential(
        self, 
        features: FeatureEngineering,
        transactions: List[TransactionRecord]
    ) -> Dict[str, Any]:
        """Phân tích tiềm năng tiết kiệm"""
        
        suggestions = []
        potential_savings = 0.0
        
        outgoing_txs = [
            tx for tx in transactions 
            if tx.source == features.account and tx.amount
        ]
        
        if not outgoing_txs:
            return {"has_potential": False, "suggestions": [], "potential_savings": 0}
        
        # Analyze spending patterns
        total_spending = sum(tx.amount for tx in outgoing_txs)
        avg_tx_amount = total_spending / len(outgoing_txs)
        
        # High frequency, small amounts -> consolidation opportunity
        if features.transactions_per_month > 30 and avg_tx_amount < 10:
            suggestions.append("🔄 Gộp các giao dịch nhỏ để tiết kiệm phí transaction")
            potential_savings += features.transactions_per_month * 0.1  # Estimate fee savings
        
        # Weekend/unusual hour activity
        weekend_txs = [
            tx for tx in outgoing_txs 
            if tx.timestamp.weekday() >= 5
        ]
        
        if len(weekend_txs) > len(outgoing_txs) * 0.3:
            suggestions.append("📅 Lên kế hoạch giao dịch vào ngày thường để tránh chi tiêu bốc đồng")
        
        # Large transaction analysis
        if features.large_transaction_count > 5:
            suggestions.append("💡 Xem xét chia nhỏ các giao dịch lớn để quản lý rủi ro tốt hơn")
        
        # Refund frequency suggests inefficient spending
        if features.refund_frequency > 0.1:  # >10% refund rate
            suggestions.append("🎯 Cân nhắc kỹ trước khi giao dịch để giảm tần suất hoàn tiền")
            potential_savings += total_spending * features.refund_frequency * 0.1
        
        # Peak hour analysis
        if features.peak_transaction_hours and any(h in [2, 3, 4, 5] for h in features.peak_transaction_hours):
            suggestions.append("😴 Tránh giao dịch vào ban đêm khi có thể đưa ra quyết định thiếu cân nhắc")
        
        return {
            "has_potential": len(suggestions) > 0,
            "suggestions": suggestions,
            "potential_savings": potential_savings
        }
    
    def _generate_smart_suggestions(
        self, 
        context_data: Dict[str, Any], 
        last_message: str
    ) -> List[str]:
        """Tạo gợi ý thông minh dựa trên context"""
        
        suggestions = []
        account_summary = context_data["account_summary"]
        risk_analysis = context_data["risk_analysis"]
        
        # Context-aware suggestions
        if "tiết kiệm" in last_message.lower():
            suggestions.extend([
                "Phân tích thói quen chi tiêu của tôi",
                "Tôi có đang lãng phí tiền không?",
                "Gợi ý đầu tư an toàn"
            ])
        elif "rủi ro" in last_message.lower() or "bất thường" in last_message.lower():
            suggestions.extend([
                "Làm sao để bảo vệ tài khoản?",
                "Cách thiết lập cảnh báo bảo mật",
                "Kiểm tra giao dịch gần đây"
            ])
        else:
            # General suggestions based on account state
            if risk_analysis["risk_score"] > 0.5:
                suggestions.append("⚠️ Có hoạt động bất thường nào không?")
            
            if account_summary["monthly_avg"] > 20:
                suggestions.append("📊 Phân tích xu hướng giao dịch")
            
            suggestions.extend([
                "💰 Số dư hiện tại của tôi",
                "💡 Gợi ý tiết kiệm tiền",
                "📈 Tóm tắt hoạt động tháng này"
            ])
        
        return suggestions[:5]

# Singleton instance
enhanced_chatbot_service = EnhancedChatbotService()
