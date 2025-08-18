"""JWT Authentication utilities"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from .config import settings
from .models import User, KYCStatus
from .database import get_db
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

logger = logging.getLogger(__name__)

# JWT Security
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash (mock implementation)"""
    # For demo purposes, accept any password
    return True

def get_password_hash(password: str) -> str:
    """Hash a password (mock implementation)"""
    # For demo purposes, return a simple hash
    return f"mock_hash_{password}"

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.JWT_SECRET, 
        algorithm=settings.JWT_ALG
    )
    
    return encoded_jwt

def verify_token(token: str) -> Dict[str, Any]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET, 
            algorithms=[settings.JWT_ALG]
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError as e:
        logger.warning(f"Invalid token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate a user (mock implementation for demo)"""
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        return None
    
    # Mock password verification - in demo, any password works for verified users
    if user.kyc_status == KYCStatus.VERIFIED:
        logger.info(f"User {username} authenticated successfully")
        return user
    
    logger.warning(f"User {username} authentication failed - KYC not verified")
    return None

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    
    try:
        payload = verify_token(token)
        username: str = payload.get("sub")
        
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except HTTPException:
        raise
    
    user = db.query(User).filter(User.username == username).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

class MockKYC:
    """Mock KYC service for demo purposes"""
    
    @staticmethod
    def verify_user(username: str, full_name: str) -> KYCStatus:
        """Mock KYC verification - always returns VERIFIED for demo"""
        logger.info(f"Mock KYC verification for {username} ({full_name})")
        return KYCStatus.VERIFIED
    
    @staticmethod
    def get_user_status(user_id: int) -> KYCStatus:
        """Get KYC status for a user"""
        # In demo, assume all users are verified
        return KYCStatus.VERIFIED