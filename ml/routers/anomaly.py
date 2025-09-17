"""
Anomaly Detection API Router
Endpoints cho phát hiện và cảnh báo bất thường
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from ml.models.schemas import AnomalyDetection
from ml.services.data_collector import stellar_collector
from ml.services.feature_engineering import feature_service
from ml.services.anomaly_detection import anomaly_service

router = APIRouter()

@router.get("/check/{public_key}")
async def check_anomalies(
    public_key: str,
    days_back: int = Query(default=7, ge=1, le=30),
    threshold: Optional[float] = Query(default=None, ge=0.0, le=1.0)
):
    """
    Kiểm tra anomalies trong giao dịch gần đây
    """
    try:
        if not public_key.startswith('G') or len(public_key) != 56:
            raise HTTPException(400, "Invalid Stellar public key format")
        
        # Collect recent transactions
        transactions = await stellar_collector.collect_full_history(
            account=public_key,
            days_back=days_back,
            max_records=1000
        )
        
        if not transactions:
            return {
                "account": public_key,
                "status": "no_data",
                "message": "Không có giao dịch trong khoảng thời gian này",
                "anomalies": [],
                "risk_score": 0.0
            }
        
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
        
        # Filter by threshold if provided
        if threshold is not None:
            anomalies = [a for a in anomalies if a.confidence_score >= threshold]
        
        risk_score = anomaly_service.get_risk_score(anomalies)
        
        # Determine status
        if risk_score >= 0.8:
            status = "high_risk"
            message = "⚠️ Phát hiện hoạt động có rủi ro cao"
        elif risk_score >= 0.5:
            status = "medium_risk"
            message = "⚡ Phát hiện hoạt động cần chú ý"
        elif len(anomalies) > 0:
            status = "low_risk"
            message = "💡 Có một số hoạt động khác thường"
        else:
            status = "safe"
            message = "✅ Không phát hiện hoạt động bất thường"
        
        return {
            "account": public_key,
            "status": status,
            "message": message,
            "risk_score": risk_score,
            "anomaly_count": len(anomalies),
            "anomalies": anomalies,
            "checked_at": datetime.now(),
            "period_checked": f"{days_back} days"
        }
        
    except Exception as e:
        raise HTTPException(500, f"Anomaly check failed: {str(e)}")

@router.get("/monitor/{public_key}")
async def monitor_continuous(
    public_key: str,
    hours_back: int = Query(default=24, ge=1, le=168)  # Max 1 week
):
    """
    Monitor liên tục để phát hiện anomalies trong thời gian thực
    """
    try:
        if not public_key.startswith('G') or len(public_key) != 56:
            raise HTTPException(400, "Invalid Stellar public key format")
        
        # Get recent transactions (more frequent check)
        days_back = max(1, hours_back // 24)
        transactions = await stellar_collector.collect_full_history(
            account=public_key,
            days_back=days_back,
            max_records=500
        )
        
        # Filter to exact hour range
        cutoff_time = datetime.now() - timedelta(hours=hours_back)
        recent_transactions = [
            tx for tx in transactions 
            if tx.timestamp >= cutoff_time
        ]
        
        if not recent_transactions:
            return {
                "account": public_key,
                "monitoring_period": f"{hours_back} hours",
                "new_transactions": 0,
                "alerts": [],
                "status": "no_activity"
            }
        
        balances = await stellar_collector.get_account_balances(public_key)
        
        # Quick feature calculation for recent period
        features = feature_service.calculate_features(
            transactions=transactions,  # Use all for context
            balances=balances,
            period_days=days_back
        )
        
        # Focus on recent anomalies
        all_anomalies = anomaly_service.detect_anomalies(
            transactions=transactions,
            features=features
        )
        
        # Filter to recent anomalies only
        recent_anomalies = [
            anomaly for anomaly in all_anomalies
            if anomaly.timestamp >= cutoff_time
        ]
        
        # Create alerts for high-confidence anomalies
        alerts = []
        for anomaly in recent_anomalies:
            if anomaly.confidence_score >= 0.7:  # High confidence threshold
                alerts.append({
                    "type": "anomaly_detected",
                    "severity": _get_severity(anomaly.confidence_score),
                    "description": anomaly.description,
                    "detected_at": anomaly.timestamp,
                    "confidence": anomaly.confidence_score,
                    "action": anomaly.recommended_action
                })
        
        return {
            "account": public_key,
            "monitoring_period": f"{hours_back} hours",
            "new_transactions": len(recent_transactions),
            "recent_anomalies": len(recent_anomalies),
            "alerts": alerts,
            "status": "active" if recent_transactions else "no_activity",
            "last_checked": datetime.now()
        }
        
    except Exception as e:
        raise HTTPException(500, f"Monitoring failed: {str(e)}")

@router.get("/types")
async def get_anomaly_types():
    """
    Lấy danh sách các loại anomalies và mô tả
    """
    return {
        "anomaly_types": {
            "unusual_amount": {
                "name": "Số tiền bất thường",
                "description": "Giao dịch có số tiền khác biệt đáng kể so với pattern thường",
                "severity": "medium"
            },
            "high_frequency": {
                "name": "Tần suất cao",
                "description": "Số lượng giao dịch trong ngày cao hơn bình thường",
                "severity": "medium"
            },
            "unusual_time": {
                "name": "Thời gian bất thường",
                "description": "Giao dịch vào giờ không thường xuyên (như 2-5 AM)",
                "severity": "high"
            },
            "rapid_transactions": {
                "name": "Giao dịch liên tiếp",
                "description": "Nhiều giao dịch trong khoảng thời gian rất ngắn",
                "severity": "high"
            },
            "ml_detected": {
                "name": "Phát hiện bởi AI",
                "description": "Pattern bất thường được AI phát hiện",
                "severity": "medium"
            },
            "round_number_bias": {
                "name": "Pattern số tròn",
                "description": "Xu hướng giao dịch số tròn có thể là automated",
                "severity": "low"
            },
            "weekend_activity": {
                "name": "Hoạt động cuối tuần",
                "description": "Hoạt động cao bất thường vào cuối tuần",
                "severity": "low"
            }
        }
    }

@router.post("/configure-alerts/{public_key}")
async def configure_alerts(
    public_key: str,
    config: Dict[str, Any]
):
    """
    Cấu hình cảnh báo cho wallet
    """
    try:
        if not public_key.startswith('G') or len(public_key) != 56:
            raise HTTPException(400, "Invalid Stellar public key format")
        
        # Validate configuration
        valid_fields = {
            "enabled": bool,
            "threshold": float,
            "anomaly_types": list,
            "notification_methods": list,
            "check_frequency_hours": int
        }
        
        for field, expected_type in valid_fields.items():
            if field in config and not isinstance(config[field], expected_type):
                raise HTTPException(400, f"Field {field} must be of type {expected_type.__name__}")
        
        # Store configuration (in a real app, this would go to database)
        alert_config = {
            "public_key": public_key,
            "enabled": config.get("enabled", True),
            "threshold": max(0.1, min(1.0, config.get("threshold", 0.5))),
            "anomaly_types": config.get("anomaly_types", ["unusual_amount", "unusual_time", "rapid_transactions"]),
            "notification_methods": config.get("notification_methods", ["in_app"]),
            "check_frequency_hours": max(1, min(24, config.get("check_frequency_hours", 6))),
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # TODO: Save to database
        
        return {
            "status": "success",
            "message": "Cấu hình cảnh báo đã được lưu",
            "config": alert_config
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Configuration failed: {str(e)}")

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

def _get_severity(confidence_score: float) -> str:
    """Determine severity based on confidence score"""
    if confidence_score >= 0.9:
        return "critical"
    elif confidence_score >= 0.7:
        return "high"
    elif confidence_score >= 0.5:
        return "medium"
    else:
        return "low"

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
