"""Auth service business logic"""
from sqlalchemy.orm import Session
from ..common.models import User
from ..common.auth import authenticate_user, create_access_token
from ..common.logging import set_user_id
from .schema import LoginRequest, TokenResponse
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)

class AuthService:
    """Authentication service"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def login(self, login_data: LoginRequest) -> TokenResponse:
        """Authenticate user and return JWT token"""
        logger.info(f"Login attempt for username: {login_data.username}")
        
        # Authenticate user
        user = authenticate_user(self.db, login_data.username, login_data.password)
        
        if not user:
            logger.warning(f"Failed login attempt for username: {login_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Set user context for logging
        set_user_id(user.id)
        
        # Create access token
        access_token = create_access_token(data={"sub": user.username, "user_id": user.id})
        
        logger.info(f"User {user.username} logged in successfully")
        
        return TokenResponse(access_token=access_token)
    
    def get_user_profile(self, user: User) -> dict:
        """Get user profile information"""
        return {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "kyc_status": user.kyc_status.value
        }