"""
Chatbot Service
Trợ lý AI để trả lời câu hỏi về giao dịch và phân tích
"""

import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from ml.models.schemas import (
    TransactionRecord, FeatureEngineering, AnomalyDetection,
    ChatbotRequest, ChatbotResponse
)

class ChatbotService:
    """AI Assistant cho phân tích giao dịch và trả lời câu hỏi"""
    
    def __init__(self):
        self.context_cache = {}  # Cache để lưu context conversations
        
        # Predefined intents and patterns
        self.intents = {
            "balance_inquiry": [
                r"số dư", r"balance", r"bao nhiêu tiền", r"có bao nhiêu"
            ],
            "transaction_count": [
                r"bao nhiêu giao dịch", r"số lượng giao dịch", r"transaction count"
            ],
            "spending_analysis": [
                r"chi tiêu", r"spending", r"tiêu bao nhiêu", r"đã gửi"
            ],
            "anomaly_check": [
                r"bất thường", r"anomaly", r"suspicious", r"đáng ngờ"
            ],
            "time_analysis": [
                r"thời gian", r"khi nào", r"time", r"ngày", r"tháng"
            ],
            "frequent_destinations": [
                r"gửi tiền cho ai", r"destination", r"người nhận"
            ]
        }
    
    def process_message(
        self, 
        request: ChatbotRequest,
        transactions: List[TransactionRecord],
        features: FeatureEngineering,
        anomalies: List[AnomalyDetection]
    ) -> ChatbotResponse:
        """Xử lý tin nhắn và trả lời dựa trên dữ liệu"""
        
        message = request.message.lower()
        intent = self._detect_intent(message)
        
        response_data = {}
        
        if intent == "balance_inquiry":
            response, data = self._handle_balance_inquiry(message, features)
        elif intent == "transaction_count":
            response, data = self._handle_transaction_count(message, features, transactions)
        elif intent == "spending_analysis":
            response, data = self._handle_spending_analysis(message, transactions, features)
        elif intent == "anomaly_check":
            response, data = self._handle_anomaly_check(message, anomalies)
        elif intent == "time_analysis":
            response, data = self._handle_time_analysis(message, transactions, features)
        elif intent == "frequent_destinations":
            response, data = self._handle_destinations(message, features)
        else:
            response, data = self._handle_general_query(message, transactions, features, anomalies)
        
        suggestions = self._generate_suggestions(intent, transactions, features)
        
        return ChatbotResponse(
            response=response,
            suggestions=suggestions,
            data=data
        )
    
    def _detect_intent(self, message: str) -> str:
        """Phát hiện intent từ message"""
        for intent, patterns in self.intents.items():
            for pattern in patterns:
                if re.search(pattern, message, re.IGNORECASE):
                    return intent
        return "general"
    
    def _handle_balance_inquiry(self, message: str, features: FeatureEngineering) -> tuple:
        """Xử lý câu hỏi về số dư"""
        if not features.avg_balance:
            return "Tôi không có thông tin về số dư hiện tại.", {}
        
        balance_info = []
        for asset, balance in features.avg_balance.items():
            balance_info.append(f"- {asset}: {balance:.2f}")
        
        response = f"Số dư trung bình của bạn:\n" + "\n".join(balance_info)
        
        # Thêm thông tin về biến động
        if features.balance_volatility:
            volatile_assets = [
                asset for asset, vol in features.balance_volatility.items() 
                if vol > 100  # Threshold for high volatility
            ]
            if volatile_assets:
                response += f"\n\nTài sản có biến động cao: {', '.join(volatile_assets)}"
        
        return response, {"balance_details": features.avg_balance}
    
    def _handle_transaction_count(
        self, 
        message: str, 
        features: FeatureEngineering, 
        transactions: List[TransactionRecord]
    ) -> tuple:
        """Xử lý câu hỏi về số lượng giao dịch"""
        
        # Extract time period from message
        period = self._extract_time_period(message)
        
        if period == "month":
            count = features.transactions_per_month
            response = f"Bạn có trung bình {count:.1f} giao dịch mỗi tháng."
        else:
            count = features.total_transactions
            period_days = (features.period_end - features.period_start).days
            response = f"Bạn có {count} giao dịch trong {period_days} ngày qua."
        
        # Thêm breakdown theo loại
        breakdown = {
            "payment": features.payment_count,
            "swap": features.swap_count,
            "other": features.total_transactions - features.payment_count - features.swap_count
        }
        
        response += f"\n\nPhân loại:\n"
        response += f"- Payment: {breakdown['payment']}\n"
        response += f"- Swap: {breakdown['swap']}\n"
        response += f"- Khác: {breakdown['other']}"
        
        return response, {"transaction_breakdown": breakdown}
    
    def _handle_spending_analysis(
        self, 
        message: str, 
        transactions: List[TransactionRecord],
        features: FeatureEngineering
    ) -> tuple:
        """Phân tích chi tiêu"""
        
        # Tính tổng chi tiêu (outgoing transactions)
        outgoing_txs = [
            tx for tx in transactions 
            if tx.source == features.account and tx.amount
        ]
        
        if not outgoing_txs:
            return "Không có giao dịch chi tiêu nào trong khoảng thời gian này.", {}
        
        # Group by asset
        spending_by_asset = {}
        for tx in outgoing_txs:
            asset_key = str(tx.asset) if tx.asset else "XLM"
            spending_by_asset[asset_key] = spending_by_asset.get(asset_key, 0) + tx.amount
        
        total_spending = sum(spending_by_asset.values())
        
        response = f"Tổng chi tiêu: {total_spending:.2f}\n\nChi tiết theo tài sản:\n"
        for asset, amount in sorted(spending_by_asset.items(), key=lambda x: x[1], reverse=True):
            percentage = (amount / total_spending) * 100
            response += f"- {asset}: {amount:.2f} ({percentage:.1f}%)\n"
        
        # Thêm insight về patterns
        if features.frequent_destinations:
            response += f"\nBạn thường gửi tiền cho: {', '.join(features.frequent_destinations[:3])}"
        
        return response, {"spending_by_asset": spending_by_asset}
    
    def _handle_anomaly_check(self, message: str, anomalies: List[AnomalyDetection]) -> tuple:
        """Kiểm tra và báo cáo anomalies"""
        
        if not anomalies:
            return "Không phát hiện hoạt động bất thường nào. Tài khoản của bạn có vẻ an toàn! ✅", {}
        
        # Group anomalies by type
        anomaly_groups = {}
        for anomaly in anomalies:
            anomaly_type = anomaly.anomaly_type
            if anomaly_type not in anomaly_groups:
                anomaly_groups[anomaly_type] = []
            anomaly_groups[anomaly_type].append(anomaly)
        
        response = f"⚠️ Phát hiện {len(anomalies)} hoạt động bất thường:\n\n"
        
        for anomaly_type, group_anomalies in anomaly_groups.items():
            type_name = self._translate_anomaly_type(anomaly_type)
            response += f"{type_name}: {len(group_anomalies)} trường hợp\n"
            
            # Show top 2 most confident
            top_anomalies = sorted(group_anomalies, key=lambda x: x.confidence_score, reverse=True)[:2]
            for anomaly in top_anomalies:
                response += f"  • {anomaly.description}\n"
        
        response += f"\n💡 Khuyến nghị: Xem xét kỹ các giao dịch được đánh dấu và đảm bảo chúng do bạn thực hiện."
        
        return response, {"anomaly_summary": anomaly_groups}
    
    def _handle_time_analysis(
        self, 
        message: str, 
        transactions: List[TransactionRecord],
        features: FeatureEngineering
    ) -> tuple:
        """Phân tích theo thời gian"""
        
        response = "📊 Phân tích hoạt động theo thời gian:\n\n"
        
        # Peak hours
        if features.peak_transaction_hours:
            hours_str = [f"{h:02d}:00" for h in features.peak_transaction_hours]
            response += f"Giờ giao dịch nhiều nhất: {', '.join(hours_str)}\n"
        
        # Recent activity
        recent_txs = [
            tx for tx in transactions 
            if tx.timestamp >= datetime.now() - timedelta(days=7)
        ]
        
        response += f"Giao dịch 7 ngày qua: {len(recent_txs)}\n"
        
        # Daily pattern
        if len(transactions) >= 14:  # At least 2 weeks of data
            weekday_txs = [tx for tx in transactions if tx.timestamp.weekday() < 5]
            weekend_txs = [tx for tx in transactions if tx.timestamp.weekday() >= 5]
            
            weekday_avg = len(weekday_txs) / 5 if weekday_txs else 0
            weekend_avg = len(weekend_txs) / 2 if weekend_txs else 0
            
            response += f"Trung bình ngày thường: {weekday_avg:.1f} giao dịch/ngày\n"
            response += f"Trung bình cuối tuần: {weekend_avg:.1f} giao dịch/ngày\n"
        
        return response, {
            "peak_hours": features.peak_transaction_hours,
            "recent_activity": len(recent_txs)
        }
    
    def _handle_destinations(self, message: str, features: FeatureEngineering) -> tuple:
        """Phân tích về destinations"""
        
        if not features.frequent_destinations:
            return "Bạn chưa có giao dịch gửi tiền thường xuyên nào.", {}
        
        response = "🎯 Địa chỉ bạn thường gửi tiền:\n\n"
        
        for i, dest in enumerate(features.frequent_destinations[:5], 1):
            # Mask address for privacy
            masked_dest = dest[:8] + "..." + dest[-8:] if len(dest) > 16 else dest
            response += f"{i}. {masked_dest}\n"
        
        return response, {"frequent_destinations": features.frequent_destinations}
    
    def _handle_general_query(
        self, 
        message: str, 
        transactions: List[TransactionRecord],
        features: FeatureEngineering,
        anomalies: List[AnomalyDetection]
    ) -> tuple:
        """Xử lý câu hỏi chung"""
        
        # Generate general summary
        response = f"📈 Tóm tắt hoạt động tài khoản:\n\n"
        response += f"• Tổng giao dịch: {features.total_transactions}\n"
        response += f"• Trung bình/tháng: {features.transactions_per_month:.1f}\n"
        
        if anomalies:
            response += f"• Cảnh báo: {len(anomalies)} hoạt động bất thường\n"
        else:
            response += f"• Trạng thái: An toàn ✅\n"
        
        if features.debt_to_asset_ratio:
            response += f"• Tỷ lệ chi/thu: {features.debt_to_asset_ratio:.2f}\n"
        
        response += f"\n💡 Hỏi tôi về: số dư, giao dịch, chi tiêu, hoạt động bất thường..."
        
        return response, {
            "summary": {
                "total_transactions": features.total_transactions,
                "monthly_avg": features.transactions_per_month,
                "anomaly_count": len(anomalies)
            }
        }
    
    def _extract_time_period(self, message: str) -> str:
        """Extract time period from message"""
        if re.search(r"tháng|month", message, re.IGNORECASE):
            return "month"
        elif re.search(r"tuần|week", message, re.IGNORECASE):
            return "week"
        elif re.search(r"ngày|day", message, re.IGNORECASE):
            return "day"
        return "total"
    
    def _translate_anomaly_type(self, anomaly_type: str) -> str:
        """Translate anomaly type to Vietnamese"""
        translations = {
            "unusual_amount": "Số tiền bất thường",
            "high_frequency": "Tần suất cao",
            "unusual_time": "Thời gian bất thường",
            "rapid_transactions": "Giao dịch liên tiếp",
            "ml_detected": "Phát hiện bởi AI",
            "round_number_bias": "Pattern số tròn",
            "weekend_activity": "Hoạt động cuối tuần"
        }
        return translations.get(anomaly_type, anomaly_type)
    
    def _generate_suggestions(
        self, 
        intent: str, 
        transactions: List[TransactionRecord],
        features: FeatureEngineering
    ) -> List[str]:
        """Generate contextual suggestions"""
        
        suggestions = []
        
        # Base suggestions
        base_suggestions = [
            "Số dư hiện tại của tôi",
            "Có hoạt động bất thường nào không?",
            "Tôi đã chi tiêu bao nhiêu tháng này?",
            "Phân tích giao dịch của tôi"
        ]
        
        # Context-specific suggestions
        if intent == "balance_inquiry":
            suggestions.extend([
                "Biến động số dư như thế nào?",
                "So sánh với tháng trước"
            ])
        elif intent == "anomaly_check":
            suggestions.extend([
                "Làm sao để bảo mật tài khoản?",
                "Cách thiết lập cảnh báo"
            ])
        elif len(transactions) > 50:
            suggestions.extend([
                "Xu hướng giao dịch của tôi",
                "Địa chỉ tôi gửi tiền nhiều nhất"
            ])
        
        # Combine and limit
        all_suggestions = base_suggestions + suggestions
        return all_suggestions[:5]  # Limit to 5 suggestions

# Singleton instance
chatbot_service = ChatbotService()
