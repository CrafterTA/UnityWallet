"""Analytics service business logic."""

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from decimal import Decimal
from ..common.models import Transaction, TransactionType, Alert, CreditScore, LoyaltyPoint
from ..common.logging import get_logger

logger = get_logger("analytics_service")


class AnalyticsService:
    """Service for analytics, insights, and credit scoring with ML models."""
    
    def __init__(self, db: Session):
        self.db = db
        # Initialize ML models
        from .ml_models.credit_score import CreditScoreModel
        from .ml_models.spend_classifier import SpendClassifier
        from .ml_models.anomaly_detector import AnomalyDetector
        
        # Initialize models without loading artifacts (they will use fallback methods)
        # In a production environment, you would load pre-trained models from the ml/artifacts directory
        self.credit_model = CreditScoreModel()  # No model path - will use fallback scoring
        self.spend_classifier = SpendClassifier()  # No model path - will use rule-based classification
        self.anomaly_detector = AnomalyDetector()  # No model required - uses rule-based detection
    
    def get_30d_spending(self, user_id: str) -> Dict:
        """Get enhanced 30-day spending analytics with ML insights."""
        try:
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            sixty_days_ago = datetime.utcnow() - timedelta(days=60)
            
            # Get basic 30-day spending sum for backward compatibility
            total_spent_db = (
                self.db.query(func.sum(Transaction.amount))
                .filter(
                    and_(
                        Transaction.user_id == user_id,
                        Transaction.created_at >= thirty_days_ago,
                        Transaction.tx_type.in_([
                            TransactionType.PAYMENT,
                            TransactionType.SWAP, 
                            TransactionType.BURN
                        ]),
                        Transaction.amount > 0  # Only positive amounts (outgoing)
                    )
                )
                .scalar()
            )
            
            total_spent_db = total_spent_db or Decimal("0")
            
            # Get transactions that match the EXACT same criteria as the main spending query
            spending_transactions = (
                self.db.query(Transaction)
                .filter(
                    and_(
                        Transaction.user_id == user_id,
                        Transaction.created_at >= thirty_days_ago,
                        Transaction.tx_type.in_([
                            TransactionType.PAYMENT,
                            TransactionType.SWAP, 
                            TransactionType.BURN
                        ]),
                        Transaction.amount > 0  # Only positive amounts (outgoing)
                    )
                )
                .order_by(Transaction.created_at.desc())
                .all()
            )
            
            # Calculate total from actual transactions for perfect consistency
            total_spent = sum(Decimal(str(tx.amount)) for tx in spending_transactions) if spending_transactions else Decimal("0")
            
            # Initialize response with consistent total
            response = {
                "last_30d_spend": total_spent,  # Use calculated total for perfect consistency
                "category_breakdown": [],
                "trend_analysis": [],
                "anomaly_insights": [],
                "avg_transaction_amount": Decimal("0"),
                "total_transactions": 0,
                "most_active_category": "Others",
                "spending_pattern_score": 0.0,
                "anomaly_rate": 0.0,
                "vs_previous_30d": 0.0,
                "vs_user_average": 0.0
            }
            
            if not spending_transactions:
                return response
                
            # Convert to dict format for ML processing
            outgoing_txs = []
            for tx in spending_transactions:
                tx_dict = {
                    'transaction_date': tx.created_at,
                    'amount': float(tx.amount),
                    'tx_type': tx.tx_type.value if tx.tx_type else '',
                    'category': getattr(tx, 'category', 'Others'),
                    'description': getattr(tx, 'description', ''),
                    'merchant_name': getattr(tx, 'merchant_name', ''),
                    'location': getattr(tx, 'location', ''),
                    'mcc': getattr(tx, 'mcc', ''),
                    'channel': getattr(tx, 'channel', 'mobile_app'),
                    'is_weekend': tx.created_at.weekday() >= 5,
                    'is_outlier': False
                }
                outgoing_txs.append(tx_dict)
                
            response["total_transactions"] = len(outgoing_txs)
            response["avg_transaction_amount"] = total_spent / len(outgoing_txs) if outgoing_txs else Decimal("0")
            
            # 1. ML-powered category breakdown (use EXACT same transactions as main query)
            try:
                category_breakdown = self._get_category_breakdown(outgoing_txs, total_spent)
                response["category_breakdown"] = category_breakdown
                
                # Set most active category
                if category_breakdown:
                    response["most_active_category"] = max(
                        category_breakdown, 
                        key=lambda x: x["transaction_count"]
                    )["category"]
            except Exception as e:
                logger.error(f"Failed to get category breakdown: {e}")
            
            # 2. Trend analysis (weekly breakdown) - use same transactions
            try:
                trend_analysis = self._get_trend_analysis(outgoing_txs)
                response["trend_analysis"] = trend_analysis
            except Exception as e:
                logger.error(f"Failed to get trend analysis: {e}")
            
            # 3. Anomaly detection insights (use all transactions for broader detection)
            try:
                all_transactions = self.get_user_transactions(user_id, days=30)
                anomaly_insights = self._get_anomaly_insights(all_transactions)
                response["anomaly_insights"] = anomaly_insights
                
                # Calculate anomaly rate based on spending transactions
                total_anomalies = sum(insight["detected_count"] for insight in anomaly_insights)
                response["anomaly_rate"] = (total_anomalies / len(outgoing_txs) * 100) if outgoing_txs else 0.0
            except Exception as e:
                logger.error(f"Failed to get anomaly insights: {e}")
            
            # 4. Spending pattern regularity score
            try:
                response["spending_pattern_score"] = self._calculate_spending_pattern_score(outgoing_txs)
            except Exception as e:
                logger.error(f"Failed to calculate spending pattern score: {e}")
            
            # 5. Comparison with previous period and user average (use DB total for comparisons)
            try:
                comparisons = self._get_spending_comparisons(user_id, total_spent_db, thirty_days_ago, sixty_days_ago)
                response.update(comparisons)
            except Exception as e:
                logger.error(f"Failed to get spending comparisons: {e}")
            
            return response
            
        except Exception as e:
            logger.error(f"Failed to get 30d spending for user {user_id}: {e}")
            return {
                "last_30d_spend": Decimal("0"),
                "category_breakdown": [],
                "trend_analysis": [],
                "anomaly_insights": [],
                "avg_transaction_amount": Decimal("0"),
                "total_transactions": 0,
                "most_active_category": "Others",
                "spending_pattern_score": 0.0,
                "anomaly_rate": 0.0,
                "vs_previous_30d": 0.0,
                "vs_user_average": 0.0
            }
    
    def get_user_transactions(self, user_id: str, days: int = 90) -> List[Dict]:
        """Get user transaction data for ML processing."""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            transactions = (
                self.db.query(Transaction)
                .filter(
                    and_(
                        Transaction.user_id == user_id,
                        Transaction.created_at >= cutoff_date
                    )
                )
                .order_by(Transaction.created_at.desc())
                .all()
            )
            
            # Convert to dict format for ML models
            tx_data = []
            for tx in transactions:
                tx_dict = {
                    'transaction_date': tx.created_at,
                    'amount': float(tx.amount),
                    'tx_type': tx.tx_type.value if tx.tx_type else '',  # Add tx_type field
                    'category': getattr(tx, 'category', 'Others'),
                    'description': getattr(tx, 'description', ''),
                    'merchant_name': getattr(tx, 'merchant_name', ''),
                    'location': getattr(tx, 'location', ''),
                    'mcc': getattr(tx, 'mcc', ''),
                    'channel': getattr(tx, 'channel', 'mobile_app'),
                    'is_weekend': tx.created_at.weekday() >= 5,
                    'is_outlier': False  # Will be calculated by anomaly detector
                }
                tx_data.append(tx_dict)
            
            return tx_data
            
        except Exception as e:
            logger.error(f"Failed to get transactions for user {user_id}: {e}")
            return []
    
    def classify_transaction(self, description: str, mcc: str = "", merchant_name: str = "") -> Dict:
        """Classify a single transaction using ML."""
        try:
            result = self.spend_classifier.predict(description, mcc, merchant_name)
            return result
        except Exception as e:
            logger.error(f"Failed to classify transaction: {e}")
            return {
                'category': 'Others',
                'confidence': 0.5,
                'method': 'fallback'
            }
    
    def classify_transactions_batch(self, transactions: List[Dict]) -> List[Dict]:
        """Classify multiple transactions using ML."""
        try:
            results = self.spend_classifier.predict_batch(transactions)
            return results
        except Exception as e:
            logger.error(f"Failed to classify transactions batch: {e}")
            return [{'category': 'Others', 'confidence': 0.5, 'method': 'fallback'} for _ in transactions]
    
    def detect_anomalies(self, user_id: str) -> Dict:
        """Detect spending anomalies for user."""
        try:
            transactions = self.get_user_transactions(user_id)
            if not transactions:
                return {'anomalies': [], 'total_checked': 0}
            
            result = self.anomaly_detector.detect_anomalies(transactions)
            return result
        except Exception as e:
            logger.error(f"Failed to detect anomalies for user {user_id}: {e}")
            return {'anomalies': [], 'total_checked': 0, 'error': str(e)}
    
    def get_insights(self, user_id: str) -> List[Dict[str, str]]:
        """Get AI-powered insights for user."""
        try:
            # Get transaction data
            transactions = self.get_user_transactions(user_id)
            spending = self.get_30d_spending(user_id)
            
            loyalty = (
                self.db.query(LoyaltyPoint)
                .filter(LoyaltyPoint.user_id == user_id)
                .first()
            )
            points = loyalty.points if loyalty else 0
            
            # Generate ML-powered insights
            insights = [
                {
                    "title": "Monthly Spending",
                    "value": f"${spending} in last 30 days"
                },
                {
                    "title": "Loyalty Points", 
                    "value": f"{points} SYP points available"
                }
            ]
            
            # Add ML insights if we have transaction data
            if transactions:
                # Get spending by category
                category_spending = {}
                for tx in transactions[-30:]:  # Last 30 transactions
                    classification = self.classify_transaction(
                        tx.get('description', ''),
                        tx.get('mcc', ''),
                        tx.get('merchant_name', '')
                    )
                    category = classification['category']
                    category_spending[category] = category_spending.get(category, 0) + tx['amount']
                
                if category_spending:
                    top_category = max(category_spending, key=category_spending.get)
                    top_amount = category_spending[top_category]
                    insights.append({
                        "title": "Top Spending Category",
                        "value": f"{top_category}: ${top_amount:.2f}"
                    })
                
                # Check for anomalies
                anomaly_result = self.detect_anomalies(user_id)
                if anomaly_result.get('anomalies'):
                    insights.append({
                        "title": "Spending Alert",
                        "value": f"Found {len(anomaly_result['anomalies'])} unusual transactions"
                    })
                else:
                    insights.append({
                        "title": "Spending Pattern",
                        "value": "Your spending patterns look normal"
                    })
            
            # Add default insights
            insights.extend([
                {
                    "title": "Savings Goal",
                    "value": "63% towards emergency fund"
                },
                {
                    "title": "Investment Tip",
                    "value": "Consider diversifying into Stellar-based DeFi"
                },
                {
                    "title": "Reward Status",
                    "value": "Platinum tier - 2x points on swaps"
                }
            ])
            
            return insights
            
        except Exception as e:
            logger.error(f"Failed to get insights for user {user_id}: {e}")
            return [{"title": "Status", "value": "Analytics temporarily unavailable"}]
    
    def get_credit_score(self, user_id: str) -> int:
        """Get ML-powered credit score for user."""
        try:
            # First check existing credit score
            credit_score = (
                self.db.query(CreditScore)
                .filter(CreditScore.user_id == user_id)
                .order_by(CreditScore.updated_at.desc())
                .first()
            )
            
            # Get transaction data for ML scoring
            transactions = self.get_user_transactions(user_id)
            
            if transactions:
                # Use ML model to predict credit score
                ml_result = self.credit_model.predict_score(transactions)
                ml_score = ml_result.get('credit_score', 650)
                
                # Update or create credit score record
                if credit_score:
                    credit_score.score = ml_score
                    credit_score.updated_at = datetime.utcnow()
                else:
                    credit_score = CreditScore(
                        user_id=user_id,
                        score=ml_score,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    self.db.add(credit_score)
                
                self.db.commit()
                return ml_score
            
            elif credit_score:
                return credit_score.score
            
            # Fallback scoring
            tx_count = (
                self.db.query(func.count(Transaction.id))
                .filter(Transaction.user_id == user_id)
                .scalar()
            )
            
            base_score = 650
            bonus = min(tx_count * 5, 100)  # Max 100 point bonus
            
            return base_score + bonus
            
        except Exception as e:
            logger.error(f"Failed to get credit score for user {user_id}: {e}")
            return 680  # Default score
    
    def get_detailed_credit_score(self, user_id: str) -> Dict:
        """Get detailed credit score analysis with reason codes."""
        try:
            transactions = self.get_user_transactions(user_id)
            
            if not transactions:
                return {
                    'credit_score': 650,
                    'grade': 'C',
                    'reason_codes': [],
                    'model_version': 'fallback'
                }
            
            result = self.credit_model.predict_score(transactions)
            return result
            
        except Exception as e:
            logger.error(f"Failed to get detailed credit score for user {user_id}: {e}")
            return {
                'credit_score': 680,
                'grade': 'C',
                'reason_codes': [],
                'error': str(e)
            }
    
    def get_alerts(self, user_id: str) -> List[Dict[str, str]]:
        """Get user alerts enhanced with ML anomaly detection."""
        try:
            # Get existing alerts
            alerts = (
                self.db.query(Alert)
                .filter(Alert.user_id == user_id)
                .order_by(Alert.created_at.desc())
                .limit(10)
                .all()
            )
            
            alert_list = [
                {
                    "type": alert.type.value,
                    "message": alert.message,
                    "created_at": alert.created_at.isoformat()
                }
                for alert in alerts
            ]
            
            # Add ML-generated anomaly alerts
            anomaly_result = self.detect_anomalies(user_id)
            for anomaly in anomaly_result.get('anomalies', [])[:3]:  # Top 3 anomalies
                alert_list.append({
                    "type": "anomaly",
                    "message": f"Unusual {anomaly.get('type', 'spending')} detected: {anomaly.get('description', 'Check your recent transactions')}",
                    "created_at": datetime.utcnow().isoformat()
                })
            
            return alert_list
            
        except Exception as e:
            logger.error(f"Failed to get alerts for user {user_id}: {e}")
            return []
    
    def _get_category_breakdown(self, transactions: List[Dict], total_spent: Decimal) -> List[Dict]:
        """Get ML-powered category breakdown of spending."""
        try:
            # Use ML classifier to categorize all transactions
            classifications = self.classify_transactions_batch(transactions)
            
            # Group by category
            category_stats = {}
            total_from_txs = Decimal('0')  # Track total from transactions for debugging
            
            for i, tx in enumerate(transactions):
                classification = classifications[i] if i < len(classifications) else {'category': 'Others'}
                category = classification['category']
                amount = Decimal(str(tx['amount']))
                total_from_txs += amount  # Add to debug total
                
                if category not in category_stats:
                    category_stats[category] = {
                        'amount': Decimal('0'),
                        'count': 0,
                        'amounts': []
                    }
                
                category_stats[category]['amount'] += amount
                category_stats[category]['count'] += 1
                category_stats[category]['amounts'].append(amount)
            
            # Log for debugging
            logger.info(f"Category breakdown debug: total_spent={total_spent}, total_from_txs={total_from_txs}, tx_count={len(transactions)}")
            
            # Build breakdown response - use total_from_txs for consistency instead of total_spent
            breakdown = []
            for category, stats in category_stats.items():
                percentage = float(stats['amount'] / total_from_txs * 100) if total_from_txs > 0 else 0.0
                avg_amount = stats['amount'] / stats['count'] if stats['count'] > 0 else Decimal('0')
                
                breakdown.append({
                    'category': category,
                    'amount': stats['amount'],
                    'percentage': round(percentage, 2),
                    'transaction_count': stats['count'],
                    'avg_amount': avg_amount
                })
            
            # Sort by amount descending
            breakdown.sort(key=lambda x: x['amount'], reverse=True)
            return breakdown
            
        except Exception as e:
            logger.error(f"Failed to get category breakdown: {e}")
            return []
    
    def _get_trend_analysis(self, transactions: List[Dict]) -> List[Dict]:
        """Get weekly spending trend analysis."""
        try:
            from collections import defaultdict
            from datetime import datetime  # Move import to function level
            
            # Group transactions by week
            weekly_spending = defaultdict(Decimal)
            
            for tx in transactions:
                tx_date = tx['transaction_date']
                if isinstance(tx_date, str):
                    tx_date = datetime.fromisoformat(tx_date.replace('Z', '+00:00'))
                
                # Calculate week number (0-3 for last 4 weeks)
                days_ago = (datetime.utcnow().replace(tzinfo=tx_date.tzinfo) - tx_date).days
                week = min(days_ago // 7, 3)  # Cap at week 3
                week_key = f"week{week + 1}"
                
                weekly_spending[week_key] += Decimal(str(tx['amount']))
            
            # Build trend analysis
            trend_analysis = []
            previous_amount = None
            
            for week_num in range(1, 5):  # week1 to week4 (most recent to oldest)
                week_key = f"week{week_num}"
                amount = weekly_spending.get(week_key, Decimal('0'))
                
                change_from_previous = 0.0
                if previous_amount is not None and previous_amount > 0:
                    change_from_previous = float((amount - previous_amount) / previous_amount * 100)
                
                trend_analysis.append({
                    'period': week_key,
                    'amount': amount,
                    'change_from_previous': round(change_from_previous, 2)
                })
                
                previous_amount = amount
            
            return trend_analysis
            
        except Exception as e:
            logger.error(f"Failed to get trend analysis: {e}")
            return []
    
    def _get_anomaly_insights(self, transactions: List[Dict]) -> List[Dict]:
        """Get anomaly detection insights using ML."""
        try:
            # Use ML anomaly detector
            anomaly_result = self.anomaly_detector.detect_anomalies(transactions)
            anomalies = anomaly_result.get('anomalies', [])
            
            # Group anomalies by type for insights
            anomaly_groups = {}
            for anomaly in anomalies:
                anomaly_type = anomaly.get('type', 'unknown')
                if anomaly_type not in anomaly_groups:
                    anomaly_groups[anomaly_type] = {
                        'count': 0,
                        'severity': 'low',
                        'descriptions': []
                    }
                
                anomaly_groups[anomaly_type]['count'] += 1
                anomaly_groups[anomaly_type]['descriptions'].append(anomaly.get('description', ''))
                
                # Update severity (highest wins)
                severity = anomaly.get('severity', 'low')
                current_severity = anomaly_groups[anomaly_type]['severity']
                if severity == 'high' or (severity == 'medium' and current_severity == 'low'):
                    anomaly_groups[anomaly_type]['severity'] = severity
            
            # Build insights
            insights = []
            for anomaly_type, data in anomaly_groups.items():
                # Create user-friendly descriptions
                type_descriptions = {
                    'amount_outlier': 'Unusual transaction amounts detected',
                    'high_frequency': 'Rapid successive transactions found',
                    'night_high_amount': 'Large transactions at unusual times',
                    'rapid_location_change': 'Quick location changes detected',
                    'duplicate_amount': 'Duplicate transactions identified',
                    'round_number_bias': 'High frequency of round-number transactions',
                    'high_daily_volume': 'Unusually high daily transaction volume'
                }
                
                description = type_descriptions.get(anomaly_type, f'Anomaly type: {anomaly_type}')
                
                insights.append({
                    'type': anomaly_type,
                    'description': description,
                    'severity': data['severity'],
                    'detected_count': data['count']
                })
            
            # Sort by severity and count
            severity_order = {'high': 3, 'medium': 2, 'low': 1}
            insights.sort(key=lambda x: (severity_order.get(x['severity'], 0), x['detected_count']), reverse=True)
            
            return insights
            
        except Exception as e:
            logger.error(f"Failed to get anomaly insights: {e}")
            return []
    
    def _calculate_spending_pattern_score(self, transactions: List[Dict]) -> float:
        """Calculate spending pattern regularity score (0-1)."""
        try:
            if len(transactions) < 5:  # Need minimum data
                return 0.5
            
            # Calculate coefficient of variation for spending amounts
            amounts = [float(tx['amount']) for tx in transactions]
            if not amounts:
                return 0.0
            
            mean_amount = sum(amounts) / len(amounts)
            if mean_amount == 0:
                return 0.0
            
            variance = sum((x - mean_amount) ** 2 for x in amounts) / len(amounts)
            std_dev = variance ** 0.5
            cv = std_dev / mean_amount  # Coefficient of variation
            
            # Convert CV to regularity score (lower CV = higher regularity)
            # CV of 0 = perfect regularity (score 1.0)
            # CV of 2+ = very irregular (score approaches 0)
            regularity_score = max(0.0, min(1.0, 1.0 - (cv / 2.0)))
            
            # Also factor in time regularity
            dates = []
            for tx in transactions:
                tx_date = tx['transaction_date']
                if isinstance(tx_date, str):
                    from datetime import datetime
                    tx_date = datetime.fromisoformat(tx_date.replace('Z', '+00:00'))
                dates.append(tx_date)
            
            if len(dates) > 1:
                dates.sort()
                intervals = [(dates[i] - dates[i-1]).total_seconds() / 3600 for i in range(1, len(dates))]  # Hours
                if intervals:
                    mean_interval = sum(intervals) / len(intervals)
                    if mean_interval > 0:
                        interval_cv = (sum((x - mean_interval) ** 2 for x in intervals) / len(intervals)) ** 0.5 / mean_interval
                        time_regularity = max(0.0, min(1.0, 1.0 - (interval_cv / 3.0)))
                        
                        # Combine amount and time regularity
                        regularity_score = (regularity_score + time_regularity) / 2
            
            return round(regularity_score, 3)
            
        except Exception as e:
            logger.error(f"Failed to calculate spending pattern score: {e}")
            return 0.5
    
    def _get_spending_comparisons(self, user_id: str, current_30d_spend: Decimal, thirty_days_ago: datetime, sixty_days_ago: datetime) -> Dict:
        """Get spending comparisons with previous periods."""
        try:
            # Get previous 30-day spending (days 30-60)
            previous_30d_spend = (
                self.db.query(func.sum(Transaction.amount))
                .filter(
                    and_(
                        Transaction.user_id == user_id,
                        Transaction.created_at >= sixty_days_ago,
                        Transaction.created_at < thirty_days_ago,
                        Transaction.tx_type.in_([
                            TransactionType.PAYMENT,
                            TransactionType.SWAP, 
                            TransactionType.BURN
                        ]),
                        Transaction.amount > 0
                    )
                )
                .scalar()
            ) or Decimal("0")
            
            # Get user's historical average (last 6 months, excluding current 30 days)
            six_months_ago = datetime.utcnow() - timedelta(days=180)
            historical_avg = (
                self.db.query(func.avg(Transaction.amount))
                .filter(
                    and_(
                        Transaction.user_id == user_id,
                        Transaction.created_at >= six_months_ago,
                        Transaction.created_at < thirty_days_ago,
                        Transaction.tx_type.in_([
                            TransactionType.PAYMENT,
                            TransactionType.SWAP, 
                            TransactionType.BURN
                        ]),
                        Transaction.amount > 0
                    )
                )
                .scalar()
            ) or Decimal("0")
            
            # Calculate percentage changes
            vs_previous_30d = 0.0
            if previous_30d_spend > 0:
                vs_previous_30d = float((current_30d_spend - previous_30d_spend) / previous_30d_spend * 100)
            
            vs_user_average = 0.0
            if historical_avg > 0:
                # Convert historical average to 30-day equivalent (approximate)
                historical_30d_equivalent = historical_avg * 30  # Rough estimate
                vs_user_average = float((current_30d_spend - historical_30d_equivalent) / historical_30d_equivalent * 100)
            
            return {
                'vs_previous_30d': round(vs_previous_30d, 2),
                'vs_user_average': round(vs_user_average, 2)
            }
            
        except Exception as e:
            logger.error(f"Failed to get spending comparisons: {e}")
            return {
                'vs_previous_30d': 0.0,
                'vs_user_average': 0.0
            }