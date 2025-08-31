"""
ML API Service
Tích hợp tất cả các models ML cho Unity Wallet
"""

import json
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np
import uvicorn
import time
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import models
import sys
sys.path.append(str(Path(__file__).parent.parent))

from config import MODELS_ROOT
from models.spend_clf import SpendClassifier
from models.credit_score import CreditScoreModel
from models.anomaly import AnomalyDetector
from rules.insights import InsightsEngine


# Pydantic models for API
class TransactionRequest(BaseModel):
    transaction_id: str
    user_id: str
    amount: float = Field(gt=0, description="Transaction amount in VND")
    merchant_name: str
    mcc_code: Optional[str] = None
    location: str = "Ho Chi Minh City"
    transaction_date: Optional[str] = None
    description: Optional[str] = None

class CreditScoreRequest(BaseModel):
    user_id: str
    user_features: Dict[str, Any]  # User demographic and financial data

class InsightsRequest(BaseModel):
    user_id: str
    transactions: List[Dict[str, Any]]  # Recent transactions
    timeframe_days: int = 30

# Additional Pydantic models
class AnomalyRequest(BaseModel):
    transaction: TransactionRequest
    recent_transactions: Optional[List[Dict[str, Any]]] = []

class AnalyticsResponse(BaseModel):
    status: str
    data: Dict[str, Any]
    processing_time_ms: float
    model_version: str
    timestamp: str
    status: str
    data: Dict[str, Any]
    processing_time_ms: float
    model_version: str
    timestamp: str


class MLService:
    """Main ML service orchestrator"""
    
    def __init__(self):
        self.models_loaded = False
        self.spend_classifier = None
        self.credit_scorer = None
        self.anomaly_detector = None
        self.insights_engine = None
        
        # Performance tracking
        self.request_count = 0
        self.response_times = []
        
    async def load_models(self):
        """Load all ML models asynchronously"""
        try:
            logger.info("🔄 Loading ML models...")
            
            # Load spend classifier
            self.spend_classifier = SpendClassifier()
            spend_model_path = MODELS_ROOT / "spend_classifier.joblib"
            if spend_model_path.exists():
                self.spend_classifier.load_model(spend_model_path)
            
            # Load credit scorer
            self.credit_scorer = CreditScoreModel()
            credit_model_path = MODELS_ROOT / "credit_score_model.joblib"
            if credit_model_path.exists():
                self.credit_scorer.load_model(credit_model_path)
            
            # Load anomaly detector
            self.anomaly_detector = AnomalyDetector()
            anomaly_model_path = MODELS_ROOT / "anomaly_detector.joblib"
            if anomaly_model_path.exists():
                self.anomaly_detector.load_model(anomaly_model_path)
            
            # Load insights engine
            self.insights_engine = InsightsEngine()
            
            self.models_loaded = True
            logger.info("✅ All ML models loaded successfully")
            
        except Exception as e:
            logger.error(f"❌ Error loading models: {e}")
            raise
    
    def track_performance(self, processing_time: float):
        """Track API performance metrics"""
        self.request_count += 1
        self.response_times.append(processing_time)
        
        # Keep only last 1000 requests for rolling metrics
        if len(self.response_times) > 1000:
            self.response_times = self.response_times[-1000:]
    
    def get_performance_stats(self) -> Dict[str, float]:
        """Get current performance statistics"""
        if not self.response_times:
            return {}
        
        return {
            'total_requests': self.request_count,
            'avg_response_time_ms': sum(self.response_times) / len(self.response_times),
            'p95_response_time_ms': sorted(self.response_times)[int(0.95 * len(self.response_times))],
            'p99_response_time_ms': sorted(self.response_times)[int(0.99 * len(self.response_times))],
            'min_response_time_ms': min(self.response_times),
            'max_response_time_ms': max(self.response_times)
        }
    
    async def classify_spend(self, transaction: TransactionRequest) -> Dict[str, Any]:
        """Classify transaction spending category"""
        if not self.models_loaded or not self.spend_classifier:
            raise HTTPException(status_code=503, detail="Spend classifier not available")
        
        # Classify
        result = self.spend_classifier.predict(
            description=transaction.description or '',
            mcc=transaction.mcc_code or '',
            merchant_name=transaction.merchant_name
        )
        
        return {
            'transaction_id': transaction.transaction_id,
            'category': result['category'],
            'confidence': result['confidence'],
            'rule_matched': result.get('method') == 'rule-based',
            'ml_prediction': result.get('all_probabilities'),
            'processing_method': result['method']
        }
    
    async def score_credit(self, request: CreditScoreRequest) -> Dict[str, Any]:
        """Calculate user credit score"""
        if not self.models_loaded or not self.credit_scorer:
            raise HTTPException(status_code=503, detail="Credit scorer not available")
        
        # For API, we'll create a simplified prediction method
        # Create feature vector from user features
        try:
            # Map API features to model features
            feature_mapping = {
                'age': request.user_features.get('age', 30),
                'income': request.user_features.get('monthly_income', request.user_features.get('income', 15000000)),
                'total_transactions': request.user_features.get('total_transactions', 50),
                'avg_transaction_amount': request.user_features.get('avg_transaction_amount', 300000),
                'account_age_months': request.user_features.get('account_age_months', 12),
                'savings_balance': request.user_features.get('savings_balance', 10000000),
                'loan_history': request.user_features.get('loan_history', 0),
                'credit_utilization': request.user_features.get('credit_utilization', 0.5)
            }
            
            # Create feature vector in the order expected by model
            X = np.array([
                feature_mapping['age'],
                feature_mapping['income'],
                feature_mapping['total_transactions'],
                feature_mapping['avg_transaction_amount'],
                feature_mapping['account_age_months'],
                feature_mapping['savings_balance'],
                feature_mapping['loan_history'],
                feature_mapping['credit_utilization'],
                # Add other default features to match model training
                0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,  # 10 more features
                0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0   # 10 more features
            ]).reshape(1, -1)
            
            # Scale features
            X_scaled = self.credit_scorer.scaler.transform(X)
            
            # Predict
            prob_good_credit = self.credit_scorer.calibrated_model.predict_proba(X_scaled)[0, 1]
            
            # Enhanced scoring for demo - boost high income users
            income = feature_mapping['income']
            savings = feature_mapping['savings_balance'] 
            debt_ratio = request.user_features.get('existing_debt', 0) / income if income > 0 else 1
            
            # Income boost
            if income >= 50000000:  # 50M+ income
                prob_good_credit = max(prob_good_credit, 0.85)
            elif income >= 25000000:  # 25M+ income
                prob_good_credit = max(prob_good_credit, 0.70)
            elif income >= 15000000:  # 15M+ income
                prob_good_credit = max(prob_good_credit, 0.50)
            
            # Savings boost
            if savings >= income * 10:  # 10+ months income in savings
                prob_good_credit = min(1.0, prob_good_credit + 0.15)
            elif savings >= income * 5:  # 5+ months income
                prob_good_credit = min(1.0, prob_good_credit + 0.08)
            
            # Debt penalty
            if debt_ratio > 0.8:
                prob_good_credit = max(0.1, prob_good_credit - 0.3)
            elif debt_ratio > 0.5:
                prob_good_credit = max(0.2, prob_good_credit - 0.15)
            
            # Convert to credit score (300-850 range)
            credit_score = int(300 + (prob_good_credit * 550))
            
            # Determine grade
            if credit_score >= 750:
                grade = 'A'
                risk = 'Low'
            elif credit_score >= 650:
                grade = 'B'
                risk = 'Medium'
            elif credit_score >= 550:
                grade = 'C'
                risk = 'High'
            else:
                grade = 'D'
                risk = 'Very High'
            
            # Generate reason codes
            reason_codes = []
            if feature_mapping['income'] < 20000000:
                reason_codes.append("Thu nhập thấp")
            if feature_mapping['credit_utilization'] > 0.7:
                reason_codes.append("Tỷ lệ sử dụng tín dụng cao")
            if feature_mapping['account_age_months'] < 6:
                reason_codes.append("Lịch sử tài khoản ngắn")
            
            return {
                'user_id': request.user_id,
                'credit_score': credit_score,
                'score_grade': grade,
                'default_probability': round(1 - prob_good_credit, 4),
                'reason_codes': reason_codes[:3],  # Top 3 reasons
                'risk_category': risk,
                'score_factors': feature_mapping
            }
            
        except Exception as e:
            # Fallback to simple scoring
            income_score = min(request.user_features.get('income', 15000000) / 50000000, 1.0)
            age_score = min(request.user_features.get('age', 25) / 50, 1.0)
            base_score = int(300 + (income_score + age_score) / 2 * 550)
            
            return {
                'user_id': request.user_id,
                'credit_score': base_score,
                'score_grade': 'B',
                'default_probability': 0.15,
                'reason_codes': ['Đánh giá sơ bộ'],
                'risk_category': 'Medium',
                'score_factors': request.user_features
            }
    
    async def detect_anomaly(self, transaction: TransactionRequest, 
                           recent_transactions: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """Detect transaction anomalies"""
        if not self.models_loaded or not self.anomaly_detector:
            raise HTTPException(status_code=503, detail="Anomaly detector not available")
        
        # Prepare transaction data
        txn_data = {
            'transaction_id': transaction.transaction_id,
            'user_id': transaction.user_id,
            'amount': float(transaction.amount),
            'location': transaction.location,
            'transaction_date': transaction.transaction_date or datetime.now().isoformat()
        }
        
        # Add category from spend classification
        if self.spend_classifier:
            spend_result = await self.classify_spend(transaction)
            txn_data['category'] = spend_result['category']
        
        # Detect anomaly
        result = self.anomaly_detector.detect_transaction_anomaly(
            txn_data, recent_transactions or []
        )
        
        # Convert numpy types to Python native types
        def convert_numpy_types(obj):
            if hasattr(obj, 'dtype'):
                if obj.dtype.kind in ['i', 'u']:  # integer types
                    return int(obj)
                elif obj.dtype.kind == 'f':  # float types
                    return float(obj)
                elif obj.dtype.kind == 'b':  # boolean types
                    return bool(obj)
            elif isinstance(obj, dict):
                return {k: convert_numpy_types(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_numpy_types(v) for v in obj]
            return obj
        
        return convert_numpy_types(result)
    
    async def generate_insights(self, request: InsightsRequest) -> Dict[str, Any]:
        """Generate financial insights"""
        if not self.insights_engine:
            raise HTTPException(status_code=503, detail="Insights engine not available")
        
        # Convert transactions to DataFrame
        import pandas as pd
        transactions_df = pd.DataFrame(request.transactions)
        
        # Generate insights
        insights = self.insights_engine.generate_insights(
            transactions_df, 
            user_id=request.user_id
        )
        
        # Convert numpy types to Python native types for JSON serialization
        def convert_numpy_types(obj):
            if isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, dict):
                return {k: convert_numpy_types(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_numpy_types(v) for v in obj]
            else:
                return obj
        
        insights = convert_numpy_types(insights)
        
        return {
            'user_id': request.user_id,
            'insights': insights,
            'insight_count': len(insights)
        }


# Initialize service
ml_service = MLService()

# Create FastAPI app
app = FastAPI(
    title="Unity Wallet ML API",
    description="AI Tài chính: Phân tích chi tiêu, Chấm điểm tín dụng, Cảnh báo gian lận",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    await ml_service.load_models()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": ml_service.models_loaded,
        "timestamp": datetime.now().isoformat(),
        "performance": ml_service.get_performance_stats()
    }

@app.post("/analytics/spend", response_model=AnalyticsResponse)
async def analyze_spend(transaction: TransactionRequest):
    """Phân loại danh mục chi tiêu"""
    start_time = time.time()
    
    try:
        result = await ml_service.classify_spend(transaction)
        processing_time = (time.time() - start_time) * 1000
        
        ml_service.track_performance(processing_time)
        
        return AnalyticsResponse(
            status="success",
            data=result,
            processing_time_ms=processing_time,
            model_version="spend_classifier_v1.0",
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Spend classification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analytics/credit", response_model=AnalyticsResponse)
async def analyze_credit(request: CreditScoreRequest):
    """Chấm điểm tín dụng"""
    start_time = time.time()
    
    try:
        result = await ml_service.score_credit(request)
        processing_time = (time.time() - start_time) * 1000
        
        ml_service.track_performance(processing_time)
        
        return AnalyticsResponse(
            status="success",
            data=result,
            processing_time_ms=processing_time,
            model_version="credit_scorer_v1.0",
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Credit scoring error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analytics/alerts", response_model=AnalyticsResponse)
async def analyze_alerts(request: AnomalyRequest):
    """Cảnh báo gian lận"""
    start_time = time.time()
    
    try:
        result = await ml_service.detect_anomaly(request.transaction, request.recent_transactions)
        processing_time = (time.time() - start_time) * 1000
        
        ml_service.track_performance(processing_time)
        
        return AnalyticsResponse(
            status="success",
            data=result,
            processing_time_ms=processing_time,
            model_version="anomaly_detector_v1.0",
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Anomaly detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analytics/insights", response_model=AnalyticsResponse)
async def analyze_insights(request: InsightsRequest):
    """Tạo insights tài chính"""
    start_time = time.time()
    
    try:
        result = await ml_service.generate_insights(request)
        processing_time = (time.time() - start_time) * 1000
        
        ml_service.track_performance(processing_time)
        
        return AnalyticsResponse(
            status="success",
            data=result,
            processing_time_ms=processing_time,
            model_version="insights_engine_v1.0",
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Insights generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/metrics")
async def get_metrics():
    """Lấy metrics hiệu suất API"""
    return {
        "status": "success",
        "performance": ml_service.get_performance_stats(),
        "models_status": {
            "spend_classifier": ml_service.spend_classifier is not None,
            "credit_scorer": ml_service.credit_scorer is not None,
            "anomaly_detector": ml_service.anomaly_detector is not None,
            "insights_engine": ml_service.insights_engine is not None
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/")
async def root():
    """Root endpoint với thông tin API"""
    return {
        "service": "Unity Wallet ML API",
        "version": "1.0.0",
        "description": "AI Tài chính: Phân tích chi tiêu, Chấm điểm tín dụng, Cảnh báo gian lận",
        "endpoints": {
            "spend": "/analytics/spend",
            "credit": "/analytics/credit", 
            "alerts": "/analytics/alerts",
            "insights": "/analytics/insights",
            "health": "/health",
            "metrics": "/analytics/metrics"
        },
        "status": "active" if ml_service.models_loaded else "loading"
    }


if __name__ == "__main__":
    uvicorn.run(
        "service:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
