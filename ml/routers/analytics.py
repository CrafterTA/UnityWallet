"""
Analytics API Router
Endpoints để phân tích và feature engineering
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import asyncio
from datetime import datetime

from models.schemas import (
    AnalyticsRequest, AnalyticsResponse, FeatureEngineering, 
    TimeSeriesData
)
from services.solana_data_collector import solana_collector
from services.feature_engineering import feature_service
from services.anomaly_detection import anomaly_service

router = APIRouter()

@router.get("/wallet/{public_key}")
async def analyze_wallet(
    public_key: str,
    days_back: int = Query(default=90, ge=1, le=365),
    include_balance_history: bool = Query(default=True)
):
    """
    Phân tích toàn diện wallet với feature engineering và anomaly detection
    """
    try:
        # Validate public key format (Solana addresses are base58, ~44 chars)
        if len(public_key) < 32 or len(public_key) > 48:
            raise HTTPException(400, "Invalid Solana public key format")
        
        # Collect transaction history
        transactions = await solana_collector.collect_full_history(
            account=public_key,
            days_back=days_back,
            max_records=5000
        )
        
        if not transactions:
            raise HTTPException(404, "No transaction history found for this account")
        
        # Get current balances
        balances = await solana_collector.get_account_balances(public_key)
        
        # Calculate features
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
        
        # Prepare balance history time series
        balance_history = {}
        if include_balance_history:
            balance_history = _prepare_balance_timeseries(transactions, balances)
        
        # Transaction summary
        transaction_summary = _prepare_transaction_summary(transactions, features)
        
        return AnalyticsResponse(
            account=public_key,
            features=features,
            anomalies=anomalies,
            balance_history=balance_history,
            transaction_summary=transaction_summary
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {str(e)}")

@router.get("/features/{public_key}")
async def get_wallet_features(
    public_key: str,
    days_back: int = Query(default=90, ge=1, le=365)
):
    """
    Chỉ lấy features engineering (nhanh hơn)
    """
    try:
        if len(public_key) < 32 or len(public_key) > 48:
            raise HTTPException(400, "Invalid Solana public key format")
        
        transactions = await solana_collector.collect_full_history(
            account=public_key,
            days_back=days_back,
            max_records=2000
        )
        
        balances = await solana_collector.get_account_balances(public_key)
        
        features = feature_service.calculate_features(
            transactions=transactions,
            balances=balances,
            period_days=days_back
        )
        
        return features
        
    except Exception as e:
        raise HTTPException(500, f"Feature calculation failed: {str(e)}")

@router.get("/anomalies/{public_key}")
async def detect_wallet_anomalies(
    public_key: str,
    days_back: int = Query(default=30, ge=1, le=90)
):
    """
    Chỉ phát hiện anomalies
    """
    try:
        if len(public_key) < 32 or len(public_key) > 48:
            raise HTTPException(400, "Invalid Solana public key format")
        
        transactions = await solana_collector.collect_full_history(
            account=public_key,
            days_back=days_back,
            max_records=1000
        )
        
        balances = await solana_collector.get_account_balances(public_key)
        
        features = feature_service.calculate_features(
            transactions=transactions,
            balances=balances,
            period_days=days_back
        )
        
        anomalies = anomaly_service.detect_anomalies(
            transactions=transactions,
            features=features
        )
        
        risk_score = anomaly_service.get_risk_score(anomalies)
        
        return {
            "account": public_key,
            "risk_score": risk_score,
            "anomaly_count": len(anomalies),
            "anomalies": anomalies
        }
        
    except Exception as e:
        raise HTTPException(500, f"Anomaly detection failed: {str(e)}")

@router.get("/balance-history/{public_key}")
async def get_balance_history(
    public_key: str,
    days_back: int = Query(default=30, ge=1, le=90),
    asset: Optional[str] = Query(default=None)
):
    """
    Lấy lịch sử biến động số dư
    """
    try:
        if len(public_key) < 32 or len(public_key) > 48:
            raise HTTPException(400, "Invalid Solana public key format")
        
        transactions = await solana_collector.collect_full_history(
            account=public_key,
            days_back=days_back
        )
        
        balances = await solana_collector.get_account_balances(public_key)
        
        balance_history = _prepare_balance_timeseries(transactions, balances, asset)
        
        return balance_history
        
    except Exception as e:
        raise HTTPException(500, f"Balance history failed: {str(e)}")

@router.get("/summary/{public_key}")
async def get_wallet_summary(
    public_key: str,
    days_back: int = Query(default=30, ge=1, le=365)
):
    """
    Tóm tắt nhanh về wallet
    """
    try:
        if len(public_key) < 32 or len(public_key) > 48:
            raise HTTPException(400, "Invalid Solana public key format")
        
        # Collect basic data
        transactions = await solana_collector.collect_full_history(
            account=public_key,
            days_back=days_back,
            max_records=1000
        )
        
        balances = await solana_collector.get_account_balances(public_key)
        
        # Quick calculations
        total_txs = len(transactions)
        payment_txs = len([tx for tx in transactions if tx.transaction_type.value == 'payment'])
        swap_txs = len([tx for tx in transactions if tx.transaction_type.value == 'swap'])
        
        outgoing_txs = [tx for tx in transactions if tx.source == public_key and tx.amount]
        incoming_txs = [tx for tx in transactions if tx.destination == public_key and tx.amount]
        
        total_sent = sum(tx.amount for tx in outgoing_txs)
        total_received = sum(tx.amount for tx in incoming_txs)
        
        current_balance = {str(bal.asset): bal.balance for bal in balances}
        
        return {
            "account": public_key,
            "period_days": days_back,
            "transaction_counts": {
                "total": total_txs,
                "payments": payment_txs,
                "swaps": swap_txs,
                "other": total_txs - payment_txs - swap_txs
            },
            "amounts": {
                "total_sent": total_sent,
                "total_received": total_received,
                "net_flow": total_received - total_sent
            },
            "current_balances": current_balance,
            "activity_level": _calculate_activity_level(total_txs, days_back)
        }
        
    except Exception as e:
        raise HTTPException(500, f"Summary failed: {str(e)}")

def _prepare_balance_timeseries(transactions, balances, target_asset=None):
    """Chuẩn bị dữ liệu time series cho balance history"""
    try:
        balance_history = {}
        
        # Simplified approach - in reality would need more complex balance tracking
        for balance in balances:
            try:
                asset_key = str(balance.asset) if hasattr(balance, 'asset') else 'XLM'
                if target_asset and asset_key != target_asset:
                    continue
                    
                # For now, just show current balance point
                balance_history[asset_key] = {
                    "timestamps": [balance.timestamp.isoformat() if hasattr(balance, 'timestamp') else datetime.now().isoformat()],
                    "values": [float(balance.balance) if hasattr(balance, 'balance') else 0.0],
                    "label": f"Balance {asset_key}"
                }
            except Exception as e:
                print(f"Error processing balance: {e}")
                continue
        
        return balance_history
    except Exception as e:
        print(f"Error in _prepare_balance_timeseries: {e}")
        return {}

def _prepare_transaction_summary(transactions, features):
    """Chuẩn bị tóm tắt giao dịch"""
    try:
        from collections import Counter
        
        # Asset distribution
        assets = []
        for tx in transactions:
            if hasattr(tx, 'asset') and tx.asset:
                assets.append(str(tx.asset))
            else:
                assets.append('XLM')
        asset_counts = dict(Counter(assets))
        
        # Time distribution
        hours = []
        for tx in transactions:
            if hasattr(tx, 'timestamp') and tx.timestamp:
                hours.append(tx.timestamp.hour)
        hour_counts = dict(Counter(hours))
        
        # Transaction types
        types = []
        for tx in transactions:
            if hasattr(tx, 'transaction_type') and tx.transaction_type:
                types.append(tx.transaction_type.value if hasattr(tx.transaction_type, 'value') else str(tx.transaction_type))
        type_counts = dict(Counter(types))
        
        peak_hours = getattr(features, 'peak_transaction_hours', []) if features else []
        frequent_destinations = getattr(features, 'frequent_destinations', []) if features else []
        
        return {
            "asset_distribution": asset_counts,
            "hourly_distribution": hour_counts,
            "type_distribution": type_counts,
            "peak_activity_hours": peak_hours,
            "most_frequent_destinations": frequent_destinations[:5]
        }
    except Exception as e:
        print(f"Error in _prepare_transaction_summary: {e}")
        return {
            "asset_distribution": {},
            "hourly_distribution": {},
            "type_distribution": {},
            "peak_activity_hours": [],
            "most_frequent_destinations": []
        }

def _calculate_activity_level(tx_count, days):
    """Tính mức độ hoạt động"""
    daily_avg = tx_count / days if days > 0 else 0
    
    if daily_avg >= 10:
        return "very_high"
    elif daily_avg >= 5:
        return "high"
    elif daily_avg >= 1:
        return "medium"
    elif daily_avg >= 0.1:
        return "low"
    else:
        return "very_low"
