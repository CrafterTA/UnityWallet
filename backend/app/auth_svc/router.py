"""Auth service router"""
from fastapi import APIRouter, Depends, Query, Form
from sqlalchemy.orm import Session
from ..common.database import get_db
from ..common.auth import get_current_user
from ..common.models import User
from .service import AuthService
from .schema import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
async def login(
    username: str = Query(..., description="Username for authentication"),
    password: str = Query(..., description="Password for authentication"),
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return JWT access token
    
    - **username**: User's username
    - **password**: User's password
    
    Returns JWT access token for authenticated requests.
    """
    login_data = LoginRequest(username=username, password=password)
    auth_service = AuthService(db)
    return auth_service.login(login_data)

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user's profile information
    
    Requires valid JWT token in Authorization header.
    """
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        full_name=current_user.full_name,
        kyc_status=current_user.kyc_status.value
    )