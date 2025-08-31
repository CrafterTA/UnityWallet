"""
Performance and load testing for the enhanced ML spending analytics endpoint.

This module focuses on testing the performance characteristics of the ML-enhanced
analytics endpoint under different conditions and data loads.
"""

import os
import uuid
import time
import statistics
import concurrent.futures
from typing import List, Dict, Any
import pytest
import httpx

BASE_URL = os.getenv("BASE_URL", "http://localhost:8001")
USERNAME = os.getenv("TEST_USER", "alice")
PASSWORD = os.getenv("TEST_PASS", "password123")
TIMEOUT = float(os.getenv("TEST_TIMEOUT", "30"))  # Longer timeout for performance tests

def _cid():
    """Generate correlation ID for request tracking"""
    return str(uuid.uuid4())

def _client():
    """Create HTTP client with extended timeout for performance tests"""
    return httpx.Client(base_url=BASE_URL, timeout=TIMEOUT, headers={"X-Correlation-ID": _cid()})

@pytest.fixture(scope="session")
def alice_token():
    """Authenticate and get JWT token for Alice"""
    with _client() as c:
        r = c.post("/auth/login", params={"username": "alice", "password": "password123"})
        assert r.status_code == 200, f"Alice login failed: {r.text}"
        data = r.json()
        assert "access_token" in data, "No access token in Alice login response"
        return data["access_token"]

@pytest.fixture(scope="session")
def bob_token():
    """Authenticate and get JWT token for Bob"""
    with _client() as c:
        r = c.post("/auth/login", params={"username": "bob", "password": "password123"})
        assert r.status_code == 200, f"Bob login failed: {r.text}"
        data = r.json()
        assert "access_token" in data, "No access token in Bob login response"
        return data["access_token"]

@pytest.fixture()
def alice_auth(alice_token):
    """Alice's auth headers"""
    return {"Authorization": f"Bearer {alice_token}", "X-Correlation-ID": _cid(), "Content-Type": "application/json"}

@pytest.fixture()
def bob_auth(bob_token):
    """Bob's auth headers"""
    return {"Authorization": f"Bearer {bob_token}", "X-Correlation-ID": _cid(), "Content-Type": "application/json"}


class TestAnalyticsPerformance:
    """Performance test suite for ML spending analytics endpoint"""

    def test_single_request_response_time(self, alice_auth):
        """Test response time for single requests meets SLA requirements"""
        response_times = []
        
        # Make multiple requests to get reliable timing data
        for i in range(5):
            with _client() as c:
                start_time = time.time()
                r = c.get("/analytics/spend", headers=alice_auth)
                end_time = time.time()
                
                assert r.status_code == 200, f"Request {i+1} failed: {r.text}"
                response_times.append(end_time - start_time)
                
                # Small delay between requests
                time.sleep(0.1)
        
        # Performance assertions
        avg_response_time = statistics.mean(response_times)
        max_response_time = max(response_times)
        min_response_time = min(response_times)
        
        # SLA requirements for ML-enhanced analytics
        assert avg_response_time < 3.0, f"Average response time too slow: {avg_response_time:.3f}s"
        assert max_response_time < 5.0, f"Maximum response time too slow: {max_response_time:.3f}s"
        assert min_response_time < 2.0, f"Minimum response time slower than expected: {min_response_time:.3f}s"
        
        print(f"\\nPerformance Summary:")
        print(f"Average response time: {avg_response_time:.3f}s")
        print(f"Min response time: {min_response_time:.3f}s")
        print(f"Max response time: {max_response_time:.3f}s")
        print(f"Standard deviation: {statistics.stdev(response_times):.3f}s")

    def test_concurrent_requests_performance(self, alice_auth, bob_auth):
        """Test system performance under concurrent load"""
        
        def make_request(auth_headers, request_id):
            """Make a single request and return timing data"""
            try:
                with _client() as c:
                    start_time = time.time()
                    r = c.get("/analytics/spend", headers=auth_headers)
                    end_time = time.time()
                    
                    return {
                        'request_id': request_id,
                        'status_code': r.status_code,
                        'response_time': end_time - start_time,
                        'success': r.status_code == 200
                    }
            except Exception as e:
                return {
                    'request_id': request_id,
                    'status_code': 0,
                    'response_time': 0,
                    'success': False,
                    'error': str(e)
                }
        
        # Test with concurrent requests from multiple users
        concurrent_requests = 8  # Reasonable concurrent load
        auth_headers_list = [alice_auth, bob_auth] * (concurrent_requests // 2)
        
        start_time = time.time()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_requests) as executor:
            futures = [
                executor.submit(make_request, auth_headers, i) 
                for i, auth_headers in enumerate(auth_headers_list)
            ]
            
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Analyze results
        successful_requests = [r for r in results if r['success']]
        failed_requests = [r for r in results if not r['success']]
        
        if failed_requests:
            print(f"\\nFailed requests: {len(failed_requests)}")
            for req in failed_requests:
                print(f"  Request {req['request_id']}: Status {req['status_code']}, Error: {req.get('error', 'Unknown')}")
        
        # Performance assertions
        success_rate = len(successful_requests) / len(results)
        assert success_rate >= 0.9, f"Success rate too low: {success_rate:.1%}"
        
        response_times = [r['response_time'] for r in successful_requests]
        avg_response_time = statistics.mean(response_times)
        max_response_time = max(response_times)
        
        # Under concurrent load, response times may be higher
        assert avg_response_time < 8.0, f"Average response time under load too slow: {avg_response_time:.3f}s"
        assert max_response_time < 15.0, f"Maximum response time under load too slow: {max_response_time:.3f}s"
        assert total_time < 20.0, f"Total concurrent execution time too slow: {total_time:.3f}s"
        
        print(f"\\nConcurrent Performance Summary:")
        print(f"Total requests: {len(results)}")
        print(f"Successful requests: {len(successful_requests)}")
        print(f"Success rate: {success_rate:.1%}")
        print(f"Total execution time: {total_time:.3f}s")
        print(f"Average response time: {avg_response_time:.3f}s")
        print(f"Max response time: {max_response_time:.3f}s")
        print(f"Requests per second: {len(successful_requests) / total_time:.2f}")

    def test_ml_processing_consistency_under_load(self, alice_auth):
        """Test that ML processing remains consistent under repeated requests"""
        
        # Make multiple requests to same endpoint
        responses = []
        response_times = []
        
        for i in range(10):
            with _client() as c:
                start_time = time.time()
                r = c.get("/analytics/spend", headers=alice_auth)
                end_time = time.time()
                
                assert r.status_code == 200, f"Request {i+1} failed: {r.text}"
                
                data = r.json()
                responses.append(data)
                response_times.append(end_time - start_time)
                
                time.sleep(0.05)  # Small delay
        
        # Verify ML processing consistency
        first_response = responses[0]
        
        for i, response in enumerate(responses[1:], 1):
            # Core spending value should be consistent (no new transactions added)
            assert response["last_30d_spend"] == first_response["last_30d_spend"], \
                f"Spending amount inconsistent at request {i+1}"
            
            # Category breakdown should be consistent
            assert len(response["category_breakdown"]) == len(first_response["category_breakdown"]), \
                f"Category count inconsistent at request {i+1}"
            
            # Total transactions should be consistent
            assert response["total_transactions"] == first_response["total_transactions"], \
                f"Transaction count inconsistent at request {i+1}"
            
            # ML scores should be deterministic (within small variance for floating point)
            pattern_score_diff = abs(response["spending_pattern_score"] - first_response["spending_pattern_score"])
            assert pattern_score_diff < 0.001, \
                f"Pattern score inconsistent at request {i+1}: {pattern_score_diff}"
        
        # Performance should be consistent
        avg_response_time = statistics.mean(response_times)
        max_deviation = max([abs(rt - avg_response_time) for rt in response_times])
        
        assert max_deviation < 2.0, \
            f"Response time too variable: max deviation {max_deviation:.3f}s"
        
        print(f"\\nML Consistency Summary:")
        print(f"Total test requests: {len(responses)}")
        print(f"Average response time: {avg_response_time:.3f}s")
        print(f"Max response time deviation: {max_deviation:.3f}s")
        print(f"Spending amount (consistent): ${first_response['last_30d_spend']}")
        print(f"Transaction count (consistent): {first_response['total_transactions']}")

    def test_memory_and_resource_efficiency(self, alice_auth):
        """Test that the endpoint doesn't exhibit memory leaks or resource issues"""
        
        # Run many sequential requests to test for resource leaks
        num_requests = 50
        response_times = []
        
        print(f"\\nTesting resource efficiency with {num_requests} requests...")
        
        for i in range(num_requests):
            with _client() as c:
                start_time = time.time()
                r = c.get("/analytics/spend", headers=alice_auth)
                end_time = time.time()
                
                assert r.status_code == 200, f"Request {i+1} failed: {r.text}"
                response_times.append(end_time - start_time)
                
                # Progress indicator
                if (i + 1) % 10 == 0:
                    print(f"  Completed {i + 1}/{num_requests} requests")
        
        # Analyze response time trend (should not increase significantly over time)
        first_10_avg = statistics.mean(response_times[:10])
        last_10_avg = statistics.mean(response_times[-10:])
        middle_10_avg = statistics.mean(response_times[20:30])
        
        # Response times shouldn't degrade significantly over many requests
        degradation = last_10_avg - first_10_avg
        assert degradation < 1.0, \
            f"Performance degraded too much over {num_requests} requests: {degradation:.3f}s"
        
        # Calculate statistics
        avg_response_time = statistics.mean(response_times)
        std_deviation = statistics.stdev(response_times)
        
        print(f"\\nResource Efficiency Summary:")
        print(f"Total requests: {num_requests}")
        print(f"First 10 requests avg: {first_10_avg:.3f}s")
        print(f"Middle 10 requests avg: {middle_10_avg:.3f}s")
        print(f"Last 10 requests avg: {last_10_avg:.3f}s")
        print(f"Performance degradation: {degradation:.3f}s")
        print(f"Overall average: {avg_response_time:.3f}s")
        print(f"Standard deviation: {std_deviation:.3f}s")

    def test_error_recovery_performance(self, alice_auth):
        """Test performance recovery after error conditions"""
        
        # First, establish baseline performance
        baseline_times = []
        for _ in range(3):
            with _client() as c:
                start_time = time.time()
                r = c.get("/analytics/spend", headers=alice_auth)
                end_time = time.time()
                assert r.status_code == 200
                baseline_times.append(end_time - start_time)
        
        baseline_avg = statistics.mean(baseline_times)
        
        # Trigger some error conditions (invalid auth)
        error_conditions = [
            {"Authorization": "Bearer invalid_token"},
            {"Authorization": "Bearer expired_token"},
            {"Authorization": "InvalidFormat"},
            {}  # No auth header
        ]
        
        for error_auth in error_conditions:
            with _client() as c:
                # These should fail, but server should handle gracefully
                r = c.get("/analytics/spend", headers=error_auth)
                assert r.status_code in [401, 403, 500]  # Expected error codes
        
        # Test performance recovery after errors
        recovery_times = []
        for _ in range(5):
            with _client() as c:
                start_time = time.time()
                r = c.get("/analytics/spend", headers=alice_auth)
                end_time = time.time()
                assert r.status_code == 200, "System should recover from errors"
                recovery_times.append(end_time - start_time)
                time.sleep(0.1)
        
        recovery_avg = statistics.mean(recovery_times)
        
        # Performance should recover to baseline levels
        performance_impact = recovery_avg - baseline_avg
        assert performance_impact < 1.0, \
            f"Performance didn't recover after errors: {performance_impact:.3f}s impact"
        
        print(f"\\nError Recovery Performance:")
        print(f"Baseline average: {baseline_avg:.3f}s")
        print(f"Recovery average: {recovery_avg:.3f}s")
        print(f"Performance impact: {performance_impact:.3f}s")


class TestDataVolumeScaling:
    """Test how the endpoint performs with different amounts of user data"""

    def test_performance_with_current_data_volume(self, alice_auth, bob_auth):
        """Baseline test with current seeded data volume"""
        
        users = [("alice", alice_auth), ("bob", bob_auth)]
        results = {}
        
        for username, auth in users:
            response_times = []
            
            for _ in range(3):
                with _client() as c:
                    start_time = time.time()
                    r = c.get("/analytics/spend", headers=auth)
                    end_time = time.time()
                    
                    assert r.status_code == 200, f"{username} request failed: {r.text}"
                    response_times.append(end_time - start_time)
                    
                    data = r.json()
                    results[username] = {
                        'avg_response_time': statistics.mean(response_times),
                        'transaction_count': data['total_transactions'],
                        'category_count': len(data['category_breakdown']),
                        'anomaly_count': len(data['anomaly_insights'])
                    }
        
        # Log current data characteristics for comparison
        print(f"\\nCurrent Data Volume Performance:")
        for username, metrics in results.items():
            print(f"{username}:")
            print(f"  Transactions: {metrics['transaction_count']}")
            print(f"  Categories: {metrics['category_count']}")
            print(f"  Anomalies detected: {metrics['anomaly_count']}")
            print(f"  Avg response time: {metrics['avg_response_time']:.3f}s")
        
        # All users should have reasonable performance
        for username, metrics in results.items():
            assert metrics['avg_response_time'] < 3.0, \
                f"{username} performance too slow: {metrics['avg_response_time']:.3f}s"

    def test_ml_algorithm_efficiency_validation(self, alice_auth):
        """Validate that ML processing algorithms are efficient"""
        
        # Test multiple requests to measure ML processing overhead
        total_requests = 10
        ml_processing_times = []
        
        for i in range(total_requests):
            with _client() as c:
                start_time = time.time()
                r = c.get("/analytics/spend", headers=alice_auth)
                end_time = time.time()
                
                assert r.status_code == 200, f"Request {i+1} failed: {r.text}"
                ml_processing_times.append(end_time - start_time)
                
                data = r.json()
                
                # Validate ML output quality vs performance trade-off
                assert len(data['category_breakdown']) > 0 or data['total_transactions'] == 0, \
                    "ML should provide categories when transactions exist"
                
                assert isinstance(data['spending_pattern_score'], (int, float)), \
                    "ML pattern score should be numeric"
                
                assert 0.0 <= data['spending_pattern_score'] <= 1.0, \
                    "ML pattern score should be normalized"
        
        avg_ml_time = statistics.mean(ml_processing_times)
        std_ml_time = statistics.stdev(ml_processing_times) if len(ml_processing_times) > 1 else 0
        
        # ML processing should be efficient and consistent
        assert avg_ml_time < 4.0, f"ML processing too slow: {avg_ml_time:.3f}s"
        assert std_ml_time < 1.0, f"ML processing too variable: {std_ml_time:.3f}s"
        
        print(f"\\nML Algorithm Efficiency:")
        print(f"Average processing time: {avg_ml_time:.3f}s")
        print(f"Processing time std dev: {std_ml_time:.3f}s")
        print(f"Processing consistency: {'Good' if std_ml_time < 0.5 else 'Fair'}")


if __name__ == "__main__":
    # Allow running performance tests directly
    pytest.main([__file__, "-v", "-s"])