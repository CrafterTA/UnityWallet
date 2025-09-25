"""Configuration settings for the ML service."""
import os
from typing import Optional

from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # ML Service Configuration
    ml_service_host: str = Field(default="0.0.0.0", env="ML_SERVICE_HOST")
    ml_service_port: int = Field(default=8001, env="ML_SERVICE_PORT")
    debug: bool = Field(default=True, env="DEBUG")
    
    # Solana Network Configuration
    solana_rpc_url: str = Field(default="https://api.devnet.solana.com", env="SOLANA_RPC_URL")
    solana_network: str = Field(default="devnet", env="SOLANA_NETWORK")
    solana_commitment: str = Field(default="confirmed", env="SOLANA_COMMITMENT")
    
    # Chain API Configuration
    chain_api_url: str = Field(default="http://localhost:8000", env="CHAIN_API_URL")
    chain_service_url: str = Field(default="http://localhost:8000", env="CHAIN_SERVICE_URL")
    chain_api_transactions_endpoint: str = Field(default="/wallet/transactions", env="CHAIN_API_TRANSACTIONS_ENDPOINT")
    chain_api_balance_endpoint: str = Field(default="/wallet/balance", env="CHAIN_API_BALANCE_ENDPOINT")
    chain_api_health_endpoint: str = Field(default="/health", env="CHAIN_API_HEALTH_ENDPOINT")
    
    # Token Configuration
    usdt_mint: str = Field(default="Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", env="USDT_MINT")
    usdt_authority: Optional[str] = Field(default=None, env="USDT_AUTHORITY")
    
    # Database config
    database_url: Optional[str] = Field(default=None, env="DATABASE_URL")
    
    # ML Model Configuration
    model_path: str = Field(default="./artifacts/models", env="MODEL_PATH")
    lookback_days: int = Field(default=90, env="LOOKBACK_DAYS")
    anomaly_threshold: float = Field(default=0.05, env="ANOMALY_THRESHOLD")
    anomaly_contamination: float = Field(default=0.1, env="ANOMALY_CONTAMINATION")
    max_features: int = Field(default=50, env="MAX_FEATURES")
    feature_window_hours: int = Field(default=24, env="FEATURE_WINDOW_HOURS")
    
    # Performance Settings
    cache_ttl_seconds: int = Field(default=300, env="CACHE_TTL_SECONDS")
    cache_max_size: int = Field(default=1000, env="CACHE_MAX_SIZE")
    max_page_size: int = Field(default=1000, env="MAX_PAGE_SIZE")
    max_concurrent_requests: int = Field(default=10, env="MAX_CONCURRENT_REQUESTS")
    request_timeout_seconds: int = Field(default=30, env="REQUEST_TIMEOUT_SECONDS")
    
    # AI/LLM Configuration
    gemini_api_key: Optional[str] = Field(default=None, env="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.0-flash-exp", env="GEMINI_MODEL")
    use_gemini: bool = Field(default=True, env="USE_GEMINI")
    gemini_temperature: float = Field(default=0.7, env="GEMINI_TEMPERATURE")
    gemini_max_tokens: int = Field(default=2048, env="GEMINI_MAX_TOKENS")
    
    # Logging & Monitoring
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_format: str = Field(default="json", env="LOG_FORMAT")
    enable_verbose_logging: bool = Field(default=False, env="ENABLE_VERBOSE_LOGGING")
    enable_performance_monitoring: bool = Field(default=True, env="ENABLE_PERFORMANCE_MONITORING")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
