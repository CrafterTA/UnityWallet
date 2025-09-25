from fastapi import APIRouter, HTTPException, Response, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import secrets
import jwt
from datetime import datetime, timedelta
from typing import Optional
import os
 
router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()
 
# Secret key for JWT signing (in production, use environment variable)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
JWT_ALGORITHM = "HS256"
SESSION_EXPIRE_HOURS = 24
 
# In-memory session store (in production, use Redis or database)
active_sessions = {}
 
class LoginRequest(BaseModel):
    public_key: str
    password_verified: bool = True  # Frontend đã verify password với keystore
 
class SessionResponse(BaseModel):
    session_token: str
    expires_at: str
    public_key: str
 
class RefreshRequest(BaseModel):
    refresh_token: str
 
def generate_session_key() -> str:
    """Generate a secure random session key"""
    return secrets.token_urlsafe(32)
 
def create_jwt_token(public_key: str, session_key: str) -> str:
    """Create JWT token containing session information"""
    payload = {
        "public_key": public_key,
        "session_key": session_key,
        "exp": datetime.utcnow() + timedelta(hours=SESSION_EXPIRE_HOURS),
        "iat": datetime.utcnow(),
        "type": "session"
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
 
def verify_jwt_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session token")
 
@router.post("/login", response_model=SessionResponse)
async def login(request: LoginRequest, response: Response):
    """
    Create a new session after successful password verification
    Frontend should verify password with keystore before calling this endpoint
    """
    if not request.password_verified:
        raise HTTPException(status_code=401, detail="Password verification required")
    
    # Generate session key and JWT token
    session_key = generate_session_key()
    jwt_token = create_jwt_token(request.public_key, session_key)
    
    # Store session in memory (use Redis in production)
    session_id = secrets.token_urlsafe(16)
    active_sessions[session_id] = {
        "public_key": request.public_key,
        "session_key": session_key,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=SESSION_EXPIRE_HOURS)
    }
    
    # Set HttpOnly cookie with JWT token
    response.set_cookie(
        key="session_token",
        value=jwt_token,
        httponly=True,
        secure=True,  # Use HTTPS in production
        samesite="strict",
        max_age=SESSION_EXPIRE_HOURS * 3600,
        path="/"
    )
    
    # Also set session_id cookie for session management
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=SESSION_EXPIRE_HOURS * 3600,
        path="/"
    )
    
    return SessionResponse(
        session_token=session_key,  # Return session key to frontend for encryption
        expires_at=(datetime.utcnow() + timedelta(hours=SESSION_EXPIRE_HOURS)).isoformat(),
        public_key=request.public_key
    )
 
@router.post("/refresh")
async def refresh_session(request: Request, response: Response):
    """
    Refresh session token from HttpOnly cookie
    """
    # Get JWT token from HttpOnly cookie
    jwt_token = request.cookies.get("session_token")
    session_id = request.cookies.get("session_id")
    
    if not jwt_token or not session_id:
        raise HTTPException(status_code=401, detail="No active session")
    
    # Verify JWT token
    try:
        payload = verify_jwt_token(jwt_token)
        public_key = payload["public_key"]
        old_session_key = payload["session_key"]
    except HTTPException:
        # Token expired or invalid, check if session still exists
        if session_id in active_sessions:
            session_data = active_sessions[session_id]
            if session_data["expires_at"] > datetime.utcnow():
                public_key = session_data["public_key"]
                old_session_key = session_data["session_key"]
            else:
                # Session expired
                del active_sessions[session_id]
                raise HTTPException(status_code=401, detail="Session expired")
        else:
            raise HTTPException(status_code=401, detail="Invalid session")
    
    # Generate new session key and JWT token
    new_session_key = generate_session_key()
    new_jwt_token = create_jwt_token(public_key, new_session_key)
    
    # Update session in memory
    if session_id in active_sessions:
        active_sessions[session_id].update({
            "session_key": new_session_key,
            "expires_at": datetime.utcnow() + timedelta(hours=SESSION_EXPIRE_HOURS)
        })
    
    # Update HttpOnly cookies
    response.set_cookie(
        key="session_token",
        value=new_jwt_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=SESSION_EXPIRE_HOURS * 3600,
        path="/"
    )
    
    return {
        "session_token": new_session_key,  # Return new session key for re-encryption
        "expires_at": (datetime.utcnow() + timedelta(hours=SESSION_EXPIRE_HOURS)).isoformat(),
        "public_key": public_key
    }
 
@router.post("/logout")
async def logout(request: Request, response: Response):
    """
    Logout and clear session
    """
    session_id = request.cookies.get("session_id")
    
    # Remove session from memory
    if session_id and session_id in active_sessions:
        del active_sessions[session_id]
    
    # Clear HttpOnly cookies
    response.delete_cookie(key="session_token", path="/")
    response.delete_cookie(key="session_id", path="/")
    
    return {"message": "Logged out successfully"}
 
@router.get("/verify")
async def verify_session(request: Request):
    """
    Verify current session and return session info
    """
    jwt_token = request.cookies.get("session_token")
    session_id = request.cookies.get("session_id")
    
    if not jwt_token or not session_id:
        raise HTTPException(status_code=401, detail="No active session")
    
    try:
        payload = verify_jwt_token(jwt_token)
        public_key = payload["public_key"]
        session_key = payload["session_key"]
        
        # Verify session still exists in memory
        if session_id not in active_sessions:
            raise HTTPException(status_code=401, detail="Session not found")
        
        session_data = active_sessions[session_id]
        if session_data["expires_at"] <= datetime.utcnow():
            del active_sessions[session_id]
            raise HTTPException(status_code=401, detail="Session expired")
        
        return {
            "session_token": session_key,
            "expires_at": session_data["expires_at"].isoformat(),
            "public_key": public_key,
            "valid": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid session")
 
# Dependency to get current session
async def get_current_session(request: Request) -> dict:
    """
    Dependency to get current session information
    """
    jwt_token = request.cookies.get("session_token")
    session_id = request.cookies.get("session_id")
    
    if not jwt_token or not session_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        payload = verify_jwt_token(jwt_token)
        public_key = payload["public_key"]
        session_key = payload["session_key"]
        
        # Verify session exists
        if session_id not in active_sessions:
            raise HTTPException(status_code=401, detail="Session not found")
        
        session_data = active_sessions[session_id]
        if session_data["expires_at"] <= datetime.utcnow():
            del active_sessions[session_id]
            raise HTTPException(status_code=401, detail="Session expired")
        
        return {
            "public_key": public_key,
            "session_key": session_key,
            "session_id": session_id
        }
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session")
