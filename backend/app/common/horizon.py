"""Horizon client with failover support for Unity Wallet."""

import httpx
import logging
import time
from typing import Any, Dict, List, Optional
from itertools import cycle
from .config import settings

logger = logging.getLogger(__name__)


class HorizonClientError(Exception):
    """Base exception for Horizon client errors."""
    pass


class HorizonClient:
    """Horizon client with round-robin failover and retry logic."""
    
    def __init__(self, endpoints: Optional[List[str]] = None, timeout: Optional[int] = None):
        """Initialize Horizon client.
        
        Args:
            endpoints: List of Horizon endpoint URLs. Defaults to config settings.
            timeout: HTTP timeout in seconds. Defaults to config settings.
        """
        self.endpoints = endpoints or settings.HORIZON_ENDPOINTS
        self.timeout = timeout or settings.HTTP_TIMEOUT_S
        self.endpoint_cycle = cycle(self.endpoints)
        self.current_endpoint = next(self.endpoint_cycle)
        
        # Retry configuration
        self.max_retries = 3
        self.retry_delay = 0.5  # seconds
        
        logger.info(f"Horizon client initialized with {len(self.endpoints)} endpoints, timeout: {self.timeout}s")
    
    def _get_next_endpoint(self) -> str:
        """Get the next endpoint in round-robin fashion."""
        self.current_endpoint = next(self.endpoint_cycle)
        return self.current_endpoint
    
    def _make_request(self, method: str, path: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request to current endpoint with error handling.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            path: API path to request
            **kwargs: Additional arguments for httpx request
            
        Returns:
            Dict containing the JSON response
            
        Raises:
            HorizonClientError: If request fails after all retries
        """
        # Ensure path starts with /
        if not path.startswith('/'):
            path = '/' + path
            
        url = f"{self.current_endpoint.rstrip('/')}{path}"
        
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.request(method, url, **kwargs)
                response.raise_for_status()
                
                logger.debug(f"Successful {method} request to {url}")
                return response.json()
                
        except httpx.TimeoutException as e:
            logger.warning(f"Timeout for {method} {url} (endpoint: {self.current_endpoint})")
            raise HorizonClientError(f"Request timeout to {self.current_endpoint}: {e}")
            
        except httpx.HTTPStatusError as e:
            logger.warning(f"HTTP {e.response.status_code} for {method} {url}")
            raise HorizonClientError(f"HTTP {e.response.status_code}: {e.response.text}")
            
        except httpx.RequestError as e:
            logger.warning(f"Request error for {method} {url}: {e}")
            raise HorizonClientError(f"Request error to {self.current_endpoint}: {e}")
            
        except Exception as e:
            logger.error(f"Unexpected error for {method} {url}: {e}")
            raise HorizonClientError(f"Unexpected error: {e}")
    
    def _make_request_with_failover(self, method: str, path: str, **kwargs) -> Dict[str, Any]:
        """Make request with automatic failover to other endpoints.
        
        Args:
            method: HTTP method
            path: API path
            **kwargs: Additional request arguments
            
        Returns:
            Dict containing the JSON response
            
        Raises:
            HorizonClientError: If all endpoints fail
        """
        last_error = None
        attempts = 0
        max_attempts = len(self.endpoints) * self.max_retries
        
        # Try each endpoint multiple times
        for endpoint_attempt in range(len(self.endpoints)):
            for retry_attempt in range(self.max_retries):
                attempts += 1
                
                try:
                    return self._make_request(method, path, **kwargs)
                    
                except HorizonClientError as e:
                    last_error = e
                    logger.warning(f"Attempt {attempts}/{max_attempts} failed for endpoint {self.current_endpoint}: {e}")
                    
                    # Wait before retry (except on last attempt)
                    if attempts < max_attempts:
                        time.sleep(self.retry_delay)
                
                # If this wasn't the last retry for this endpoint, continue with same endpoint
                # If it was the last retry, move to next endpoint
                if retry_attempt == self.max_retries - 1 and endpoint_attempt < len(self.endpoints) - 1:
                    self._get_next_endpoint()
                    logger.info(f"Failing over to next endpoint: {self.current_endpoint}")
        
        # All endpoints and retries exhausted
        error_msg = f"All Horizon endpoints failed after {attempts} attempts. Last error: {last_error}"
        logger.error(error_msg)
        raise HorizonClientError(error_msg)
    
    def get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make GET request with automatic failover.
        
        Args:
            path: API path to request (e.g., '/accounts/GXXXXXXX')
            params: Optional query parameters
            
        Returns:
            Dict containing the JSON response
            
        Raises:
            HorizonClientError: If request fails after all retries and failovers
        """
        logger.debug(f"Making GET request to path: {path}")
        return self._make_request_with_failover('GET', path, params=params)
    
    def post(self, path: str, data: Optional[Dict[str, Any]] = None, json: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make POST request with automatic failover.
        
        Args:
            path: API path to request
            data: Optional form data
            json: Optional JSON data
            
        Returns:
            Dict containing the JSON response
            
        Raises:
            HorizonClientError: If request fails after all retries and failovers
        """
        logger.debug(f"Making POST request to path: {path}")
        return self._make_request_with_failover('POST', path, data=data, json=json)
    
    def get_account(self, account_id: str) -> Dict[str, Any]:
        """Get account information from Horizon.
        
        Args:
            account_id: Stellar account ID (public key)
            
        Returns:
            Dict containing account information
            
        Raises:
            HorizonClientError: If request fails
        """
        return self.get(f'/accounts/{account_id}')
    
    def get_account_transactions(self, account_id: str, limit: int = 10) -> Dict[str, Any]:
        """Get account transactions from Horizon.
        
        Args:
            account_id: Stellar account ID
            limit: Number of transactions to retrieve
            
        Returns:
            Dict containing transaction records
            
        Raises:
            HorizonClientError: If request fails
        """
        return self.get(f'/accounts/{account_id}/transactions', params={'limit': limit})
    
    def submit_transaction(self, tx_xdr: str) -> Dict[str, Any]:
        """Submit transaction to Horizon.
        
        Args:
            tx_xdr: Transaction XDR to submit
            
        Returns:
            Dict containing transaction result
            
        Raises:
            HorizonClientError: If request fails
        """
        return self.post('/transactions', data={'tx': tx_xdr})
    
    def health_check(self) -> bool:
        """Check if at least one Horizon endpoint is healthy.
        
        Returns:
            True if any endpoint responds successfully
        """
        try:
            # Try to get network information as a health check
            self.get('/')
            return True
        except HorizonClientError:
            logger.warning("Health check failed - no Horizon endpoints responding")
            return False


# Global Horizon client instance
horizon = HorizonClient()


def get_horizon_client() -> HorizonClient:
    """Get the global Horizon client instance."""
    return horizon