"""
Anomaly Detection API Router
Endpoints để phát hiện và monitor bất thường
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio

from models.schemas import AnomalyDetection
from services.data_collector import stellar_collector
from services.feature_engineering import feature_service
from services.anomaly_detection import anomaly_service

router = APIRouter()

@router.get("/check/{public_key}")
async def check_anomalies(
    public_key: str,
    days_back: int = Query(default=30, ge=1, le=90)
):
    """
    Kiểm tra anomalies cho một wallet
    """
    try:
        if not public_key.startswith('G') or len(public_key) != 56:
            raise HTTPException(400, "Invalid Stellar public key format")
        
        # Collect transaction data
        transactions = await stellar_collector.collect_full_history(
            account=public_key,
            days_back=days_back,
            max_records=2000
        )
        
        if not transactions:
            return {
                "account": public_key,
                "status": "no_data",
                "risk_score": 0.0,
                "anomaly_count": 0,
                "anomalies": [],
                "message": "Không có dữ liệu giao dịch để phân tích"
            }
        
        # Calculate features
        balances = await stellar_collector.get_account_balances(public_key)
        features = feature_service.calculate_features(
            transactions=transactions,
            balances=balances,
            period_days=days_back
        )
        
        # Detect anomalies
        anomalies = anomaly_service.detect_anomalies(
            transactions=transactions,
            features=features
        )
        
        # Calculate risk score
        risk_score = anomaly_service.get_risk_score(anomalies)
        
        # Determine status
        if risk_score < 0.3:
            status = "safe"
            message = "Tài khoản an toàn, không phát hiện hoạt động bất thường"
        elif risk_score < 0.7:
            status = "caution"
            message = "Phát hiện một số hoạt động cần chú ý"
        else:
            status = "high_risk"
            message = "Cảnh báo: Phát hiện hoạt động nguy hiểm"
        
        return {
            "account": public_key,
            "status": status,
            "risk_score": risk_score,
            "anomaly_count": len(anomalies),
            "anomalies": anomalies,
            "message": message,
            "analysis_period_days": days_back,
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(500, f"Anomaly check failed: {str(e)}")

@router.get("/monitor/{public_key}")
async def monitor_account(
    public_key: str,
    hours_back: int = Query(default=24, ge=1, le=168)  # Max 1 week
):
    """
    Monitor real-time cho anomalies
    """
    try:
        if not public_key.startswith('G') or len(public_key) != 56:
            raise HTTPException(400, "Invalid Stellar public key format")
        
        # Get recent transactions (convert hours to days)
        days_back = max(1, hours_back // 24)
        
        transactions = await stellar_collector.collect_full_history(
            account=public_key,
            days_back=days_back,
            max_records=500
        )
        
        # Filter to exact hours requested
        cutoff_time = datetime.now() - timedelta(hours=hours_back)
        recent_transactions = [
            tx for tx in transactions 
            if tx.timestamp >= cutoff_time
        ]
        
        alerts = []
        
        if recent_transactions:
            # Quick anomaly detection for recent activity
            balances = await stellar_collector.get_account_balances(public_key)
            features = feature_service.calculate_features(
                transactions=recent_transactions,
                balances=balances,
                period_days=1  # Short period for real-time analysis
            )
            
            anomalies = anomaly_service.detect_anomalies(
                transactions=recent_transactions,
                features=features
            )
            
            # Convert anomalies to alerts
            for anomaly in anomalies:
                if anomaly.confidence_score > 0.6:  # Only high confidence
                    alerts.append({
                        "type": anomaly.anomaly_type,
                        "message": anomaly.description,
                        "confidence": anomaly.confidence_score,
                        "timestamp": anomaly.timestamp.isoformat(),
                        "action": anomaly.recommended_action
                    })
        
        # Determine monitoring status
        if not recent_transactions:
            status = "quiet"
        elif len(alerts) == 0:
            status = "normal"
        elif len(alerts) <= 2:
            status = "watching"
        else:
            status = "alerting"
        
        return {
            "account": public_key,
            "status": status,
            "monitoring_period_hours": hours_back,
            "new_transactions": len(recent_transactions),
            "alerts": alerts,
            "last_check": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(500, f"Monitoring failed: {str(e)}")

@router.get("/types")
async def get_anomaly_types():
    """
    Lấy danh sách các loại anomaly được hỗ trợ
    """
    
    anomaly_types = {
        "unusual_amount": {
            "name": "Số tiền bất thường",
            "description": "Giao dịch có số tiền khác biệt đáng kể so với thói quen",
            "severity": "medium",
            "detection_method": "statistical_outlier"
        },
        "high_frequency": {
            "name": "Tần suất cao",
            "description": "Quá nhiều giao dịch trong một khoảng thời gian ngắn",
            "severity": "medium",
            "detection_method": "frequency_analysis"
        },
        "unusual_time": {
            "name": "Thời gian bất thường",
            "description": "Giao dịch vào giờ không bình thường (2-5 AM)",
            "severity": "high",
            "detection_method": "temporal_analysis"
        },
        "rapid_transactions": {
            "name": "Giao dịch liên tiếp",
            "description": "Nhiều giao dịch trong thời gian rất ngắn (<1 phút)",
            "severity": "high",
            "detection_method": "timing_analysis"
        },
        "ml_detected": {
            "name": "AI phát hiện",
            "description": "Pattern bất thường được phát hiện bởi machine learning",
            "severity": "medium",
            "detection_method": "isolation_forest"
        },
        "round_number_bias": {
            "name": "Pattern số tròn",
            "description": "Quá nhiều giao dịch với số tiền tròn (có thể là bot)",
            "severity": "low",
            "detection_method": "pattern_analysis"
        },
        "weekend_activity": {
            "name": "Hoạt động cuối tuần",
            "description": "Hoạt động giao dịch cao bất thường vào cuối tuần",
            "severity": "low",
            "detection_method": "temporal_analysis"
        }
    }
    
    return {
        "anomaly_types": anomaly_types,
        "total_types": len(anomaly_types),
        "severity_levels": ["low", "medium", "high"],
        "detection_methods": [
            "statistical_outlier",
            "frequency_analysis", 
            "temporal_analysis",
            "timing_analysis",
            "isolation_forest",
            "pattern_analysis"
        ]
    }

@router.get("/history/{public_key}")
async def get_anomaly_history(
    public_key: str,
    days_back: int = Query(default=30, ge=1, le=90),
    anomaly_type: Optional[str] = Query(default=None),
    min_confidence: float = Query(default=0.5, ge=0.0, le=1.0)
):
    """
    Lấy lịch sử các anomalies đã phát hiện
    """
    try:
        if not public_key.startswith('G') or len(public_key) != 56:
            raise HTTPException(400, "Invalid Stellar public key format")
        
        transactions = await stellar_collector.collect_full_history(
            account=public_key,
            days_back=days_back,
            max_records=2000
        )
        
        if not transactions:
            return {
                "account": public_key,
                "period": f"{days_back} days",
                "anomalies": [],
                "summary": {"total": 0, "by_type": {}, "by_day": {}}
            }
        
        balances = await stellar_collector.get_account_balances(public_key)
        
        features = feature_service.calculate_features(
            transactions=transactions,
            balances=balances,
            period_days=days_back
        )
        
        anomalies = anomaly_service.detect_anomalies(
            transactions=transactions,
            features=features
        )
        
        # Filter anomalies
        filtered_anomalies = []
        for anomaly in anomalies:
            if anomaly.confidence_score >= min_confidence:
                if not anomaly_type or anomaly.anomaly_type == anomaly_type:
                    filtered_anomalies.append(anomaly)
        
        # Create summary
        summary = _create_anomaly_summary(filtered_anomalies)
        
        return {
            "account": public_key,
            "period": f"{days_back} days",
            "filters": {
                "anomaly_type": anomaly_type,
                "min_confidence": min_confidence
            },
            "anomalies": filtered_anomalies,
            "summary": summary
        }
        
    except Exception as e:
        raise HTTPException(500, f"History retrieval failed: {str(e)}")

def _create_anomaly_summary(anomalies: List[AnomalyDetection]) -> Dict[str, Any]:
    """Create summary statistics for anomalies"""
    from collections import Counter
    
    if not anomalies:
        return {"total": 0, "by_type": {}, "by_day": {}}
    
    # Count by type
    by_type = Counter(anomaly.anomaly_type for anomaly in anomalies)
    
    # Count by day
    by_day = Counter(
        anomaly.timestamp.date().isoformat() 
        for anomaly in anomalies
    )
    
    # Average confidence
    avg_confidence = sum(a.confidence_score for a in anomalies) / len(anomalies)
    
    return {
        "total": len(anomalies),
        "by_type": dict(by_type),
        "by_day": dict(by_day),
        "average_confidence": round(avg_confidence, 3),
        "highest_confidence": max(a.confidence_score for a in anomalies),
        "latest_anomaly": max(anomalies, key=lambda x: x.timestamp).timestamp.isoformat()
    }
