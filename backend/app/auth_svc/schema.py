"""Auth service schemas"""
from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

class LoginRequest(BaseModel):
    username: str
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "username": "alice",
                "password": "password123"
            }
        }

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username (3-50 characters)")
    password: str = Field(..., min_length=8, description="Password (minimum 8 characters)")
    full_name: str = Field(..., min_length=1, max_length=100, description="Full name")
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "newuser",
                "password": "securepassword123",
                "full_name": "John Doe"
            }
        }

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer"
            }
        }

class UserResponse(BaseModel):
    id: UUID
    username: str
    full_name: str
    kyc_status: str
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "username": "alice",
                "full_name": "Alice Smith",
                "kyc_status": "verified"
            }
        }