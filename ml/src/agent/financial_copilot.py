"""
Financial Copilot - AI Assistant tích hợp ML và LLM
Kết hợp ML insights với natural language processing
"""

import json
import pandas as pd
import requests
import subprocess
import time
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta

# Local imports
from ..models.anomaly import AnomalyDetector
from ..models.credit_score import CreditScoreModel  
from ..models.spend_clf import SpendClassifier
from ..rules.insights import InsightGenerator

class FinancialCopilot:
    """
    AI Financial Assistant combining ML insights with LLM conversation
    Optimized for Acer Nitro 5 with local LLM support
    Supports Vietnamese language and multiple LLM providers
    """
    
    def __init__(self, models_path: str = "artifacts/models", 
                 optimize_for_nitro5: bool = True):
        # Load ML models
        self.anomaly_detector = AnomalyDetector(models_path)
        self.credit_scorer = CreditScoreModel(models_path) 
        self.spend_classifier = SpendClassifier(models_path)
        self.insight_generator = InsightGenerator()
        
        # Nitro 5 optimization
        self.nitro5_mode = optimize_for_nitro5
        if self.nitro5_mode:
            self._setup_nitro5_config()
        
        # Initialize LLM providers
        self._setup_llm_providers()
        
        # Vietnamese financial prompts
        self.prompts = {
            "greeting": """Xin chào! Tôi là trợ lý tài chính AI của Unity Wallet. 
                         Tôi có thể giúp bạn:
                         • 📊 Phân tích giao dịch và chi tiêu
                         • 🔍 Phát hiện gian lận
                         • 💰 Tư vấn tiết kiệm và đầu tư  
                         • 📈 Đánh giá tín dụng
                         Bạn cần hỗ trợ gì ạ?""",
                         
            "analysis": """Dựa trên dữ liệu giao dịch của bạn:
                          {ml_insights}
                          
                          Hãy trả lời câu hỏi: {user_question}
                          
                          Đưa ra lời khuyên cụ thể và thực tế cho người Việt Nam.""",
                          
            "fraud_alert": """⚠️ CẢNH BÁO GIAN LẬN:
                             Phát hiện giao dịch bất thường:
                             {transaction_details}
                             
                             Đánh giá rủi ro: {risk_level}
                             Lý do: {reason}
                             
                             Bạn có nhận ra giao dịch này không?""",
                             
            "savings_advice": """💡 LỜI KHUYÊN TIẾT KIỆM:
                               Phân tích chi tiêu của bạn:
                               {spending_analysis}
                               
                               Đề xuất tiết kiệm:
                               {savings_suggestions}"""
        }
    
    def _setup_nitro5_config(self):
        """Setup optimal configuration for Acer Nitro 5"""
        self.nitro5_config = {
            "primary_model": "phi3:mini",        # Best balance cho Nitro 5
            "fallback_model": "gemma:2b",        # Speed backup
            "cloud_backup": "groq_llama",        # Free cloud option
            
            # Performance settings
            "max_tokens": 300,                   # Shorter responses 
            "temperature": 0.7,                  # Good balance
            "context_window": 2048,              # Enough cho financial data
            "timeout_seconds": 10,               # Reasonable cho Nitro 5
            
            # Model routing cho different tasks
            "routing": {
                "simple_queries": "gemma:2b",     # "Bao nhiêu tiền?"
                "complex_analysis": "phi3:mini",   # Financial analysis
                "fraud_detection": "phi3:mini",    # Cần reasoning
                "savings_advice": "phi3:mini"      # Context understanding
            }
        }
    
    def _setup_llm_providers(self):
        """Setup LLM providers for Financial Copilot"""
        self.llm_providers = {
            "ollama": {
                "enabled": True,
                "models": ["phi3:mini", "gemma:2b", "llama3:8b"],
                "endpoint": "http://localhost:11434"
            },
            "groq": {
                "enabled": False,  # Requires API key
                "models": ["llama3-8b-8192", "gemma-7b-it"],
                "api_key": None
            },
            "openai": {
                "enabled": False,  # Requires API key
                "models": ["gpt-3.5-turbo", "gpt-4"],
                "api_key": None
            }
        }
    
    def _check_ollama_available(self) -> bool:
        """Check if Ollama is running"""
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def _get_ollama_models(self) -> List[str]:
        """Get available Ollama models"""
        try:
            result = subprocess.run(['ollama', 'list'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')[1:]  # Skip header
                models = [line.split()[0] for line in lines if line.strip()]
                return models
        except:
            pass
        return []
    
    def _ollama_chat(self, model: str, prompt: str, context: str = "") -> str:
        """Chat with Ollama model"""
        try:
            full_prompt = f"{context}\n\n{prompt}" if context else prompt
            
            result = subprocess.run([
                'ollama', 'run', model, '--', full_prompt
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                return result.stdout.strip()
            else:
                return f"Error: {result.stderr.strip()}"
                
        except subprocess.TimeoutExpired:
            return "Error: Response timeout"
        except Exception as e:
            return f"Error: {str(e)}"
    
    def _route_to_best_model(self, intent: str, complexity: str) -> str:
        """Route to best available model based on intent and complexity"""
        
        if not self.nitro5_mode:
            # Default routing if not optimized for Nitro 5
            return "phi3:mini"
        
        routing = self.nitro5_config["routing"]
        available_models = self._get_ollama_models()
        
        # Get preferred model for this intent
        if intent in routing:
            preferred = routing[intent]
        elif complexity == "simple":
            preferred = "gemma:2b"
        elif complexity == "complex":
            preferred = "phi3:mini"
        else:
            preferred = self.nitro5_config["primary_model"]
        
        # Check if preferred model is available
        if preferred in available_models:
            return preferred
        
        # Fallback hierarchy
        fallback_order = ["phi3:mini", "gemma:2b", "llama3:8b"]
        for model in fallback_order:
            if model in available_models:
                return model
        
        # No local models available
        return None
    
    def chat(self, user_message: str, user_id: str, transactions_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Main chat interface combining ML analysis with LLM response
        """
        
        # 1. Analyze user intent
        intent = self._analyze_intent(user_message)
        
        # 2. Get ML insights based on intent  
        ml_context = self._get_ml_context(intent, user_id, transactions_df)
        
        # 3. Route to best model
        model = self._route_to_best_model(intent, ml_context.get('complexity', 'medium'))
        
        if not model:
            return {
                "response": "Xin lỗi, tôi không thể kết nối với AI model. Vui lòng thử lại sau.",
                "intent": intent,
                "ml_insights": ml_context,
                "model_used": None,
                "timestamp": datetime.now().isoformat()
            }
        
        # 4. Generate context-aware prompt
        prompt = self._build_prompt(intent, user_message, ml_context)
        
        # 5. Get LLM response
        llm_response = self._ollama_chat(model, prompt)
        
        # 6. Format final response
        return {
            "response": llm_response,
            "intent": intent,
            "ml_insights": ml_context,
            "model_used": model,
            "suggestions": self._generate_suggestions(intent, ml_context),
            "timestamp": datetime.now().isoformat()
        }
    
    def _analyze_intent(self, user_message: str) -> str:
        """Analyze user intent from message"""
        message_lower = user_message.lower()
        
        # Fraud detection keywords
        if any(word in message_lower for word in ['lừa đảo', 'gian lận', 'fraud', 'bất thường', 'đáng nghi']):
            return 'fraud_detection'
        
        # Credit score keywords  
        if any(word in message_lower for word in ['tín dụng', 'credit', 'điểm tín dụng', 'vay vốn']):
            return 'credit_analysis'
        
        # Spending analysis keywords
        if any(word in message_lower for word in ['chi tiêu', 'spending', 'tiêu dùng', 'phân tích']):
            return 'spending_analysis'
        
        # Savings advice keywords
        if any(word in message_lower for word in ['tiết kiệm', 'saving', 'đầu tư', 'invest']):
            return 'savings_advice'
        
        # Simple queries
        if any(word in message_lower for word in ['bao nhiêu', 'số dư', 'balance', 'tổng']):
            return 'simple_queries'
        
        return 'general'
    
    def _get_ml_context(self, intent: str, user_id: str, transactions_df: pd.DataFrame) -> Dict[str, Any]:
        """Get ML insights based on intent"""
        
        if transactions_df.empty:
            return {"complexity": "simple", "insights": "Không có dữ liệu giao dịch"}
        
        context = {"complexity": "medium"}
        
        try:
            if intent == 'fraud_detection':
                # Run anomaly detection
                anomalies = self.anomaly_detector.detect_anomalies(transactions_df)
                context.update({
                    "complexity": "complex",
                    "anomalies_count": len(anomalies),
                    "risk_level": "High" if len(anomalies) > 0 else "Low",
                    "suspicious_transactions": anomalies.to_dict('records') if len(anomalies) > 0 else []
                })
                
            elif intent == 'credit_analysis':
                # Run credit scoring  
                credit_score = self.credit_scorer.predict_credit_score(transactions_df)
                context.update({
                    "complexity": "complex", 
                    "credit_score": credit_score,
                    "credit_rating": self._get_credit_rating(credit_score)
                })
                
            elif intent == 'spending_analysis':
                # Run spending classification
                spending_insights = self.spend_classifier.analyze_spending(transactions_df)
                context.update({
                    "complexity": "medium",
                    "spending_by_category": spending_insights,
                    "total_spending": transactions_df['amount'].sum(),
                    "transaction_count": len(transactions_df)
                })
                
            elif intent == 'savings_advice':
                # Generate savings insights
                insights = self.insight_generator.generate_insights(transactions_df)
                context.update({
                    "complexity": "medium",
                    "savings_potential": insights.get('savings_potential', 0),
                    "recommendations": insights.get('recommendations', [])
                })
                
            else:
                # Simple queries
                context.update({
                    "complexity": "simple",
                    "balance": transactions_df['amount'].sum(),
                    "recent_transactions": len(transactions_df)
                })
                
        except Exception as e:
            context["error"] = f"ML analysis error: {str(e)}"
            
        return context
    
    def _build_prompt(self, intent: str, user_message: str, ml_context: Dict[str, Any]) -> str:
        """Build context-aware prompt for LLM"""
        
        # Base prompt in Vietnamese
        if intent == 'fraud_detection':
            prompt_template = self.prompts["fraud_alert"]
            return prompt_template.format(
                transaction_details=ml_context.get('suspicious_transactions', []),
                risk_level=ml_context.get('risk_level', 'Unknown'),
                reason="Phát hiện bởi ML model"
            )
            
        elif intent in ['spending_analysis', 'credit_analysis', 'savings_advice']:
            prompt_template = self.prompts["analysis"] 
            ml_insights = f"""
            📊 Phân tích ML:
            - Intent: {intent}
            - Dữ liệu: {ml_context}
            """
            return prompt_template.format(
                ml_insights=ml_insights,
                user_question=user_message
            )
        
        else:
            # General conversation
            return f"""
            Bạn là trợ lý tài chính AI của Unity Wallet. 
            Câu hỏi của người dùng: {user_message}
            
            Dữ liệu từ ML: {ml_context}
            
            Hãy trả lời bằng tiếng Việt một cách thân thiện và hữu ích.
            """
    
    def _get_credit_rating(self, score: float) -> str:
        """Convert credit score to rating"""
        if score >= 0.8:
            return "Xuất sắc"
        elif score >= 0.7:
            return "Tốt"
        elif score >= 0.6:
            return "Khá"
        elif score >= 0.5:
            return "Trung bình"
        else:
            return "Cần cải thiện"
    
    def _generate_suggestions(self, intent: str, ml_context: Dict[str, Any]) -> List[str]:
        """Generate actionable suggestions"""
        
        suggestions = []
        
        if intent == 'fraud_detection':
            if ml_context.get('risk_level') == 'High':
                suggestions = [
                    "🔒 Khóa thẻ ngay lập tức",
                    "📞 Gọi hotline ngân hàng", 
                    "📍 Báo cáo vị trí bất thường"
                ]
        
        elif intent == 'savings_advice':
            suggestions = [
                "💰 Thiết lập mục tiêu tiết kiệm",
                "📊 Theo dõi chi tiêu hàng ngày",
                "🎯 Tạo ngân sách chi tiêu"
            ]
        
        elif intent == 'credit_analysis':
            score = ml_context.get('credit_score', 0)
            if score < 0.6:
                suggestions = [
                    "📈 Cải thiện lịch sử thanh toán",
                    "💳 Sử dụng thẻ tín dụng hợp lý",
                    "🏦 Xây dựng mối quan hệ với ngân hàng"
                ]
        
        return suggestions
        
        # 3. Generate LLM response with ML context
        response = self._generate_llm_response(user_message, ml_context)
        
        # 4. Add action suggestions if needed
        actions = self._suggest_actions(intent, ml_context)
        
        return {
            "response": response,
            "intent": intent,
            "actions": actions,
            "ml_insights": ml_context,
            "timestamp": datetime.now().isoformat()
        }
    
    def _analyze_intent(self, message: str) -> str:
        """Classify user intent from message"""
        
        message_lower = message.lower()
        
        # Intent patterns in Vietnamese
        intent_patterns = {
            "spending_summary": ["tóm tắt", "chi tiêu", "tháng này", "báo cáo", "thống kê"],
            "savings_advice": ["tiết kiệm", "gợi ý", "lời khuyên", "giảm chi tiêu", "tối ưu"],
            "fraud_check": ["gian lận", "bất thường", "an toàn", "khóa thẻ", "cảnh báo"],
            "category_analysis": ["danh mục", "phân loại", "biểu đồ", "xu hướng"],
            "credit_inquiry": ["điểm tín dụng", "vay vốn", "tín nhiệm", "credit score"],
            "general_question": ["là gì", "như thế nào", "giải thích", "tại sao"]
        }
        
        for intent, keywords in intent_patterns.items():
            if any(keyword in message_lower for keyword in keywords):
                return intent
        
        return "general_question"
    
    def _get_ml_context(self, intent: str, user_id: str, transactions_df: pd.DataFrame) -> Dict[str, Any]:
        """Get relevant ML insights based on intent"""
        
        context = {}
        
        if intent in ["spending_summary", "category_analysis"]:
            # Get spending insights
            insights = self.insight_generator.generate_insights(user_id, transactions_df)
            context.update(insights)
            
            # Add category breakdown
            user_txns = transactions_df[transactions_df['user_id'] == user_id]
            if not user_txns.empty:
                context["category_spending"] = self._analyze_categories(user_txns)
        
        elif intent == "fraud_check":
            # Get anomaly analysis
            user_txns = transactions_df[transactions_df['user_id'] == user_id]
            if not user_txns.empty:
                latest_txn = user_txns.iloc[-1].to_dict()
                anomaly_result = self.anomaly_detector.predict_anomaly(
                    user_id, latest_txn, transactions_df
                )
                context["fraud_analysis"] = anomaly_result
        
        elif intent == "credit_inquiry":
            # Get credit score analysis
            credit_result = self.credit_scorer.predict_score(user_id, transactions_df)
            context["credit_analysis"] = credit_result
        
        elif intent == "savings_advice":
            # Get spending patterns for savings advice
            insights = self.insight_generator.generate_insights(user_id, transactions_df)
            context["savings_opportunities"] = self._identify_savings_opportunities(insights)
        
        return context
    
    def _generate_llm_response(self, user_message: str, ml_context: Dict) -> str:
        """Generate natural language response using LLM with ML context"""
        
        # Format ML context for LLM
        context_text = self._format_ml_context(ml_context)
        
        # Create prompt
        prompt = f"""
        {self.system_prompt}
        
        Dữ liệu phân tích ML:
        {context_text}
        
        Câu hỏi của người dùng: {user_message}
        
        Hãy trả lời dựa trên dữ liệu phân tích trên:
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": f"Dữ liệu: {context_text}\n\nCâu hỏi: {user_message}"}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            # Fallback to rule-based response
            return self._generate_fallback_response(user_message, ml_context)
    
    def _format_ml_context(self, context: Dict) -> str:
        """Format ML context for LLM consumption"""
        
        formatted_parts = []
        
        if "total_amount" in context:
            formatted_parts.append(f"Tổng chi tiêu: {context['total_amount']:,.0f} VND")
        
        if "category_spending" in context:
            cat_text = ", ".join([f"{k}: {v:,.0f} VND" for k, v in context['category_spending'].items()])
            formatted_parts.append(f"Chi tiêu theo danh mục: {cat_text}")
        
        if "fraud_analysis" in context:
            fraud = context["fraud_analysis"]
            formatted_parts.append(f"Phân tích gian lận: {fraud.get('risk_level', 'Bình thường')}")
        
        if "credit_analysis" in context:
            credit = context["credit_analysis"]
            formatted_parts.append(f"Điểm tín dụng: {credit.get('score', 'N/A')}")
        
        return ". ".join(formatted_parts)
    
    def _generate_fallback_response(self, user_message: str, ml_context: Dict) -> str:
        """Fallback response when LLM is not available"""
        
        if "total_amount" in ml_context:
            return f"Tổng chi tiêu của bạn là {ml_context['total_amount']:,.0f} VND. Tôi có thể giúp bạn phân tích chi tiết hơn."
        
        return "Tôi đang phân tích dữ liệu của bạn. Vui lòng đợi một chút hoặc hỏi cụ thể hơn."
    
    def _analyze_categories(self, transactions_df: pd.DataFrame) -> Dict[str, float]:
        """Analyze spending by category"""
        
        if transactions_df.empty:
            return {}
        
        # Classify transactions
        category_spending = {}
        for _, txn in transactions_df.iterrows():
            category = self.spend_classifier.predict_category(
                txn.get('description', ''),
                txn.get('merchant', ''),
                txn.get('mcc', ''),
                txn.get('amount', 0)
            )
            
            if category not in category_spending:
                category_spending[category] = 0
            category_spending[category] += float(txn.get('amount', 0))
        
        return category_spending
    
    def _identify_savings_opportunities(self, insights: Dict) -> List[str]:
        """Identify potential savings opportunities"""
        
        opportunities = []
        
        if insights.get('high_frequency_merchants'):
            opportunities.append("Có thể tiết kiệm từ các merchant thường xuyên")
        
        if insights.get('weekend_spending_high'):
            opportunities.append("Chi tiêu cuối tuần cao, có thể cân nhắc giảm")
        
        return opportunities
    
    def _suggest_actions(self, intent: str, ml_context: Dict) -> List[Dict[str, str]]:
        """Suggest actionable items based on intent and context"""
        
        actions = []
        
        if intent == "fraud_check":
            fraud = ml_context.get("fraud_analysis", {})
            if fraud.get("is_anomaly", False):
                actions.append({
                    "type": "security",
                    "title": "Khóa thẻ tạm thời",
                    "description": "Phát hiện giao dịch bất thường",
                    "action": "lock_card"
                })
        
        elif intent == "savings_advice":
            actions.append({
                "type": "savings",
                "title": "Xem báo cáo chi tiết",
                "description": "Phân tích chi tiêu theo danh mục",
                "action": "view_spending_report"
            })
        
        return actions

# Usage Examples
def demo_financial_copilot():
    """Demo examples"""
    
    # Sample data
    transactions = pd.DataFrame([
        {"user_id": "user123", "amount": 50000, "description": "ăn phở", "merchant": "Phở Hồng"},
        {"user_id": "user123", "amount": 2000000, "description": "mua laptop", "merchant": "FPT Shop"}
    ])
    
    copilot = FinancialCopilot()
    
    # Example conversations
    examples = [
        "Tóm tắt chi tiêu tháng này của tôi",
        "Có giao dịch bất thường nào không?",
        "Gợi ý tiết kiệm 15% cho tôi",
        "Điểm tín dụng của tôi như thế nào?"
    ]
    
    for question in examples:
        response = copilot.chat(question, "user123", transactions)
        print(f"Q: {question}")
        print(f"A: {response['response']}")
        print(f"Actions: {response['actions']}")
        print("---")

if __name__ == "__main__":
    demo_financial_copilot()
