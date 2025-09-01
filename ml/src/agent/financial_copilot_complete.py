"""
Financial Copilot - AI Assistant tích hợp ML và LLM
Kết hợp ML insights với natural language processing
Optimized cho Acer Nitro 5
"""

import json
import pandas as pd
import requests
import subprocess
import time
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta

# Local imports (sẽ cần implement các models này)
# from ..models.anomaly import AnomalyDetector
# from ..models.credit_score import CreditScoreModel  
# from ..models.spend_clf import SpendClassifier
# from ..rules.insights import InsightGenerator

class MockMLModels:
    """Mock ML models for demo purposes"""
    
    def detect_anomalies(self, transactions_df):
        # Mock anomaly detection
        suspicious = transactions_df[transactions_df['amount'] > 1000000]
        return suspicious
    
    def predict_credit_score(self, transactions_df):
        # Mock credit scoring based on transaction patterns
        avg_amount = transactions_df['amount'].mean()
        if avg_amount > 500000:
            return 0.8
        elif avg_amount > 100000:
            return 0.6
        else:
            return 0.4
    
    def analyze_spending(self, transactions_df):
        # Mock spending analysis
        return transactions_df.groupby('merchant')['amount'].sum().to_dict()
    
    def generate_insights(self, transactions_df):
        # Mock insights
        total_spending = transactions_df['amount'].sum()
        return {
            'savings_potential': total_spending * 0.15,
            'recommendations': ['Giảm chi tiêu không cần thiết', 'Thiết lập ngân sách hàng tháng']
        }

class FinancialCopilot:
    """
    AI Financial Assistant combining ML insights with LLM conversation
    Optimized for Acer Nitro 5 with local LLM support
    Supports Vietnamese language and multiple LLM providers
    """
    
    def __init__(self, models_path: str = "artifacts/models", 
                 optimize_for_nitro5: bool = True):
        
        # Initialize ML models (using mock for now)
        self.mock_ml = MockMLModels()
        
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
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:  # Skip header line
                    models = []
                    for line in lines[1:]:  # Skip header
                        if line.strip():  # Only non-empty lines
                            model_name = line.split()[0]  # First column is model name
                            models.append(model_name)
                    return models
        except Exception as e:
            print(f"Error getting models: {e}")
        return []
    
    def _ollama_chat(self, model: str, prompt: str, context: str = "") -> str:
        """Chat with Ollama model"""
        try:
            full_prompt = f"{context}\\n\\n{prompt}" if context else prompt
            
            result = subprocess.run([
                'ollama', 'run', model, '--', full_prompt
            ], capture_output=True, text=True, timeout=60)  # Increased timeout to 60s
            
            if result.returncode == 0:
                return result.stdout.strip()
            else:
                return f"Error: {result.stderr.strip()}"
                
        except subprocess.TimeoutExpired:
            return "Error: Response timeout (60s)"
        except Exception as e:
            return f"Error: {str(e)}"
    
    def _route_to_best_model(self, intent: str, complexity: str) -> str:
        """Route to best available model based on intent and complexity"""
        
        if not self.nitro5_mode:
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
                anomalies = self.mock_ml.detect_anomalies(transactions_df)
                context.update({
                    "complexity": "complex",
                    "anomalies_count": len(anomalies),
                    "risk_level": "High" if len(anomalies) > 0 else "Low",
                    "suspicious_transactions": anomalies.to_dict('records') if len(anomalies) > 0 else []
                })
                
            elif intent == 'credit_analysis':
                # Run credit scoring  
                credit_score = self.mock_ml.predict_credit_score(transactions_df)
                context.update({
                    "complexity": "complex", 
                    "credit_score": credit_score,
                    "credit_rating": self._get_credit_rating(credit_score)
                })
                
            elif intent == 'spending_analysis':
                # Run spending classification
                spending_insights = self.mock_ml.analyze_spending(transactions_df)
                context.update({
                    "complexity": "medium",
                    "spending_by_category": spending_insights,
                    "total_spending": transactions_df['amount'].sum(),
                    "transaction_count": len(transactions_df)
                })
                
            elif intent == 'savings_advice':
                # Generate savings insights
                insights = self.mock_ml.generate_insights(transactions_df)
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

    # Utility methods for testing and demos
    def quick_fraud_check(self, transactions_df: pd.DataFrame) -> Dict[str, Any]:
        """Quick fraud detection check"""
        result = self.chat("Có giao dịch bất thường nào không?", "user", transactions_df)
        return {
            "has_fraud": result["ml_insights"].get("risk_level") == "High",
            "fraud_count": result["ml_insights"].get("anomalies_count", 0),
            "response": result["response"],
            "suggestions": result["suggestions"]
        }
    
    def get_spending_summary(self, transactions_df: pd.DataFrame) -> Dict[str, Any]:
        """Get spending summary with AI insights"""
        result = self.chat("Tóm tắt chi tiêu của tôi", "user", transactions_df)
        return {
            "total_spending": result["ml_insights"].get("total_spending", 0),
            "transaction_count": result["ml_insights"].get("transaction_count", 0),
            "categories": result["ml_insights"].get("spending_by_category", {}),
            "ai_advice": result["response"]
        }
    
    def get_credit_advice(self, transactions_df: pd.DataFrame) -> Dict[str, Any]:
        """Get credit score analysis and advice"""
        result = self.chat("Phân tích tín dụng của tôi", "user", transactions_df)
        return {
            "credit_score": result["ml_insights"].get("credit_score", 0),
            "credit_rating": result["ml_insights"].get("credit_rating", "Unknown"),
            "advice": result["response"],
            "improvement_tips": result["suggestions"]
        }
    
    def chat_interactive(self):
        """Interactive chat mode for testing"""
        print("🤖 Financial Copilot Interactive Mode")
        print("Nhập 'quit' để thoát")
        
        # Sample transactions for demo
        sample_data = pd.DataFrame([
            {"amount": 50000, "description": "Ăn phở", "merchant": "Phở Hà Nội"},
            {"amount": 2000000, "description": "Mua laptop", "merchant": "FPT Shop"},
            {"amount": 100000, "description": "Mua sắm", "merchant": "Vinmart"}
        ])
        
        while True:
            user_input = input("\\n👤 Bạn: ")
            if user_input.lower() in ['quit', 'exit', 'thoát']:
                print("👋 Tạm biệt!")
                break
                
            try:
                response = self.chat(user_input, "demo_user", sample_data)
                print(f"🤖 Copilot: {response['response']}")
                
                if response['suggestions']:
                    print("💡 Gợi ý:")
                    for suggestion in response['suggestions']:
                        print(f"  • {suggestion}")
                        
            except Exception as e:
                print(f"❌ Lỗi: {str(e)}")

# Demo function
def demo_financial_copilot():
    """Demo Financial Copilot capabilities"""
    
    print("🚀 Demo Financial Copilot")
    print("=" * 50)
    
    # Initialize copilot
    copilot = FinancialCopilot(optimize_for_nitro5=True)
    
    # Check if Ollama is available
    if not copilot._check_ollama_available():
        print("⚠️  Ollama not running. Please start with: ollama serve")
        print("📥 Install models: ollama pull phi3:mini")
        return
    
    # Sample transaction data
    transactions = pd.DataFrame([
        {"amount": 50000, "description": "Phở bò", "merchant": "Phở Hà Nội", "timestamp": "2024-01-15"},
        {"amount": 5000000, "description": "Chuyển khoản lạ", "merchant": "Unknown", "timestamp": "2024-01-15 03:00:00"},
        {"amount": 200000, "description": "Grab", "merchant": "Grab", "timestamp": "2024-01-14"},
        {"amount": 1500000, "description": "Laptop", "merchant": "FPT Shop", "timestamp": "2024-01-10"}
    ])
    
    print("📊 Sample Data:")
    print(transactions.to_string())
    
    # Test different intents
    test_cases = [
        "Có giao dịch bất thường nào không?",
        "Phân tích chi tiêu của tôi", 
        "Tư vấn tín dụng",
        "Gợi ý tiết kiệm tiền"
    ]
    
    for i, question in enumerate(test_cases, 1):
        print(f"\\n{i}. 👤 User: {question}")
        try:
            start_time = time.time()
            result = copilot.chat(question, "demo_user", transactions)
            elapsed = time.time() - start_time
            
            print(f"🤖 Copilot ({result['model_used']}, {elapsed:.2f}s):")
            print(f"   {result['response']}")
            
            if result['suggestions']:
                print("💡 Suggestions:")
                for suggestion in result['suggestions']:
                    print(f"   • {suggestion}")
                    
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    print("\\n✅ Demo completed!")

if __name__ == "__main__":
    demo_financial_copilot()
