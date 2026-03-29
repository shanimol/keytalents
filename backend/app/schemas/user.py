from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.user import UserRole


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    role: UserRole
    avatar_url: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class GoogleLoginRequest(BaseModel):
    token: str  # Google access token (from implicit flow)


class RefreshRequest(BaseModel):
    refresh_token: str
