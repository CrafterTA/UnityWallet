"""Auth service business logic"""
from sqlalchemy.orm import Session
from ..common.models import User
from ..common.auth import authenticate_user, create_access_token, get_password_hash
from ..common.logging import set_user_id
from .schema import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from ..common.models import KYCStatus
from fastapi import HTTPException, status, Request
from ..common.audit import write_audit
from ..common.models import AuditAction, AuditStatus
import logging

logger = logging.getLogger(__name__)

class AuthService:
    """Authentication service"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def login(self, login_data: LoginRequest, request: Request = None) -> TokenResponse:
        """Authenticate user and return JWT token"""
        logger.info(f"Login attempt for username: {login_data.username}")
        
        # Authenticate user
        user = authenticate_user(self.db, login_data.username, login_data.password)
        
        if not user:
            logger.warning(f"Failed login attempt for username: {login_data.username}")
            
            # Audit failed login attempt
            write_audit(
                db=self.db,
                action=AuditAction.LOGIN,
                resource="user",
                status=AuditStatus.FAILED,
                user_id=None,  # No user ID for failed login
                resource_id=login_data.username,
                request=request,
                meta={
                    "attempted_username": login_data.username,
                    "failure_reason": "invalid_credentials"
                }
            )
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Set user context for logging
        set_user_id(str(user.id))
        
        # Create access token
        access_token = create_access_token(data={"sub": user.username, "user_id": str(user.id)})
        
        logger.info(f"User {user.username} logged in successfully")
        
        # Audit successful login
        write_audit(
            db=self.db,
            action=AuditAction.LOGIN,
            resource="user",
            status=AuditStatus.SUCCESS,
            user_id=str(user.id),
            resource_id=str(user.id),
            request=request,
            meta={
                "username": user.username,
                "login_method": "password"
            }
        )
        
        return TokenResponse(access_token=access_token)

    
    def register(self, register_data: RegisterRequest) -> UserResponse:
        """Register a new user"""
        logger.info(f"Registration attempt for username: {register_data.username}")
        
        # Check if username already exists
        existing_user = self.db.query(User).filter(User.username == register_data.username).first()
        if existing_user:
            logger.warning(f"Registration failed - username already exists: {register_data.username}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Hash password
        hashed_password = get_password_hash(register_data.password)
        
        # Create new user
        new_user = User(
            username=register_data.username,
            full_name=register_data.full_name,
            hashed_password=hashed_password,
            kyc_status=KYCStatus.PENDING
        )
        
        try:
            self.db.add(new_user)
            self.db.commit()
            self.db.refresh(new_user)
            
            logger.info(f"User {new_user.username} registered successfully with ID: {new_user.id}")
            
            return UserResponse(
                id=new_user.id,
                username=new_user.username,
                full_name=new_user.full_name,
                kyc_status=new_user.kyc_status.value
            )
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Registration failed for {register_data.username}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Registration failed"
            )
    
    def get_user_profile(self, user: User) -> dict:
        """Get user profile information"""
        return {
            "id": str(user.id),
            "username": user.username,
            "full_name": user.full_name,
            "kyc_status": user.kyc_status.value
        }