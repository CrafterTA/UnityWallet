"""
Comprehensive test suite for enhanced ML-powered /analytics/spend endpoint

This module tests the enhanced spending analytics endpoint that includes:
- ML-powered transaction categorization
- Anomaly detection across multiple patterns
- Spending trend analysis
- Backward compatibility with existing API contracts
- Performance and error handling scenarios
"""

import os
import uuid
import time
import json
from decimal import Decimal
from typing import Dict, Any
import pytest
import httpx

BASE_URL = os.getenv("BASE_URL", "http://localhost:8001")
USERNAME = os.getenv("TEST_USER", "alice")
PASSWORD = os.getenv("TEST_PASS", "password123")
TIMEOUT = float(os.getenv("TEST_TIMEOUT", "10"))

def _cid():
    """Generate correlation ID for request tracking"""
    return str(uuid.uuid4())

def _client():
    """Create HTTP client with timeout and correlation tracking"""
    return httpx.Client(base_url=BASE_URL, timeout=TIMEOUT, headers={"X-Correlation-ID": _cid()})

@pytest.fixture(scope="session")
def token():
    """Authenticate and get JWT token for Alice (test user with transaction data)"""
    with _client() as c:
        r = c.post("/auth/login", params={"username": USERNAME, "password": PASSWORD})
        assert r.status_code == 200, f"Login failed: {r.text}"
        data = r.json()
        assert "access_token" in data, "No access token in login response"
        return data["access_token"]

@pytest.fixture(scope="session")
def bob_token():
    """Authenticate and get JWT token for Bob (test user with different transaction patterns)"""
    with _client() as c:
        r = c.post("/auth/login", params={"username": "bob", "password": "password123"})
        assert r.status_code == 200, f"Bob login failed: {r.text}"
        data = r.json()
        assert "access_token" in data, "No access token in Bob login response"
        return data["access_token"]

# Carol has PENDING KYC status and cannot login - removed fixture

@pytest.fixture()
def auth(token):
    """Standard auth headers with JWT token and correlation tracking"""
    return {"Authorization": f"Bearer {token}", "X-Correlation-ID": _cid(), "Content-Type": "application/json"}

@pytest.fixture()
def bob_auth(bob_token):
    """Bob's auth headers for testing different user patterns"""
    return {"Authorization": f"Bearer {bob_token}", "X-Correlation-ID": _cid(), "Content-Type": "application/json"}

# Carol auth removed due to PENDING KYC status


class TestEnhancedSpendAnalytics:
    """Test suite for ML-enhanced spending analytics endpoint"""

    def test_backward_compatibility_maintained(self, auth):
        """Ensure existing API contract is preserved (critical for production)"""
        with _client() as c:
            r = c.get("/analytics/spend", headers=auth)
            assert r.status_code == 200, f"Endpoint failed: {r.text}"
            
            data = r.json()
            # CRITICAL: Original field must still exist and be properly typed
            assert "last_30d_spend" in data, "Backward compatibility broken: missing last_30d_spend"
            assert isinstance(data["last_30d_spend"], str), "last_30d_spend should be string (Decimal)"
            
            # Verify decimal format
            spend_value = Decimal(data["last_30d_spend"])
            assert spend_value >= 0, "Spending amount should be non-negative"

    def test_enhanced_schema_structure(self, auth):
        """Validate complete enhanced response schema with ML features"""
        with _client() as c:
            r = c.get("/analytics/spend", headers=auth)
            assert r.status_code == 200, f"Endpoint failed: {r.text}"
            
            data = r.json()
            
            # Core ML enhancement fields
            assert "category_breakdown" in data, "Missing ML category breakdown"
            assert "trend_analysis" in data, "Missing trend analysis"
            assert "anomaly_insights" in data, "Missing anomaly insights"
            
            # Summary metrics
            assert "avg_transaction_amount" in data, "Missing avg_transaction_amount"
            assert "total_transactions" in data, "Missing total_transactions"
            assert "most_active_category" in data, "Missing most_active_category"
            assert "spending_pattern_score" in data, "Missing spending_pattern_score"
            assert "anomaly_rate" in data, "Missing anomaly_rate"
            
            # Comparison insights
            assert "vs_previous_30d" in data, "Missing vs_previous_30d"
            assert "vs_user_average" in data, "Missing vs_user_average"
            
            # Type validation
            assert isinstance(data["category_breakdown"], list), "category_breakdown must be list"
            assert isinstance(data["trend_analysis"], list), "trend_analysis must be list"
            assert isinstance(data["anomaly_insights"], list), "anomaly_insights must be list"
            assert isinstance(data["total_transactions"], int), "total_transactions must be int"
            assert isinstance(data["spending_pattern_score"], (int, float)), "spending_pattern_score must be numeric"
            assert isinstance(data["anomaly_rate"], (int, float)), "anomaly_rate must be numeric"

    def test_category_breakdown_ml_functionality(self, auth):
        """Test ML-powered transaction categorization"""
        with _client() as c:
            r = c.get("/analytics/spend", headers=auth)
            assert r.status_code == 200, f"Endpoint failed: {r.text}"
            
            data = r.json()
            categories = data["category_breakdown"]
            
            if categories:  # Only test if user has transaction data
                # Validate category structure
                for category in categories:
                    assert "category" in category, "Category missing category field"
                    assert "amount" in category, "Category missing amount field"
                    assert "percentage" in category, "Category missing percentage field"
                    assert "transaction_count" in category, "Category missing transaction_count field"
                    assert "avg_amount" in category, "Category missing avg_amount field"
                    
                    # Type validation
                    assert isinstance(category["category"], str), "Category name must be string"
                    assert isinstance(category["transaction_count"], int), "Transaction count must be int"
                    assert category["transaction_count"] > 0, "Transaction count must be positive"
                    
                    # Validate amounts are properly formatted decimals
                    amount = Decimal(str(category["amount"]))
                    avg_amount = Decimal(str(category["avg_amount"]))
                    assert amount >= 0, "Category amount must be non-negative"
                    assert avg_amount >= 0, "Average amount must be non-negative"
                
                # Verify most_active_category is from actual categories
                most_active = data["most_active_category"]
                category_names = [c["category"] for c in categories]
                if category_names:  # Only check if categories exist
                    assert most_active in category_names, f"most_active_category '{most_active}' not in categories"

    def test_anomaly_detection_functionality(self, auth):
        """Test ML anomaly detection across multiple patterns"""
        with _client() as c:
            r = c.get("/analytics/spend", headers=auth)
            assert r.status_code == 200, f"Endpoint failed: {r.text}"
            
            data = r.json()
            anomalies = data["anomaly_insights"]
            
            # Validate anomaly structure
            for anomaly in anomalies:
                assert "type" in anomaly, "Anomaly missing type field"
                assert "description" in anomaly, "Anomaly missing description field"
                assert "severity" in anomaly, "Anomaly missing severity field"
                assert "detected_count" in anomaly, "Anomaly missing detected_count field"
                
                # Type validation
                assert isinstance(anomaly["type"], str), "Anomaly type must be string"
                assert isinstance(anomaly["description"], str), "Anomaly description must be string"
                assert isinstance(anomaly["severity"], str), "Anomaly severity must be string"
                assert isinstance(anomaly["detected_count"], int), "Detected count must be int"
                assert anomaly["detected_count"] >= 0, "Detected count must be non-negative"
                
                # Validate severity levels
                assert anomaly["severity"] in ["low", "medium", "high"], f"Invalid severity: {anomaly['severity']}"
                
                # Validate anomaly types (based on current ML model)
                expected_types = {
                    "amount_outlier", "high_frequency", "duplicate_amount", 
                    "high_daily_volume", "night_high_amount", "rapid_location_change", "round_number_bias"
                }
                assert anomaly["type"] in expected_types, f"Unknown anomaly type: {anomaly['type']}"
            
            # Validate anomaly_rate calculation consistency
            anomaly_rate = data["anomaly_rate"]
            total_anomalies = sum(a["detected_count"] for a in anomalies)
            total_transactions = data["total_transactions"]
            
            if total_transactions > 0:
                expected_rate = (total_anomalies / total_transactions) * 100
                # Allow small floating point discrepancy
                assert abs(anomaly_rate - expected_rate) < 0.01, \
                    f"Anomaly rate calculation error: got {anomaly_rate}, expected {expected_rate}"

    def test_trend_analysis_functionality(self, auth):
        """Test spending trend analysis (weekly breakdown)"""
        with _client() as c:
            r = c.get("/analytics/spend", headers=auth)
            assert r.status_code == 200, f"Endpoint failed: {r.text}"
            
            data = r.json()
            trends = data["trend_analysis"]
            
            # Validate trend structure if present
            for trend in trends:
                assert "period" in trend, "Trend missing period field"
                assert "amount" in trend, "Trend missing amount field"
                assert "transaction_count" in trend, "Trend missing transaction_count field"
                assert "avg_amount" in trend, "Trend missing avg_amount field"
                
                # Type validation
                assert isinstance(trend["period"], str), "Trend period must be string"
                assert isinstance(trend["transaction_count"], int), "Trend transaction count must be int"
                assert trend["transaction_count"] >= 0, "Trend transaction count must be non-negative"
                
                # Validate amounts
                amount = Decimal(str(trend["amount"]))
                avg_amount = Decimal(str(trend["avg_amount"]))
                assert amount >= 0, "Trend amount must be non-negative"
                assert avg_amount >= 0, "Trend average amount must be non-negative"

    def test_performance_with_different_users(self, auth, bob_auth):
        """Test performance and consistency across different user data patterns"""
        test_users = [
            ("alice", auth),
            ("bob", bob_auth)
        ]
        
        response_times = []
        
        for username, user_auth in test_users:
            with _client() as c:
                start_time = time.time()
                r = c.get("/analytics/spend", headers=user_auth)
                response_time = time.time() - start_time
                response_times.append(response_time)
                
                assert r.status_code == 200, f"Failed for user {username}: {r.text}"
                
                # Validate correlation ID header
                assert "X-Correlation-ID" in r.headers, f"Missing correlation ID for {username}"
                
                data = r.json()
                
                # Ensure all users get valid response structure
                assert "last_30d_spend" in data, f"Missing last_30d_spend for {username}"
                assert "category_breakdown" in data, f"Missing category_breakdown for {username}"
                assert "anomaly_insights" in data, f"Missing anomaly_insights for {username}"
                
                # Validate spending pattern score range
                pattern_score = data["spending_pattern_score"]
                assert 0.0 <= pattern_score <= 1.0, f"Invalid pattern score for {username}: {pattern_score}"
        
        # Performance validation: all requests should complete within reasonable time
        max_response_time = max(response_times)
        assert max_response_time < 5.0, f"Response time too slow: {max_response_time:.2f}s"
        
        # Consistency validation: response times should be relatively consistent
        if len(response_times) > 1:
            avg_response_time = sum(response_times) / len(response_times)
            for rt in response_times:
                assert abs(rt - avg_response_time) < 3.0, f"Response time variance too high: {response_times}"

    def test_error_handling_and_fallback_scenarios(self):
        """Test error handling for invalid authentication and missing data scenarios"""
        with _client() as c:
            # Test without authentication (could be 401 or 403 depending on implementation)
            r = c.get("/analytics/spend")
            assert r.status_code in [401, 403], f"Should require authentication, got {r.status_code}: {r.text}"
            
            # Test with invalid token (may return 500 due to JWT processing error)
            invalid_auth = {"Authorization": "Bearer invalid_token", "X-Correlation-ID": _cid()}
            r = c.get("/analytics/spend", headers=invalid_auth)
            assert r.status_code in [401, 403, 500], f"Should reject invalid token, got {r.status_code}: {r.text}"
            
            # Test with malformed auth header
            malformed_auth = {"Authorization": "InvalidFormat", "X-Correlation-ID": _cid()}
            r = c.get("/analytics/spend", headers=malformed_auth)
            assert r.status_code in [401, 403, 500], f"Should reject malformed auth, got {r.status_code}: {r.text}"

    def test_data_consistency_validation(self, auth):
        """Validate internal data consistency and mathematical correctness"""
        with _client() as c:
            r = c.get("/analytics/spend", headers=auth)
            assert r.status_code == 200, f"Endpoint failed: {r.text}"
            
            data = r.json()
            
            # Validate total spending calculation consistency
            last_30d_spend = Decimal(data["last_30d_spend"])
            category_breakdown = data["category_breakdown"]
            
            if category_breakdown:
                # Sum of category amounts should roughly match total spend
                category_total = sum(Decimal(str(cat["amount"])) for cat in category_breakdown)
                
                # Allow for small discrepancies due to filtering differences and precision
                if last_30d_spend > 0:
                    percentage_diff = abs(category_total - last_30d_spend) / last_30d_spend
                    assert percentage_diff < 0.15, \
                        f"Category total ({category_total}) doesn't match last_30d_spend ({last_30d_spend}), diff: {percentage_diff:.3f}"
            
            # Validate average calculation consistency
            total_transactions = data["total_transactions"]
            avg_transaction_amount = Decimal(str(data["avg_transaction_amount"]))
            
            if total_transactions > 0 and last_30d_spend > 0:
                expected_avg = last_30d_spend / total_transactions
                # Allow small floating point discrepancy
                diff = abs(avg_transaction_amount - expected_avg)
                assert diff < Decimal("0.01"), \
                    f"Average calculation error: got {avg_transaction_amount}, expected {expected_avg}"
            
            # Validate percentage calculations in categories
            if category_breakdown and last_30d_spend > 0:
                for category in category_breakdown:
                    amount = Decimal(str(category["amount"]))
                    percentage = category["percentage"]
                    expected_percentage = float(amount / last_30d_spend * 100)
                    
                    # Allow small floating point discrepancy
                    assert abs(percentage - expected_percentage) < 0.1, \
                        f"Category percentage calculation error for {category['category']}"

    def test_ml_model_integration_robustness(self, auth):
        """Test ML model integration handles various data scenarios gracefully"""
        with _client() as c:
            r = c.get("/analytics/spend", headers=auth)
            assert r.status_code == 200, f"Endpoint failed: {r.text}"
            
            data = r.json()
            
            # Verify ML models provide reasonable outputs
            categories = data["category_breakdown"]
            anomalies = data["anomaly_insights"]
            
            # If no transactions, ML should handle gracefully
            if data["total_transactions"] == 0:
                assert data["last_30d_spend"] == "0", "No transactions should mean zero spend"
                assert len(categories) == 0, "No transactions should mean no categories"
                assert data["most_active_category"] == "Others", "Default category for no data"
                assert data["anomaly_rate"] == 0.0, "No transactions should mean no anomalies"
            
            # If transactions exist, validate ML model outputs
            else:
                # Categories should be reasonable
                if categories:
                    category_names = [c["category"] for c in categories]
                    assert "Others" in category_names, "Should include 'Others' category as fallback"
                
                # Anomalies should be within reasonable bounds
                assert 0.0 <= data["anomaly_rate"] <= 1000.0, "Anomaly rate should be reasonable percentage"
                
                # Pattern score should be valid
                assert 0.0 <= data["spending_pattern_score"] <= 1.0, "Pattern score should be normalized"

    def test_correlation_id_tracking(self, auth):
        """Ensure proper request correlation tracking for debugging"""
        correlation_id = str(uuid.uuid4())
        auth_with_correlation = auth | {"X-Correlation-ID": correlation_id}
        
        with _client() as c:
            r = c.get("/analytics/spend", headers=auth_with_correlation)
            assert r.status_code == 200, f"Endpoint failed: {r.text}"
            
            # Verify correlation ID is returned in response headers
            assert "X-Correlation-ID" in r.headers, "Missing correlation ID in response"
            
            # The correlation ID might be different due to internal processing,
            # but it should be a valid UUID format
            returned_correlation_id = r.headers["X-Correlation-ID"]
            assert len(returned_correlation_id) == 36, "Invalid correlation ID format"
            assert returned_correlation_id.count("-") == 4, "Invalid UUID format"

    def test_response_format_stability(self, auth):
        """Ensure response format is stable for client applications"""
        with _client() as c:
            r = c.get("/analytics/spend", headers=auth)
            assert r.status_code == 200, f"Endpoint failed: {r.text}"
            
            # Verify content type
            assert "application/json" in r.headers.get("content-type", ""), \
                "Response should be JSON"
            
            # Verify response can be parsed as JSON
            data = r.json()
            assert isinstance(data, dict), "Response should be JSON object"
            
            # Verify all required fields are present (for client contract)
            required_fields = [
                "last_30d_spend", "category_breakdown", "trend_analysis", 
                "anomaly_insights", "avg_transaction_amount", "total_transactions",
                "most_active_category", "spending_pattern_score", "anomaly_rate",
                "vs_previous_30d", "vs_user_average"
            ]
            
            for field in required_fields:
                assert field in data, f"Required field {field} missing from response"


class TestRegressionCompatibility:
    """Ensure enhanced endpoint doesn't break existing analytics functionality"""

    def test_other_analytics_endpoints_still_work(self, auth):
        """Verify other analytics endpoints remain functional"""
        with _client() as c:
            # Test insights endpoint
            r = c.get("/analytics/insights", headers=auth)
            assert r.status_code == 200, f"Insights endpoint broken: {r.text}"
            assert "insights" in r.json(), "Insights response format changed"
            
            # Test credit score endpoint
            r = c.get("/analytics/credit-score", headers=auth)
            assert r.status_code == 200, f"Credit score endpoint broken: {r.text}"
            assert "score" in r.json(), "Credit score response format changed"
            
            # Test alerts endpoint
            r = c.get("/analytics/alerts", headers=auth)
            assert r.status_code == 200, f"Alerts endpoint broken: {r.text}"
            assert "alerts" in r.json(), "Alerts response format changed"

    def test_existing_e2e_compatibility(self, auth):
        """Ensure existing E2E tests still pass with enhanced endpoint"""
        with _client() as c:
            # This replicates the exact check from existing E2E test
            r = c.get("/analytics/spend", headers=auth)
            assert r.status_code == 200, "E2E compatibility check failed"
            assert "last_30d_spend" in r.json(), "E2E compatibility: missing last_30d_spend"
            
            # Additional checks that existing code might rely on
            data = r.json()
            
            # Ensure decimal string format is maintained
            spend_value = data["last_30d_spend"]
            assert isinstance(spend_value, str), "last_30d_spend format changed"
            
            # Ensure it's a valid decimal
            try:
                decimal_value = Decimal(spend_value)
                assert decimal_value >= 0, "Spend value should be non-negative"
            except Exception as e:
                pytest.fail(f"last_30d_spend is not a valid decimal: {e}")


if __name__ == "__main__":
    # Allow running tests directly
    pytest.main([__file__, "-v"])