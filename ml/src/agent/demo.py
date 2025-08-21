"""
Complete Financial Copilot Demo
Demo tích hợp ML + LLM cho Unity Wallet
"""

import pandas as pd
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any

class FinancialCopilotDemo:
    """
    Demo Financial Copilot tích hợp ML với LLM
    Minh họa 3 use cases chính
    """
    
    def __init__(self):
        self.demo_data = self._create_demo_data()
        
    def _create_demo_data(self) -> pd.DataFrame:
        """Tạo dữ liệu demo realistic"""
        
        transactions = [
            # Travel expenses
            {"user_id": "user123", "amount": 2500000, "description": "vé máy bay đi Đà Nẵng", 
             "merchant": "VietJet", "category": "Travel", "date": "2024-08-15", "mcc": "3000"},
            {"user_id": "user123", "amount": 1200000, "description": "khách sạn 2 đêm", 
             "merchant": "Vinpearl Hotel", "category": "Travel", "date": "2024-08-16", "mcc": "7011"},
            
            # Food & Dining
            {"user_id": "user123", "amount": 150000, "description": "ăn phở bò", 
             "merchant": "Phở Hồng", "category": "F&B", "date": "2024-08-17", "mcc": "5812"},
            {"user_id": "user123", "amount": 85000, "description": "cafe sáng", 
             "merchant": "Highlands Coffee", "category": "F&B", "date": "2024-08-17", "mcc": "5814"},
            {"user_id": "user123", "amount": 320000, "description": "nhà hàng tối", 
             "merchant": "BBQ Garden", "category": "F&B", "date": "2024-08-17", "mcc": "5812"},
            
            # Shopping
            {"user_id": "user123", "amount": 450000, "description": "mua áo", 
             "merchant": "Zara", "category": "Shopping", "date": "2024-08-18", "mcc": "5651"},
            {"user_id": "user123", "amount": 890000, "description": "giày thể thao", 
             "merchant": "Nike Store", "category": "Shopping", "date": "2024-08-18", "mcc": "5661"},
            
            # Transportation
            {"user_id": "user123", "amount": 45000, "description": "grab về nhà", 
             "merchant": "Grab", "category": "Transportation", "date": "2024-08-18", "mcc": "4121"},
            {"user_id": "user123", "amount": 25000, "description": "xe bus", 
             "merchant": "SAMCO", "category": "Transportation", "date": "2024-08-18", "mcc": "4111"},
            
            # Suspicious transaction
            {"user_id": "user123", "amount": 15000000, "description": "unknown transaction", 
             "merchant": "ATM Unknown", "category": "Unknown", "date": "2024-08-18", "mcc": "6011"},
        ]
        
        return pd.DataFrame(transactions)
    
    def demo_chat_scenarios(self):
        """Demo các scenarios chat chính"""
        
        print("🤖 FINANCIAL COPILOT DEMO")
        print("=" * 50)
        
        scenarios = [
            {
                "question": "Tóm tắt chi tiêu tháng này của tôi",
                "intent": "spending_summary"
            },
            {
                "question": "Có giao dịch bất thường nào không?",
                "intent": "fraud_check"
            },
            {
                "question": "Gợi ý tiết kiệm 15% khi đi du lịch",
                "intent": "savings_advice"
            },
            {
                "question": "Phân tích danh mục chi tiêu của tôi",
                "intent": "category_analysis"
            }
        ]
        
        for i, scenario in enumerate(scenarios, 1):
            print(f"\\n📝 Scenario {i}: {scenario['question']}")
            print("-" * 40)
            
            response = self._process_chat_request(
                scenario["question"], 
                scenario["intent"],
                "user123"
            )
            
            print(f"🤖 AI Response:")
            print(f"   {response['ai_response']}")
            
            if response['actions']:
                print(f"\\n🎯 Suggested Actions:")
                for action in response['actions']:
                    print(f"   • {action['title']}: {action['description']}")
            
            if response['insights']:
                print(f"\\n📊 ML Insights:")
                for key, value in response['insights'].items():
                    if isinstance(value, (int, float)):
                        print(f"   • {key}: {value:,}")
                    else:
                        print(f"   • {key}: {value}")
    
    def _process_chat_request(self, question: str, intent: str, user_id: str) -> Dict:
        """Xử lý chat request và tạo response"""
        
        # Get ML insights
        insights = self._get_ml_insights(intent, user_id)
        
        # Generate AI response (simulated LLM)
        ai_response = self._generate_ai_response(question, intent, insights)
        
        # Get suggested actions
        actions = self._get_suggested_actions(intent, insights)
        
        return {
            "ai_response": ai_response,
            "insights": insights,
            "actions": actions,
            "intent": intent
        }
    
    def _get_ml_insights(self, intent: str, user_id: str) -> Dict:
        """Mô phỏng ML analysis"""
        
        user_data = self.demo_data[self.demo_data['user_id'] == user_id]
        
        insights = {}
        
        if intent in ["spending_summary", "category_analysis"]:
            # Spending analysis
            insights["total_amount"] = user_data['amount'].sum()
            insights["transaction_count"] = len(user_data)
            insights["avg_transaction"] = user_data['amount'].mean()
            
            # Category breakdown
            category_spending = user_data.groupby('category')['amount'].sum().to_dict()
            insights["categories"] = category_spending
            
            # Top merchants
            merchant_spending = user_data.groupby('merchant')['amount'].sum().head(3).to_dict()
            insights["top_merchants"] = merchant_spending
        
        elif intent == "fraud_check":
            # Anomaly detection simulation
            suspicious_txns = user_data[user_data['amount'] > 10000000]
            
            insights["fraud_detected"] = len(suspicious_txns) > 0
            insights["suspicious_transactions"] = len(suspicious_txns)
            
            if len(suspicious_txns) > 0:
                insights["suspicious_amount"] = suspicious_txns['amount'].iloc[0]
                insights["risk_level"] = "HIGH"
                insights["confidence"] = 0.92
        
        elif intent == "savings_advice":
            # Savings opportunities
            category_spending = user_data.groupby('category')['amount'].sum().to_dict()
            
            savings_potential = {}
            for category, amount in category_spending.items():
                if category == "Travel":
                    savings_potential[category] = amount * 0.15  # 15% savings
                elif category == "F&B":
                    savings_potential[category] = amount * 0.20  # 20% savings
                elif category == "Shopping":
                    savings_potential[category] = amount * 0.25  # 25% savings
            
            insights["savings_potential"] = savings_potential
            insights["total_savings"] = sum(savings_potential.values())
        
        return insights
    
    def _generate_ai_response(self, question: str, intent: str, insights: Dict) -> str:
        """Mô phỏng LLM response"""
        
        if intent == "spending_summary":
            total = insights.get("total_amount", 0)
            count = insights.get("transaction_count", 0)
            categories = insights.get("categories", {})
            
            top_category = max(categories.items(), key=lambda x: x[1]) if categories else ("N/A", 0)
            
            return f"""Tháng này bạn đã chi tiêu tổng cộng {total:,} VND qua {count} giao dịch.
            
Danh mục chi tiêu nhiều nhất là {top_category[0]} với {top_category[1]:,} VND.

Chi tiết theo danh mục:
{chr(10).join([f"• {cat}: {amount:,} VND" for cat, amount in categories.items()])}

Nhìn chung mức chi tiêu của bạn ở mức hợp lý, với xu hướng tập trung vào du lịch và ăn uống."""
        
        elif intent == "fraud_check":
            if insights.get("fraud_detected", False):
                suspicious_amount = insights.get("suspicious_amount", 0)
                confidence = insights.get("confidence", 0)
                
                return f"""⚠️ CẢNH BÁO: Phát hiện giao dịch bất thường!

Giao dịch đáng ngờ: {suspicious_amount:,} VND
Độ tin cậy: {confidence*100:.1f}%

Đây là giao dịch có giá trị cao bất thường so với thói quen chi tiêu của bạn. 
Vui lòng kiểm tra và xác thực giao dịch này.

Nếu không phải giao dịch của bạn, hãy khóa thẻ ngay lập tức!"""
            else:
                return "✅ Tất cả giao dịch của bạn đều bình thường. Không phát hiện hoạt động đáng ngờ nào."
        
        elif intent == "savings_advice":
            total_savings = insights.get("total_savings", 0)
            savings_potential = insights.get("savings_potential", {})
            
            tips = []
            if "Travel" in savings_potential:
                tips.append("✈️ Du lịch: Đặt vé sớm, sử dụng loyalty points, chọn ngày bay linh hoạt")
            if "F&B" in savings_potential:
                tips.append("🍜 Ăn uống: Nấu ăn tại nhà thường xuyên hơn, sử dụng voucher giảm giá")
            if "Shopping" in savings_potential:
                tips.append("🛍️ Mua sắm: Lập danh sách trước khi mua, chờ sale lớn")
            
            return f"""💰 Bạn có thể tiết kiệm {total_savings:,} VND (15%) mỗi tháng!

Cơ hội tiết kiệm theo danh mục:
{chr(10).join([f"• {cat}: {amount:,} VND" for cat, amount in savings_potential.items()])}

Gợi ý cụ thể:
{chr(10).join(tips)}

Với những thay đổi nhỏ này, bạn sẽ tiết kiệm được một khoản đáng kể!"""
        
        elif intent == "category_analysis":
            categories = insights.get("categories", {})
            total = sum(categories.values())
            
            analysis = []
            for cat, amount in sorted(categories.items(), key=lambda x: x[1], reverse=True):
                percentage = (amount / total * 100) if total > 0 else 0
                analysis.append(f"• {cat}: {amount:,} VND ({percentage:.1f}%)")
            
            return f"""📊 Phân tích chi tiêu theo danh mục:

{chr(10).join(analysis)}

Nhận xét:
- Chi tiêu chủ yếu tập trung vào du lịch và ăn uống
- Mức chi tiêu mua sắm ở mức vừa phải
- Có thể cân nhắc tối ưu hóa chi phí du lịch và ăn uống để tiết kiệm"""
        
        return "Tôi đang phân tích dữ liệu của bạn. Vui lòng đợi trong giây lát."
    
    def _get_suggested_actions(self, intent: str, insights: Dict) -> List[Dict]:
        """Tạo suggested actions"""
        
        actions = []
        
        if intent == "fraud_check" and insights.get("fraud_detected", False):
            actions = [
                {
                    "type": "security",
                    "action": "lock_card", 
                    "title": "Khóa thẻ ngay",
                    "description": "Khóa thẻ tạm thời để bảo vệ tài khoản"
                },
                {
                    "type": "verification",
                    "action": "verify_transaction",
                    "title": "Xác thực giao dịch", 
                    "description": "Xác nhận đây có phải giao dịch của bạn"
                },
                {
                    "type": "support",
                    "action": "contact_support",
                    "title": "Liên hệ hỗ trợ",
                    "description": "Gọi hotline 1900-xxxx để được hỗ trợ"
                }
            ]
        
        elif intent == "savings_advice":
            actions = [
                {
                    "type": "planning",
                    "action": "create_budget",
                    "title": "Tạo ngân sách",
                    "description": "Lập kế hoạch chi tiêu hàng tháng"
                },
                {
                    "type": "tracking",
                    "action": "set_alerts",
                    "title": "Cài cảnh báo",
                    "description": "Nhận thông báo khi chi tiêu vượt ngưỡng"
                }
            ]
        
        elif intent == "spending_summary":
            actions = [
                {
                    "type": "analysis",
                    "action": "detailed_report",
                    "title": "Báo cáo chi tiết",
                    "description": "Xem phân tích chi tiêu đầy đủ"
                },
                {
                    "type": "comparison",
                    "action": "compare_periods",
                    "title": "So sánh tháng trước",
                    "description": "Xem xu hướng thay đổi chi tiêu"
                }
            ]
        
        return actions
    
    def demo_widget_integration(self):
        """Demo widget integration cho dashboard"""
        
        print("\\n\\n🎛️ DASHBOARD WIDGETS DEMO")
        print("=" * 50)
        
        # Spending chart widget
        print("\\n📊 Spending Chart Widget:")
        categories = self._get_ml_insights("category_analysis", "user123")["categories"]
        
        print("   Biểu đồ danh mục chi tiêu:")
        for cat, amount in categories.items():
            bar_length = int(amount / 1000000)  # Scale for visualization
            bar = "█" * bar_length
            print(f"   {cat:12} │{bar} {amount:,} VND")
        
        # Fraud alert widget
        print("\\n🚨 Fraud Alert Widget:")
        fraud_insights = self._get_ml_insights("fraud_check", "user123")
        
        if fraud_insights.get("fraud_detected", False):
            print("   ⚠️  CẢNH BÁO GIAN LẬN")
            print(f"   Phát hiện {fraud_insights['suspicious_transactions']} giao dịch đáng ngờ")
            print("   [Khóa thẻ] [Xác thực] [Liên hệ]")
        else:
            print("   ✅ Tài khoản an toàn")
        
        # Quick insights widget
        print("\\n💡 Quick Insights Widget:")
        summary = self._get_ml_insights("spending_summary", "user123")
        
        print(f"   • Tổng chi tiêu: {summary['total_amount']:,} VND")
        print(f"   • Số giao dịch: {summary['transaction_count']}")
        print(f"   • Trung bình/giao dịch: {summary['avg_transaction']:,.0f} VND")
        
        # Savings opportunity widget
        savings = self._get_ml_insights("savings_advice", "user123")
        print(f"   • Tiềm năng tiết kiệm: {savings['total_savings']:,.0f} VND/tháng")

def main():
    """Main demo function"""
    
    demo = FinancialCopilotDemo()
    
    # Run chat scenarios demo
    demo.demo_chat_scenarios()
    
    # Run widget integration demo  
    demo.demo_widget_integration()
    
    print("\\n\\n🎉 Demo hoàn thành!")
    print("\\nTích hợp ML + LLM cho Financial Copilot bao gồm:")
    print("✅ Chat interface với AI")
    print("✅ Phân loại chi tiêu thông minh") 
    print("✅ Phát hiện gian lận real-time")
    print("✅ Gợi ý tiết kiệm cá nhân hóa")
    print("✅ Dashboard widgets tương tác")
    print("✅ Action buttons 1-tap")

if __name__ == "__main__":
    main()
