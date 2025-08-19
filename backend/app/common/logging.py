"""Structured logging configuration for Unity Wallet API."""

import logging
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional
from pythonjsonlogger import jsonlogger
from .config import settings


class CorrelationIDFilter(logging.Filter):
    """Filter to add correlation ID to log records."""
    
    def filter(self, record: logging.LogRecord) -> bool:
        """Add correlation_id to log record if not present."""
        if not hasattr(record, 'correlation_id'):
            record.correlation_id = getattr(logging, '_correlation_id', None)
        return True


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter for structured logging."""
    
    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]) -> None:
        """Add custom fields to log record."""
        super().add_fields(log_record, record, message_dict)
        
        # Add timestamp
        if not log_record.get('timestamp'):
            log_record['timestamp'] = datetime.utcnow().isoformat()
            
        # Add level name
        if log_record.get('levelname'):
            log_record['level'] = log_record['levelname'].lower()
            
        # Add service information
        log_record['service'] = settings.APP_NAME
        log_record['version'] = settings.APP_VERSION
        log_record['environment'] = settings.ENV
        
        # Ensure important fields are present
        for field in ['correlation_id', 'user_id', 'tx_id', 'result_code']:
            if not log_record.get(field):
                log_record[field] = getattr(record, field, None)


def setup_logging() -> None:
    """Configure application logging."""
    
    # Set log level
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Clear existing handlers
    root_logger = logging.getLogger()
    root_logger.handlers = []
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    
    # Add correlation ID filter
    correlation_filter = CorrelationIDFilter()
    console_handler.addFilter(correlation_filter)
    
    # Configure formatter based on format preference
    if settings.LOG_FORMAT.lower() == 'json':
        # JSON formatter for structured logging
        formatter = CustomJsonFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s'
        )
    else:
        # Text formatter for human-readable logs
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(correlation_id)s - %(message)s'
        )
    
    console_handler.setFormatter(formatter)
    
    # Configure root logger
    root_logger.addHandler(console_handler)
    root_logger.setLevel(log_level)
    
    # Configure specific loggers
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    # Application logger
    app_logger = logging.getLogger("unity_wallet")
    app_logger.setLevel(log_level)


def get_logger(name: str) -> logging.Logger:
    """Get logger instance with the given name."""
    return logging.getLogger(f"unity_wallet.{name}")


def set_correlation_id(correlation_id: str) -> None:
    """Set correlation ID for current context."""
    logging._correlation_id = correlation_id


def get_correlation_id() -> Optional[str]:
    """Get current correlation ID."""
    return getattr(logging, '_correlation_id', None)


def set_user_id(user_id: str) -> None:
    """Set user ID for current context."""
    logging._user_id = user_id


def get_user_id() -> Optional[str]:
    """Get current user ID."""
    return getattr(logging, '_user_id', None)


def log_transaction(
    logger: logging.Logger,
    tx_id: str,
    user_id: str,
    tx_type: str,
    amount: float,
    asset_code: str,
    status: str,
    correlation_id: Optional[str] = None,
    stellar_tx_hash: Optional[str] = None,
    result_code: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None
) -> None:
    """Log transaction with structured data."""
    log_data = {
        'tx_id': tx_id,
        'user_id': user_id,
        'tx_type': tx_type,
        'amount': amount,
        'asset_code': asset_code,
        'status': status,
        'correlation_id': correlation_id or get_correlation_id(),
        'stellar_tx_hash': stellar_tx_hash,
        'result_code': result_code
    }
    
    if extra:
        log_data.update(extra)
    
    logger.info(f"Transaction {status}", extra=log_data)


def log_stellar_operation(
    logger: logging.Logger,
    operation_type: str,
    xdr: str,
    tx_hash: Optional[str] = None,
    result_code: Optional[str] = None,
    correlation_id: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None
) -> None:
    """Log Stellar operation with XDR details."""
    log_data = {
        'operation_type': operation_type,
        'stellar_xdr': xdr,
        'stellar_tx_hash': tx_hash,
        'result_code': result_code,
        'correlation_id': correlation_id or get_correlation_id()
    }
    
    if extra:
        log_data.update(extra)
    
    logger.info(f"Stellar operation: {operation_type}", extra=log_data)


def log_api_request(
    logger: logging.Logger,
    method: str,
    path: str,
    user_id: Optional[str] = None,
    correlation_id: Optional[str] = None,
    status_code: Optional[int] = None,
    response_time: Optional[float] = None,
    extra: Optional[Dict[str, Any]] = None
) -> None:
    """Log API request/response."""
    log_data = {
        'http_method': method,
        'http_path': path,
        'user_id': user_id,
        'correlation_id': correlation_id or get_correlation_id(),
        'status_code': status_code,
        'response_time_ms': response_time
    }
    
    if extra:
        log_data.update(extra)
    
    logger.info(f"{method} {path}", extra=log_data)