"""Pydantic schemas for loyalty service."""

from pydantic import BaseModel, Field


class LoyaltyRequest(BaseModel):
    """Loyalty points operation request."""
    points: int = Field(..., gt=0, description="Points to earn or burn")


class LoyaltyResponse(BaseModel):
    """Loyalty operation response."""
    ok: bool
    points: int
    total_points: int