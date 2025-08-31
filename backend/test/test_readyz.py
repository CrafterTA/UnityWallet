"""Tests for the /readyz endpoint with mock Horizon client."""

import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.main import app
from app.common.database import get_db, get_redis
from app.common.horizon import HorizonClient, HorizonClientError


class TestReadyzEndpoint:
    """Test the /readyz endpoint with various service health scenarios."""
    
    @pytest.fixture
    def client(self):
        """Create a test client for the FastAPI app."""
        return TestClient(app)
    
    def test_readyz_all_services_healthy(self, client):
        """Test /readyz endpoint when all services are healthy."""
        with patch('app.main.get_horizon_client') as mock_horizon_getter:
            mock_horizon = Mock(spec=HorizonClient)
            mock_horizon.health_check.return_value = True
            mock_horizon_getter.return_value = mock_horizon
            
            response = client.get("/readyz")
            
            assert response.status_code == 200
            data = response.json()
            
            # Verify response structure
            assert data["status"] == "ready"
            assert "version" in data
            assert "checks" in data
            assert "timestamp" in data
            
            # Verify all service checks are healthy
            checks = data["checks"]
            assert "database" in checks
            assert "redis" in checks 
            assert "horizon" in checks
            
            assert checks["database"]["status"] == "healthy"
            assert checks["redis"]["status"] == "healthy"
            assert checks["horizon"]["status"] == "healthy"
            
            # Verify Horizon health check was called
            mock_horizon.health_check.assert_called_once()
    
    def test_readyz_horizon_unhealthy(self, client):
        """Test /readyz endpoint when Horizon is down."""
        with patch('app.main.get_horizon_client') as mock_horizon_getter:
            mock_horizon = Mock(spec=HorizonClient)
            mock_horizon.health_check.return_value = False
            mock_horizon_getter.return_value = mock_horizon
            
            response = client.get("/readyz")
            
            assert response.status_code == 503  # Service Unavailable
            data = response.json()
            
            # Verify response structure
            assert data["status"] == "not_ready"
            assert "version" in data
            assert "checks" in data
            assert "failed_services" in data
            
            # Verify Horizon is marked as unhealthy
            checks = data["checks"]
            assert checks["horizon"]["status"] == "unhealthy"
            assert "horizon" in data["failed_services"]
            
            # Database and Redis should still be healthy
            assert checks["database"]["status"] == "healthy"
            assert checks["redis"]["status"] == "healthy"
    
    def test_readyz_horizon_exception(self, client):
        """Test /readyz endpoint when Horizon health check raises exception."""
        with patch('app.main.get_horizon_client') as mock_horizon_getter:
            mock_horizon = Mock(spec=HorizonClient)
            mock_horizon.health_check.side_effect = HorizonClientError("Connection failed")
            mock_horizon_getter.return_value = mock_horizon
            
            response = client.get("/readyz")
            
            assert response.status_code == 503  # Service Unavailable
            data = response.json()
            
            # Verify Horizon is marked as unhealthy with error
            checks = data["checks"]
            assert checks["horizon"]["status"] == "unhealthy"
            assert "error" in checks["horizon"]
            assert "Connection failed" in checks["horizon"]["error"]
            assert "horizon" in data["failed_services"]
    
    def test_readyz_database_unhealthy(self, client):
        """Test /readyz endpoint when database is down."""
        with patch('app.main.get_db') as mock_get_db, \
             patch('app.main.get_horizon_client') as mock_horizon_getter:
            
            # Mock database failure
            mock_db = Mock()
            mock_db.execute.side_effect = Exception("Database connection failed")
            mock_get_db.return_value.__next__ = Mock(return_value=mock_db)
            
            # Mock healthy Horizon
            mock_horizon = Mock(spec=HorizonClient)
            mock_horizon.health_check.return_value = True
            mock_horizon_getter.return_value = mock_horizon
            
            response = client.get("/readyz")
            
            assert response.status_code == 503  # Service Unavailable
            data = response.json()
            
            # Verify database is marked as unhealthy
            checks = data["checks"]
            assert checks["database"]["status"] == "unhealthy"
            assert "error" in checks["database"]
            assert "database" in data["failed_services"]
            
            # Horizon should still be healthy
            assert checks["horizon"]["status"] == "healthy"
    
    def test_readyz_redis_unhealthy(self, client):
        """Test /readyz endpoint when Redis is down."""
        with patch('app.main.get_redis') as mock_get_redis, \
             patch('app.main.get_horizon_client') as mock_horizon_getter:
            
            # Mock Redis failure
            mock_redis_client = Mock()
            mock_redis_client.redis.set.side_effect = Exception("Redis connection failed")
            mock_get_redis.return_value = mock_redis_client
            
            # Mock healthy Horizon
            mock_horizon = Mock(spec=HorizonClient)
            mock_horizon.health_check.return_value = True
            mock_horizon_getter.return_value = mock_horizon
            
            response = client.get("/readyz")
            
            assert response.status_code == 503  # Service Unavailable
            data = response.json()
            
            # Verify Redis is marked as unhealthy
            checks = data["checks"]
            assert checks["redis"]["status"] == "unhealthy"
            assert "error" in checks["redis"]
            assert "redis" in data["failed_services"]
            
            # Horizon should still be healthy
            assert checks["horizon"]["status"] == "healthy"
    
    def test_readyz_multiple_services_unhealthy(self, client):
        """Test /readyz endpoint when multiple services are down."""
        with patch('app.main.get_db') as mock_get_db, \
             patch('app.main.get_redis') as mock_get_redis, \
             patch('app.main.get_horizon_client') as mock_horizon_getter:
            
            # Mock database failure
            mock_db = Mock()
            mock_db.execute.side_effect = Exception("Database down")
            mock_get_db.return_value.__next__ = Mock(return_value=mock_db)
            
            # Mock Redis failure
            mock_redis_client = Mock()
            mock_redis_client.redis.set.side_effect = Exception("Redis down")
            mock_get_redis.return_value = mock_redis_client
            
            # Mock Horizon failure
            mock_horizon = Mock(spec=HorizonClient)
            mock_horizon.health_check.return_value = False
            mock_horizon_getter.return_value = mock_horizon
            
            response = client.get("/readyz")
            
            assert response.status_code == 503  # Service Unavailable
            data = response.json()
            
            # Verify all services are marked as unhealthy
            checks = data["checks"]
            assert checks["database"]["status"] == "unhealthy"
            assert checks["redis"]["status"] == "unhealthy"
            assert checks["horizon"]["status"] == "unhealthy"
            
            # All services should be in failed_services list
            failed_services = data["failed_services"]
            assert "database" in failed_services
            assert "redis" in failed_services
            assert "horizon" in failed_services
    
    def test_readyz_response_headers(self, client):
        """Test /readyz endpoint includes proper response headers."""
        with patch('app.main.get_horizon_client') as mock_horizon_getter:
            mock_horizon = Mock(spec=HorizonClient)
            mock_horizon.health_check.return_value = True
            mock_horizon_getter.return_value = mock_horizon
            
            response = client.get("/readyz")
            
            # Verify correlation headers are present
            assert "X-Correlation-ID" in response.headers or "x-correlation-id" in response.headers
    
    def test_healthz_always_returns_200(self, client):
        """Test /healthz endpoint always returns 200 if service is running."""
        response = client.get("/healthz")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "healthy"
        assert "version" in data
        assert "timestamp" in data
    
    def test_readyz_vs_healthz_difference(self, client):
        """Test that /healthz and /readyz have different behaviors."""
        # /healthz should always return 200
        healthz_response = client.get("/healthz")
        assert healthz_response.status_code == 200
        
        # /readyz with unhealthy Horizon should return 503
        with patch('app.main.get_horizon_client') as mock_horizon_getter:
            mock_horizon = Mock(spec=HorizonClient)
            mock_horizon.health_check.return_value = False
            mock_horizon_getter.return_value = mock_horizon
            
            readyz_response = client.get("/readyz")
            assert readyz_response.status_code == 503
            
            # Verify different response structures
            healthz_data = healthz_response.json()
            readyz_data = readyz_response.json()
            
            assert "checks" not in healthz_data  # Simple health check
            assert "checks" in readyz_data       # Comprehensive readiness check


if __name__ == "__main__":
    pytest.main([__file__, "-v"])