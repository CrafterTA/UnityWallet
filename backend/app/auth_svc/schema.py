"""Auth service schemas"""
from pydantic import BaseModel
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