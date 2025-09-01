"""
Backend Integration Architecture cho Financial Copilot
Tích hợp với Unity Wallet Backend APIs để lấy real data
"""

import requests
import asyncio
import aiohttp
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import pandas as pd

class UnityWalletBackendClient:
    """
    Client để kết nối với Unity Wallet Backend APIs
    """
    
    def __init__(self, base_url: str, api_key: str = None):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = None
        
        # API endpoints
        self.endpoints = {
            'transactions': '/api/v1/transactions',
            'balance': '/api/v1/accounts/balance',
            'spending_categories': '/api/v1/analytics/spending',
            'fraud_alerts': '/api/v1/security/fraud-alerts',
            'credit_score': '/api/v1/credit/score',
            'budgets': '/api/v1/budgets',
            'savings_goals': '/api/v1/savings/goals',
            'merchants': '/api/v1/merchants',
            'user_profile': '/api/v1/users/profile'
        }
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authentication"""
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        if self.api_key:
            headers['Authorization'] = f'Bearer {self.api_key}'
        return headers
    
    async def get_transactions(self, user_id: str, 
                             start_date: datetime = None, 
                             end_date: datetime = None,
                             limit: int = 100) -> pd.DataFrame:
        """
        Lấy transaction history từ backend
        """
        params = {
            'user_id': user_id,
            'limit': limit
        }
        
        if start_date:
            params['start_date'] = start_date.isoformat()
        if end_date:
            params['end_date'] = end_date.isoformat()
        
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}{self.endpoints['transactions']}"
                async with session.get(url, params=params, headers=self._get_headers()) as response:
                    if response.status == 200:
                        data = await response.json()
                        # Convert to DataFrame
                        transactions = pd.DataFrame(data.get('transactions', []))
                        return transactions
                    else:
                        print(f"Error fetching transactions: {response.status}")
                        return pd.DataFrame()
        except Exception as e:
            print(f"Exception in get_transactions: {e}")
            return pd.DataFrame()
    
    async def get_current_balance(self, user_id: str) -> Dict[str, Any]:
        """
        Lấy số dư hiện tại
        """
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}{self.endpoints['balance']}"
                params = {'user_id': user_id}
                async with session.get(url, params=params, headers=self._get_headers()) as response:
                    if response.status == 200:
                        return await response.json()
                    return {}
        except Exception as e:
            print(f"Exception in get_current_balance: {e}")
            return {}
    
    async def get_spending_analytics(self, user_id: str, period: str = 'month') -> Dict[str, Any]:
        """
        Lấy spending analytics theo category
        """
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}{self.endpoints['spending_categories']}"
                params = {'user_id': user_id, 'period': period}
                async with session.get(url, params=params, headers=self._get_headers()) as response:
                    if response.status == 200:
                        return await response.json()
                    return {}
        except Exception as e:
            print(f"Exception in get_spending_analytics: {e}")
            return {}
    
    async def get_fraud_alerts(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Lấy fraud alerts
        """
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}{self.endpoints['fraud_alerts']}"
                params = {'user_id': user_id}
                async with session.get(url, params=params, headers=self._get_headers()) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get('alerts', [])
                    return []
        except Exception as e:
            print(f"Exception in get_fraud_alerts: {e}")
            return []
    
    async def get_credit_score(self, user_id: str) -> Dict[str, Any]:
        """
        Lấy credit score từ backend
        """
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}{self.endpoints['credit_score']}"
                params = {'user_id': user_id}
                async with session.get(url, params=params, headers=self._get_headers()) as response:
                    if response.status == 200:
                        return await response.json()
                    return {}
        except Exception as e:
            print(f"Exception in get_credit_score: {e}")
            return {}
    
    async def get_budgets(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Lấy budgets và spending limits
        """
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}{self.endpoints['budgets']}"
                params = {'user_id': user_id}
                async with session.get(url, params=params, headers=self._get_headers()) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get('budgets', [])
                    return []
        except Exception as e:
            print(f"Exception in get_budgets: {e}")
            return []
    
    async def get_savings_goals(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Lấy savings goals
        """
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}{self.endpoints['savings_goals']}"
                params = {'user_id': user_id}
                async with session.get(url, params=params, headers=self._get_headers()) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get('goals', [])
                    return []
        except Exception as e:
            print(f"Exception in get_savings_goals: {e}")
            return []
    
    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """
        Lấy user profile và preferences
        """
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}{self.endpoints['user_profile']}"
                params = {'user_id': user_id}
                async with session.get(url, params=params, headers=self._get_headers()) as response:
                    if response.status == 200:
                        return await response.json()
                    return {}
        except Exception as e:
            print(f"Exception in get_user_profile: {e}")
            return {}

class EnhancedFinancialCopilot:
    """
    Enhanced Financial Copilot với backend integration
    """
    
    def __init__(self, backend_url: str, api_key: str = None, 
                 optimize_for_nitro5: bool = True):
        
        # Backend client
        self.backend = UnityWalletBackendClient(backend_url, api_key)
        
        # Original Financial Copilot
        from .financial_copilot_complete import FinancialCopilot
        self.base_copilot = FinancialCopilot(optimize_for_nitro5=optimize_for_nitro5)
        
        # Cache for performance
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes
    
    async def get_enriched_context(self, user_id: str, intent: str) -> Dict[str, Any]:
        """
        Lấy enriched context từ backend dựa trên intent
        """
        context = {}
        
        try:
            # Common data for all intents
            balance_task = self.backend.get_current_balance(user_id)
            profile_task = self.backend.get_user_profile(user_id)
            
            # Intent-specific data
            if intent == 'fraud_detection':
                fraud_task = self.backend.get_fraud_alerts(user_id)
                transactions_task = self.backend.get_transactions(
                    user_id, 
                    start_date=datetime.now() - timedelta(days=7)  # Last week
                )
                
                balance, profile, fraud_alerts, transactions = await asyncio.gather(
                    balance_task, profile_task, fraud_task, transactions_task
                )
                
                context.update({
                    'balance': balance,
                    'profile': profile,
                    'fraud_alerts': fraud_alerts,
                    'recent_transactions': transactions,
                    'transactions_count': len(transactions),
                    'high_risk_transactions': [
                        t for _, t in transactions.iterrows() 
                        if t.get('amount', 0) > profile.get('avg_transaction_amount', 500000)
                    ] if not transactions.empty else []
                })
                
            elif intent == 'spending_analysis':
                spending_task = self.backend.get_spending_analytics(user_id)
                transactions_task = self.backend.get_transactions(
                    user_id,
                    start_date=datetime.now() - timedelta(days=30)  # Last month
                )
                budgets_task = self.backend.get_budgets(user_id)
                
                balance, profile, spending, transactions, budgets = await asyncio.gather(
                    balance_task, profile_task, spending_task, transactions_task, budgets_task
                )
                
                context.update({
                    'balance': balance,
                    'profile': profile,
                    'spending_analytics': spending,
                    'monthly_transactions': transactions,
                    'budgets': budgets,
                    'categories': spending.get('categories', {}),
                    'total_spending': spending.get('total_amount', 0),
                    'budget_status': self._analyze_budget_status(spending, budgets)
                })
                
            elif intent == 'credit_analysis':
                credit_task = self.backend.get_credit_score(user_id)
                transactions_task = self.backend.get_transactions(
                    user_id,
                    start_date=datetime.now() - timedelta(days=90)  # Last 3 months
                )
                
                balance, profile, credit, transactions = await asyncio.gather(
                    balance_task, profile_task, credit_task, transactions_task
                )
                
                context.update({
                    'balance': balance,
                    'profile': profile,
                    'credit_score': credit,
                    'credit_history': transactions,
                    'payment_behavior': self._analyze_payment_behavior(transactions),
                    'credit_utilization': credit.get('utilization_ratio', 0)
                })
                
            elif intent == 'savings_advice':
                savings_task = self.backend.get_savings_goals(user_id)
                spending_task = self.backend.get_spending_analytics(user_id)
                transactions_task = self.backend.get_transactions(
                    user_id,
                    start_date=datetime.now() - timedelta(days=30)
                )
                
                balance, profile, savings, spending, transactions = await asyncio.gather(
                    balance_task, profile_task, savings_task, spending_task, transactions_task
                )
                
                context.update({
                    'balance': balance,
                    'profile': profile,
                    'savings_goals': savings,
                    'spending_analytics': spending,
                    'monthly_transactions': transactions,
                    'savings_potential': self._calculate_savings_potential(spending, transactions),
                    'goal_progress': self._analyze_goal_progress(savings, balance)
                })
                
            else:  # general, simple_queries
                balance, profile = await asyncio.gather(balance_task, profile_task)
                context.update({
                    'balance': balance,
                    'profile': profile
                })
                
        except Exception as e:
            print(f"Error getting enriched context: {e}")
            context['error'] = str(e)
        
        return context
    
    def _analyze_budget_status(self, spending: Dict, budgets: List[Dict]) -> Dict[str, Any]:
        """
        Phân tích budget status
        """
        budget_status = {}
        
        for budget in budgets:
            category = budget.get('category')
            limit = budget.get('limit', 0)
            spent = spending.get('categories', {}).get(category, 0)
            
            budget_status[category] = {
                'limit': limit,
                'spent': spent,
                'remaining': max(0, limit - spent),
                'percentage': (spent / limit * 100) if limit > 0 else 0,
                'status': 'over' if spent > limit else 'warning' if spent > limit * 0.8 else 'good'
            }
        
        return budget_status
    
    def _analyze_payment_behavior(self, transactions: pd.DataFrame) -> Dict[str, Any]:
        """
        Phân tích payment behavior cho credit analysis
        """
        if transactions.empty:
            return {}
        
        # Analyze patterns
        avg_amount = transactions['amount'].mean()
        transaction_frequency = len(transactions) / 30  # per day
        
        # Payment timing analysis
        transactions['hour'] = pd.to_datetime(transactions.get('timestamp', datetime.now())).dt.hour
        peak_hours = transactions['hour'].value_counts().head(3).index.tolist()
        
        return {
            'avg_transaction_amount': avg_amount,
            'daily_frequency': transaction_frequency,
            'peak_hours': peak_hours,
            'consistency_score': self._calculate_consistency_score(transactions)
        }
    
    def _calculate_savings_potential(self, spending: Dict, transactions: pd.DataFrame) -> Dict[str, Any]:
        """
        Tính toán savings potential
        """
        if transactions.empty:
            return {}
        
        # Analyze discretionary spending
        discretionary_categories = ['entertainment', 'dining', 'shopping', 'travel']
        total_discretionary = sum(
            spending.get('categories', {}).get(cat, 0) 
            for cat in discretionary_categories
        )
        
        # Calculate potential savings (conservative 15-20%)
        potential_savings = total_discretionary * 0.15
        
        return {
            'total_discretionary': total_discretionary,
            'potential_monthly_savings': potential_savings,
            'potential_yearly_savings': potential_savings * 12,
            'recommendations': self._generate_savings_recommendations(spending)
        }
    
    def _analyze_goal_progress(self, goals: List[Dict], balance: Dict) -> Dict[str, Any]:
        """
        Phân tích progress của savings goals
        """
        progress = {}
        current_savings = balance.get('savings_balance', 0)
        
        for goal in goals:
            goal_id = goal.get('id')
            target_amount = goal.get('target_amount', 0)
            current_amount = goal.get('current_amount', 0)
            target_date = goal.get('target_date')
            
            progress[goal_id] = {
                'name': goal.get('name'),
                'progress_percentage': (current_amount / target_amount * 100) if target_amount > 0 else 0,
                'remaining_amount': max(0, target_amount - current_amount),
                'on_track': self._is_goal_on_track(goal, current_amount)
            }
        
        return progress
    
    def _generate_savings_recommendations(self, spending: Dict) -> List[str]:
        """
        Generate personalized savings recommendations
        """
        recommendations = []
        categories = spending.get('categories', {})
        
        # Highest spending categories
        sorted_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)
        
        for category, amount in sorted_categories[:3]:
            if category == 'dining':
                recommendations.append(f"💡 Giảm 20% chi tiêu ăn uống ({amount:,.0f} VND) → Tiết kiệm {amount*0.2:,.0f} VND")
            elif category == 'entertainment':
                recommendations.append(f"🎬 Tối ưu chi tiêu giải trí ({amount:,.0f} VND) → Chọn hoạt động miễn phí")
            elif category == 'shopping':
                recommendations.append(f"🛒 Kiểm soát mua sắm ({amount:,.0f} VND) → Lập danh sách trước khi mua")
        
        return recommendations
    
    def _calculate_consistency_score(self, transactions: pd.DataFrame) -> float:
        """
        Calculate consistency score for credit analysis
        """
        if transactions.empty:
            return 0.0
        
        # Simple consistency based on transaction frequency and amounts
        daily_amounts = transactions.groupby(transactions['timestamp'].dt.date)['amount'].sum()
        consistency = 1.0 - (daily_amounts.std() / daily_amounts.mean()) if daily_amounts.mean() > 0 else 0.0
        
        return max(0.0, min(1.0, consistency))
    
    def _is_goal_on_track(self, goal: Dict, current_amount: float) -> bool:
        """
        Check if savings goal is on track
        """
        target_amount = goal.get('target_amount', 0)
        target_date = goal.get('target_date')
        start_date = goal.get('start_date')
        
        if not all([target_date, start_date, target_amount]):
            return False
        
        # Calculate expected progress
        total_days = (target_date - start_date).days
        elapsed_days = (datetime.now() - start_date).days
        expected_progress = (elapsed_days / total_days) * target_amount if total_days > 0 else 0
        
        return current_amount >= expected_progress * 0.9  # 90% tolerance
    
    async def chat_with_backend(self, user_message: str, user_id: str) -> Dict[str, Any]:
        """
        Enhanced chat với real backend data
        """
        # Analyze intent
        intent = self.base_copilot._analyze_intent(user_message)
        
        # Get enriched context from backend
        enriched_context = await self.get_enriched_context(user_id, intent)
        
        # Build enhanced prompt with real data
        enhanced_prompt = self._build_enhanced_prompt(intent, user_message, enriched_context)
        
        # Get LLM response
        model = self.base_copilot._route_to_best_model(intent, "complex")
        if not model:
            return {
                "response": "Xin lỗi, tôi không thể kết nối với AI model. Vui lòng thử lại sau.",
                "intent": intent,
                "data_source": "none"
            }
        
        llm_response = self.base_copilot._ollama_chat(model, enhanced_prompt)
        
        # Generate enhanced suggestions with real data
        suggestions = self._generate_enhanced_suggestions(intent, enriched_context)
        
        return {
            "response": llm_response,
            "intent": intent,
            "model_used": model,
            "data_source": "backend",
            "suggestions": suggestions,
            "context": enriched_context,
            "timestamp": datetime.now().isoformat()
        }
    
    def _build_enhanced_prompt(self, intent: str, user_message: str, context: Dict[str, Any]) -> str:
        """
        Build enhanced prompt với real backend data
        """
        base_prompt = f"""
        Bạn là trợ lý tài chính AI của Unity Wallet.
        Người dùng hỏi: {user_message}
        
        DÙNG DỮ LIỆU THỰC TẾ sau để trả lời:
        """
        
        if intent == 'fraud_detection':
            fraud_alerts = context.get('fraud_alerts', [])
            high_risk = context.get('high_risk_transactions', [])
            
            base_prompt += f"""
            📊 DỮ LIỆU FRAUD:
            - Số cảnh báo gian lận: {len(fraud_alerts)}
            - Giao dịch nguy cơ cao: {len(high_risk)}
            - Chi tiết cảnh báo: {fraud_alerts[:3]}  # Top 3
            - Giao dịch đáng nghi: {high_risk[:3]}   # Top 3
            
            Phân tích và đưa ra cảnh báo cụ thể với dữ liệu thực.
            """
            
        elif intent == 'spending_analysis':
            spending = context.get('spending_analytics', {})
            budget_status = context.get('budget_status', {})
            
            base_prompt += f"""
            📊 DỮ LIỆU CHI TIÊU THỰC TẾ:
            - Tổng chi tiêu tháng: {spending.get('total_amount', 0):,.0f} VND
            - Chi tiêu theo danh mục: {spending.get('categories', {})}
            - Trạng thái ngân sách: {budget_status}
            - Số giao dịch: {context.get('transactions_count', 0)}
            
            Phân tích chi tiết dựa trên dữ liệu thực tế này.
            """
            
        elif intent == 'credit_analysis':
            credit = context.get('credit_score', {})
            payment_behavior = context.get('payment_behavior', {})
            
            base_prompt += f"""
            📊 DỮ LIỆU TÍN DỤNG THỰC TẾ:
            - Điểm tín dụng: {credit.get('score', 0)}
            - Xếp hạng: {credit.get('rating', 'N/A')}
            - Tỷ lệ sử dụng tín dụng: {context.get('credit_utilization', 0)*100:.1f}%
            - Hành vi thanh toán: {payment_behavior}
            
            Đánh giá và tư vấn dựa trên dữ liệu tín dụng thực tế.
            """
            
        elif intent == 'savings_advice':
            savings_potential = context.get('savings_potential', {})
            goal_progress = context.get('goal_progress', {})
            savings_goals = context.get('savings_goals', [])
            
            base_prompt += f"""
            📊 DỮ LIỆU TIẾT KIỆM THỰC TẾ:
            - Tiềm năng tiết kiệm tháng: {savings_potential.get('potential_monthly_savings', 0):,.0f} VND
            - Mục tiêu tiết kiệm: {len(savings_goals)} mục tiêu
            - Tiến độ mục tiêu: {goal_progress}
            - Gợi ý cụ thể: {savings_potential.get('recommendations', [])}
            
            Tư vấn tiết kiệm dựa trên dữ liệu thực tế và mục tiêu cá nhân.
            """
        
        else:  # general queries
            balance = context.get('balance', {})
            base_prompt += f"""
            📊 DỮ LIỆU TÀI KHOẢN:
            - Số dư chính: {balance.get('main_balance', 0):,.0f} VND
            - Số dư tiết kiệm: {balance.get('savings_balance', 0):,.0f} VND
            - Tổng tài sản: {balance.get('total_balance', 0):,.0f} VND
            
            Trả lời dựa trên thông tin tài khoản thực tế.
            """
        
        base_prompt += "\\n\\nTrả lời bằng tiếng Việt, cụ thể và thực tế."
        return base_prompt
    
    def _generate_enhanced_suggestions(self, intent: str, context: Dict[str, Any]) -> List[str]:
        """
        Generate enhanced suggestions với real data
        """
        suggestions = []
        
        if intent == 'fraud_detection':
            fraud_alerts = context.get('fraud_alerts', [])
            if fraud_alerts:
                suggestions.extend([
                    f"🚨 {len(fraud_alerts)} cảnh báo cần xử lý",
                    "🔒 Khóa thẻ tạm thời",
                    "📞 Gọi hotline: 1900-xxx-xxx"
                ])
        
        elif intent == 'spending_analysis':
            budget_status = context.get('budget_status', {})
            over_budget = [cat for cat, status in budget_status.items() if status.get('status') == 'over']
            if over_budget:
                suggestions.extend([
                    f"⚠️ Vượt ngân sách: {', '.join(over_budget)}",
                    "📊 Xem báo cáo chi tiết",
                    "🎯 Điều chỉnh ngân sách"
                ])
        
        elif intent == 'credit_analysis':
            credit = context.get('credit_score', {})
            score = credit.get('score', 0)
            if score < 700:
                suggestions.extend([
                    "📈 Cải thiện lịch sử thanh toán",
                    "💳 Giảm tỷ lệ sử dụng tín dụng",
                    "🏦 Đa dạng hóa sản phẩm tín dụng"
                ])
        
        elif intent == 'savings_advice':
            savings_potential = context.get('savings_potential', {})
            potential = savings_potential.get('potential_monthly_savings', 0)
            if potential > 0:
                suggestions.extend([
                    f"💰 Tiết kiệm được {potential:,.0f} VND/tháng",
                    "🎯 Thiết lập auto-save",
                    "📊 Theo dõi progress hàng tuần"
                ])
        
        return suggestions

# Usage Example
async def demo_enhanced_copilot():
    """
    Demo Enhanced Financial Copilot với backend
    """
    
    # Initialize với backend URL
    copilot = EnhancedFinancialCopilot(
        backend_url="http://localhost:8000",  # Unity Wallet Backend
        api_key="your-api-key-here"
    )
    
    # Test với real backend data
    user_id = "user123"
    
    test_queries = [
        "Có giao dịch bất thường nào không?",
        "Phân tích chi tiêu tháng này của tôi",
        "Tình hình tín dụng của tôi như thế nào?",
        "Tư vấn tiết kiệm cho tôi"
    ]
    
    for query in test_queries:
        print(f"\\n👤 User: {query}")
        result = await copilot.chat_with_backend(query, user_id)
        print(f"🤖 Copilot: {result['response']}")
        print(f"💡 Suggestions: {result['suggestions']}")

if __name__ == "__main__":
    # Run demo
    asyncio.run(demo_enhanced_copilot())
