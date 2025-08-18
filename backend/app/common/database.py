from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from .config import settings
from .models import Base
import redis
from typing import Generator

# Database engine
engine = create_engine(
    settings.database_url,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
    echo=settings.ENV == "development"
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Redis client
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

def get_db() -> Generator[Session, None, None]:
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

def get_redis():
    """Redis client dependency"""
    return redis_client