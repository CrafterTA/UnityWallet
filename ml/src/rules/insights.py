"""
Insights Rules Engine
Generates personalized financial insights based on spending patterns
"""
import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from pathlib import Path

class InsightsEngine:
    """
    Rules-based engine for generating financial insights
    """
    
    def __init__(self, rules_config: Optional[Dict] = None):
        self.rules_config = rules_config or {}
        self.insights_rules = {}
        self.load_default_rules()
    
    def load_default_rules(self):
        """Load default insights rules"""
        self.insights_rules = {
            "travel_spending_high": {
                "condition": lambda stats: stats.get('travel_percentage', 0) > 30,
                "message_template": "Bạn đã chi {travel_amount:,.0f} VNĐ cho du lịch tháng này ({travel_percentage:.1f}% tổng chi tiêu). Hãy cân nhắc gói bay-nghỉ dưỡng để tiết kiệm ~15%.",
                "suggestion": {
                    "type": "combo_travel_package",
                    "title": "Gói du lịch tiết kiệm",
                    "description": "Combo bay + nghỉ dưỡng có thể tiết kiệm 10-20% so với đặt riêng lẻ",
                    "potential_saving": 0.15,
                    "action_url": "/offers/travel-packages"
                },
                "priority": "high",
                "category": "spending_optimization"
            },
            
            "food_spending_frequent": {
                "condition": lambda stats: stats.get('fb_transactions', 0) > 15 and stats.get('fb_percentage', 0) > 25,
                "message_template": "Bạn có {fb_transactions} giao dịch ăn uống ({fb_percentage:.1f}% chi tiêu). Có thể cân nhắc nấu ăn tại nhà để tiết kiệm.",
                "suggestion": {
                    "type": "cooking_tips",
                    "title": "Tiết kiệm chi phí ăn uống",
                    "description": "Nấu ăn tại nhà 2-3 bữa/tuần có thể tiết kiệm 20-30% chi phí F&B",
                    "potential_saving": 0.25,
                    "action_url": "/tips/cooking"
                },
                "priority": "medium",
                "category": "spending_optimization"
            },
            
            "accommodation_luxury": {
                "condition": lambda stats: stats.get('accommodation_avg', 0) > 2000000,
                "message_template": "Chi tiêu lưu trú trung bình {accommodation_avg:,.0f} VNĐ/đêm. Có nhiều lựa chọn tiết kiệm với chất lượng tương đương.",
                "suggestion": {
                    "type": "budget_accommodation",
                    "title": "Lựa chọn lưu trú tiết kiệm",
                    "description": "Khách sạn 3-4 sao hoặc homestay chất lượng cao với giá hợp lý hơn",
                    "potential_saving": 0.30,
                    "action_url": "/offers/accommodation"
                },
                "priority": "medium", 
                "category": "spending_optimization"
            },
            
            "entertainment_weekend": {
                "condition": lambda stats: stats.get('entertainment_weekend_ratio', 0) > 0.8,
                "message_template": "Bạn chủ yếu chi tiêu giải trí vào cuối tuần ({entertainment_weekend_ratio:.0%}). Hãy thử các hoạt động miễn phí trong tuần.",
                "suggestion": {
                    "type": "free_activities",
                    "title": "Hoạt động giải trí miễn phí",
                    "description": "Công viên, bảo tàng miễn phí, sự kiện cộng đồng, thể thao ngoài trời",
                    "potential_saving": 0.20,
                    "action_url": "/tips/free-activities"
                },
                "priority": "low",
                "category": "lifestyle_optimization"
            },
            
            "irregular_spending": {
                "condition": lambda stats: stats.get('spending_volatility', 0) > 0.5,
                "message_template": "Chi tiêu hàng tháng biến động cao (CV: {spending_volatility:.2f}). Hãy thiết lập ngân sách cố định cho từng danh mục.",
                "suggestion": {
                    "type": "budget_planning",
                    "title": "Lập kế hoạch ngân sách",
                    "description": "Thiết lập ngân sách cố định giúp kiểm soát chi tiêu tốt hơn",
                    "potential_saving": 0.10,
                    "action_url": "/tools/budget-planner"
                },
                "priority": "high",
                "category": "financial_planning"
            },
            
            "single_category_dominant": {
                "condition": lambda stats: max(stats.get('category_percentages', {}).values()) > 50,
                "message_template": "Chi tiêu tập trung vào 1 danh mục ({dominant_category}: {dominant_percentage:.1f}%). Hãy cân nhắc đa dạng hóa.",
                "suggestion": {
                    "type": "spending_diversification",
                    "title": "Đa dạng hóa chi tiêu",
                    "description": "Phân bổ ngân sách đều hơn giữa các danh mục để cân bằng cuộc sống",
                    "potential_saving": 0.05,
                    "action_url": "/tips/balanced-spending"
                },
                "priority": "low",
                "category": "lifestyle_optimization"
            },

            "consistent_saver": {
                "condition": lambda stats: stats.get('monthly_growth_rate', 0) > 0.05,
                "message_template": "Tuyệt vời! Số dư tăng trung bình {monthly_growth_rate:.1%}/tháng. Hãy xem xét đầu tư để tăng lợi nhuận.",
                "suggestion": {
                    "type": "investment_opportunity",
                    "title": "Cơ hội đầu tư",
                    "description": "Tiền gửi có kỳ hạn hoặc quỹ đầu tư có thể mang lại lợi nhuận cao hơn",
                    "potential_saving": 0.08,
                    "action_url": "/investment/options"
                },
                "priority": "medium",
                "category": "wealth_building"
            }
        }
    
    def calculate_spending_stats(self, transactions_df: pd.DataFrame, user_id: str = None) -> Dict:
        """Calculate comprehensive spending statistics"""
        if user_id:
            df = transactions_df[transactions_df['user_id'] == user_id].copy()
        else:
            df = transactions_df.copy()
        
        if len(df) == 0:
            return {}
        
        # Convert types
        df['amount'] = pd.to_numeric(df['amount'])
        df['transaction_date'] = pd.to_datetime(df['transaction_date'])
        df['is_weekend'] = pd.to_numeric(df.get('is_weekend', 0))
        
        # Time-based analysis
        current_month = df['transaction_date'].max().to_period('M')
        current_month_data = df[df['transaction_date'].dt.to_period('M') == current_month]
        
        # Monthly analysis
        monthly_stats = df.groupby(df['transaction_date'].dt.to_period('M'))['amount'].agg(['sum', 'count']).reset_index()
        monthly_stats.columns = ['month', 'total_amount', 'transaction_count']
        
        # Calculate basic stats
        total_amount = df['amount'].sum()
        total_transactions = len(df)
        avg_transaction = df['amount'].mean()
        
        # Current month stats
        current_month_amount = current_month_data['amount'].sum()
        current_month_transactions = len(current_month_data)
        
        # Category analysis
        category_stats = df.groupby('category')['amount'].agg(['sum', 'count', 'mean']).reset_index()
        category_percentages = {}
        category_amounts = {}
        
        for _, row in category_stats.iterrows():
            category = row['category']
            amount = row['sum']
            category_amounts[category] = amount
            category_percentages[category] = (amount / total_amount) * 100 if total_amount > 0 else 0
        
        # Find dominant category
        dominant_category = max(category_percentages.keys(), key=lambda x: category_percentages[x]) if category_percentages else "Unknown"
        dominant_percentage = category_percentages.get(dominant_category, 0)
        
        # Travel specific stats
        travel_amount = category_amounts.get('Travel', 0)
        travel_percentage = category_percentages.get('Travel', 0)
        
        # F&B specific stats
        fb_amount = category_amounts.get('F&B', 0)
        fb_percentage = category_percentages.get('F&B', 0)
        fb_transactions = len(df[df['category'] == 'F&B'])
        
        # Accommodation stats
        accommodation_data = df[df['category'] == 'Accommodation']
        accommodation_avg = accommodation_data['amount'].mean() if len(accommodation_data) > 0 else 0
        
        # Entertainment weekend ratio
        entertainment_data = df[df['category'] == 'Entertainment']
        if len(entertainment_data) > 0:
            entertainment_weekend_ratio = entertainment_data['is_weekend'].mean()
        else:
            entertainment_weekend_ratio = 0
        
        # Spending volatility (coefficient of variation)
        if len(monthly_stats) > 1:
            spending_volatility = monthly_stats['total_amount'].std() / monthly_stats['total_amount'].mean()
        else:
            spending_volatility = 0
        
        # Growth rate
        if len(monthly_stats) >= 2:
            recent_months = monthly_stats.tail(2)
            if len(recent_months) == 2:
                old_amount = recent_months.iloc[0]['total_amount'] 
                new_amount = recent_months.iloc[1]['total_amount']
                monthly_growth_rate = (new_amount - old_amount) / old_amount if old_amount > 0 else 0
            else:
                monthly_growth_rate = 0
        else:
            monthly_growth_rate = 0
        
        stats = {
            # Basic stats
            'total_amount': total_amount,
            'total_transactions': total_transactions,
            'avg_transaction': avg_transaction,
            'current_month_amount': current_month_amount,
            'current_month_transactions': current_month_transactions,
            
            # Category stats
            'category_percentages': category_percentages,
            'category_amounts': category_amounts,
            'dominant_category': dominant_category,
            'dominant_percentage': dominant_percentage,
            
            # Specific category insights
            'travel_amount': travel_amount,
            'travel_percentage': travel_percentage,
            'fb_amount': fb_amount,
            'fb_percentage': fb_percentage,
            'fb_transactions': fb_transactions,
            'accommodation_avg': accommodation_avg,
            'entertainment_weekend_ratio': entertainment_weekend_ratio,
            
            # Pattern insights
            'spending_volatility': spending_volatility,
            'monthly_growth_rate': monthly_growth_rate,
            
            # Time analysis
            'months_analyzed': len(monthly_stats),
            'analysis_period_days': (df['transaction_date'].max() - df['transaction_date'].min()).days,
        }
        
        return stats
    
    def generate_insights(self, transactions_df: pd.DataFrame, user_id: str = None) -> List[Dict]:
        """Generate insights for a user"""
        stats = self.calculate_spending_stats(transactions_df, user_id)
        
        if not stats:
            return []
        
        insights = []
        
        for rule_name, rule_config in self.insights_rules.items():
            try:
                # Check condition
                if rule_config['condition'](stats):
                    # Format message
                    message = rule_config['message_template'].format(**stats)
                    
                    # Calculate potential savings if applicable
                    suggestion = rule_config['suggestion'].copy()
                    if 'potential_saving' in suggestion:
                        potential_amount = stats.get('current_month_amount', 0) * suggestion['potential_saving']
                        suggestion['potential_amount'] = potential_amount
                    
                    insight = {
                        'rule_name': rule_name,
                        'message': message,
                        'suggestion': suggestion,
                        'priority': rule_config['priority'],
                        'category': rule_config['category'],
                        'generated_at': datetime.now().isoformat(),
                        'user_id': user_id,
                        'supporting_data': {
                            'current_month_amount': stats.get('current_month_amount', 0),
                            'category_breakdown': stats.get('category_percentages', {}),
                            'rule_triggered_value': self._get_rule_value(rule_name, stats)
                        }
                    }
                    
                    insights.append(insight)
                    
            except Exception as e:
                print(f"⚠️  Error processing rule {rule_name}: {e}")
                continue
        
        # Sort by priority
        priority_order = {'high': 3, 'medium': 2, 'low': 1}
        insights.sort(key=lambda x: priority_order.get(x['priority'], 0), reverse=True)
        
        return insights
    
    def _get_rule_value(self, rule_name: str, stats: Dict) -> float:
        """Get the specific value that triggered the rule"""
        rule_value_mapping = {
            'travel_spending_high': stats.get('travel_percentage', 0),
            'food_spending_frequent': stats.get('fb_percentage', 0),
            'accommodation_luxury': stats.get('accommodation_avg', 0),
            'entertainment_weekend': stats.get('entertainment_weekend_ratio', 0),
            'irregular_spending': stats.get('spending_volatility', 0),
            'single_category_dominant': stats.get('dominant_percentage', 0),
            'consistent_saver': stats.get('monthly_growth_rate', 0)
        }
        
        return rule_value_mapping.get(rule_name, 0)
    
    def get_spending_summary(self, transactions_df: pd.DataFrame, user_id: str = None) -> Dict:
        """Get comprehensive spending summary"""
        stats = self.calculate_spending_stats(transactions_df, user_id)
        insights = self.generate_insights(transactions_df, user_id)
        
        # Create spending trends
        if user_id:
            df = transactions_df[transactions_df['user_id'] == user_id].copy()
        else:
            df = transactions_df.copy()
        
        df['amount'] = pd.to_numeric(df['amount'])
        df['transaction_date'] = pd.to_datetime(df['transaction_date'])
        
        # Monthly trend
        monthly_trend = df.groupby(df['transaction_date'].dt.to_period('M'))['amount'].sum().to_dict()
        monthly_trend = {str(k): float(v) for k, v in monthly_trend.items()}
        
        # Category breakdown for current month
        current_month = df['transaction_date'].max().to_period('M')
        current_month_data = df[df['transaction_date'].dt.to_period('M') == current_month]
        category_breakdown = current_month_data.groupby('category')['amount'].sum().to_dict()
        category_breakdown = {k: float(v) for k, v in category_breakdown.items()}
        
        summary = {
            'user_id': user_id,
            'analysis_date': datetime.now().isoformat(),
            'period_analyzed': {
                'start_date': df['transaction_date'].min().isoformat(),
                'end_date': df['transaction_date'].max().isoformat(),
                'total_days': (df['transaction_date'].max() - df['transaction_date'].min()).days
            },
            'summary_stats': {
                'total_spent': stats.get('total_amount', 0),
                'total_transactions': stats.get('total_transactions', 0),
                'avg_transaction': stats.get('avg_transaction', 0),
                'current_month_spent': stats.get('current_month_amount', 0),
                'dominant_category': {
                    'name': stats.get('dominant_category', 'Unknown'),
                    'percentage': stats.get('dominant_percentage', 0),
                    'amount': stats.get('category_amounts', {}).get(stats.get('dominant_category', ''), 0)
                }
            },
            'monthly_trend': monthly_trend,
            'category_breakdown': category_breakdown,
            'insights': insights,
            'recommendations_count': {
                'high_priority': len([i for i in insights if i['priority'] == 'high']),
                'medium_priority': len([i for i in insights if i['priority'] == 'medium']),
                'low_priority': len([i for i in insights if i['priority'] == 'low'])
            }
        }
        
        return summary

def test_insights_engine():
    """Test the insights engine with seed data"""
    import sys
    sys.path.append(str(Path(__file__).parent.parent))
    from config import SEED_DATA_PATH
    
    # Load test data
    df = pd.read_csv(SEED_DATA_PATH / "transactions.csv")
    print(f"📊 Loaded {len(df)} transactions")
    
    # Initialize engine
    engine = InsightsEngine()
    
    # Test for each user
    users = df['user_id'].unique()
    
    for user_id in users:
        print(f"\n👤 Analyzing insights for {user_id}:")
        
        # Generate insights
        insights = engine.generate_insights(df, user_id)
        print(f"   Generated {len(insights)} insights")
        
        # Show top insights
        for insight in insights[:3]:
            print(f"   🔍 [{insight['priority'].upper()}] {insight['message'][:80]}...")
            if 'potential_amount' in insight['suggestion']:
                print(f"      💰 Potential saving: {insight['suggestion']['potential_amount']:,.0f} VNĐ")
        
        # Get spending summary
        summary = engine.get_spending_summary(df, user_id)
        print(f"   📈 Total spent: {summary['summary_stats']['total_spent']:,.0f} VNĐ")
        print(f"   📊 Dominant category: {summary['summary_stats']['dominant_category']['name']} ({summary['summary_stats']['dominant_category']['percentage']:.1f}%)")
    
    print("\n✅ Insights engine test completed!")
    return engine

if __name__ == "__main__":
    test_insights_engine()
