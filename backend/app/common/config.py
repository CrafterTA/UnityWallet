"""Configuration settings for the Unity Wallet application."""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os


from urllib.parse import quote

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "Unity Wallet API"
    APP_VERSION: str = "1.0.0"
    ENV: str = "development"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    APP_PORT: int = 8001
    
    # Database
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "change_me_in_production"
    POSTGRES_DB: str = "unity_wallet"
    
    @property
    def database_url(self) -> str:
        """Generate database URL for SQLAlchemy."""
        return f"postgresql://{quote(self.POSTGRES_USER)}:{quote(self.POSTGRES_PASSWORD)}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PORT: int = 6379
    
    # JWT Authentication
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "CHANGE_ME_IN_PRODUCTION")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    
    def model_post_init(self, __context):
        """Validate critical security settings"""
        # Allow demo key for development only
        if self.ENV == "development" and self.JWT_SECRET_KEY == "CHANGE_ME_IN_PRODUCTION":
            self.JWT_SECRET_KEY = "demo-jwt-secret-key-for-development-only-change-in-production"
        
        # Reject insecure keys for production
        if not self.JWT_SECRET_KEY or (self.ENV == "production" and self.JWT_SECRET_KEY in ["CHANGE_ME_IN_PRODUCTION", "demo-jwt-secret-key-for-development-only-change-in-production"]):
            raise ValueError("JWT_SECRET_KEY must be set to a secure value in environment variables")
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]
    
    # Stellar Network
    STELLAR_NETWORK: str = "testnet"  # testnet or mainnet
    STELLAR_DRY_RUN: bool = True
    STELLAR_HORIZON_URL: str = "https://horizon-testnet.stellar.org"
    
    # Horizon Client Configuration
    HORIZON_ENDPOINTS: List[str] = [
        "https://horizon-testnet.stellar.org",
        "https://horizon.stellar.org",  # mainnet as fallback
        "https://horizon-testnet.stellar.org"  # testnet again as final fallback
    ]
    HTTP_TIMEOUT_S: int = 10
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 60
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json or text
    
    # Security
    SECURITY_KEY: Optional[str] = None
    
    # Cache TTL (in seconds)
    QUOTE_CACHE_TTL: int = 60
    PATH_CACHE_TTL: int = 30
    SESSION_CACHE_TTL: int = 3600
    IDEMPOTENCY_CACHE_TTL: int = 3600
    QR_CACHE_TTL: int = 600
    
    class Config:
        """Pydantic config for environment variable loading."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings instance."""
    return settings