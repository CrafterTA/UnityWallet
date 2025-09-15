"""Configuration settings for the ML service."""
import os
from typing import Optional

from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # Stellar network config
    horizon_url: str = Field(default="https://horizon-testnet.stellar.org", env="HORIZON_URL")
    network_passphrase: str = Field(default="Test SDF Network ; September 2015", env="NETWORK_PASSPHRASE")
    
    # Database config (for transaction history storage)
    database_url: Optional[str] = Field(default=None, env="DATABASE_URL")
    
    # Chain service URL
    chain_service_url: str = Field(default="http://localhost:8000", env="CHAIN_SERVICE_URL")
    
    # ML model paths
    model_path: str = Field(default="./models", env="MODEL_PATH")
    
    # Feature engineering config
    lookback_days: int = Field(default=90, env="LOOKBACK_DAYS")
    anomaly_threshold: float = Field(default=0.05, env="ANOMALY_THRESHOLD")
    
    # Cache config
    cache_ttl_seconds: int = Field(default=300, env="CACHE_TTL_SECONDS")  # 5 minutes
    
    # Pagination
    max_page_size: int = Field(default=1000, env="MAX_PAGE_SIZE")
    
    # LLM Configuration
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    gemini_api_key: Optional[str] = Field(default=None, env="GEMINI_API_KEY")
    llm_model: str = Field(default="gpt-3.5-turbo", env="LLM_MODEL")
    gemini_model: str = Field(default="gemini-2.0-flash", env="GEMINI_MODEL")
    use_local_llm: bool = Field(default=False, env="USE_LOCAL_LLM")
    use_gemini: bool = Field(default=True, env="USE_GEMINI")
    local_llm_url: Optional[str] = Field(default="http://localhost:1234/v1", env="LOCAL_LLM_URL")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
