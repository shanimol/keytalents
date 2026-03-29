import uuid
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserRole
from app.schemas.user import GoogleLoginRequest, RefreshRequest, TokenResponse, UserResponse

router = APIRouter()

_ACCESS_EXPIRE_MINUTES = 30
_REFRESH_EXPIRE_DAYS = 7


def _make_tokens(user: User) -> dict[str, str]:
    now = datetime.now(timezone.utc)
    access_payload = {
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role.value,
        "type": "access",
        "exp": now + timedelta(minutes=_ACCESS_EXPIRE_MINUTES),
    }
    refresh_payload = {
        "user_id": str(user.id),
        "type": "refresh",
        "exp": now + timedelta(days=_REFRESH_EXPIRE_DAYS),
    }
    return {
        "access_token": jwt.encode(access_payload, settings.secret_key, algorithm="HS256"),
        "refresh_token": jwt.encode(refresh_payload, settings.secret_key, algorithm="HS256"),
    }


@router.post("/google", response_model=TokenResponse)
async def google_login(body: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    """Verify a Google OAuth access token and return our JWT pair."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {body.token}"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    google_data = resp.json()
    google_id: str | None = google_data.get("sub")
    email: str | None = google_data.get("email")
    name: str = google_data.get("name") or google_data.get("email", "")
    avatar_url: str | None = google_data.get("picture")

    if not google_id or not email:
        raise HTTPException(status_code=401, detail="Google token missing required fields")

    # Find existing user by google_id, fall back to email for account linking
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if not user:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

    if user and not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")

    if not user:
        user = User(
            email=email,
            name=name,
            role=UserRole.employee,
            google_id=google_id,
            avatar_url=avatar_url,
        )
        db.add(user)
    else:
        user.google_id = google_id
        user.avatar_url = avatar_url

    await db.commit()
    await db.refresh(user)

    tokens = _make_tokens(user)
    return TokenResponse(**tokens, user=UserResponse.model_validate(user))


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(body.refresh_token, settings.secret_key, algorithms=["HS256"])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id_str: str | None = payload.get("user_id")
        if not user_id_str:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    result = await db.execute(
        select(User).where(User.id == user_id, User.is_active.is_(True))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    tokens = _make_tokens(user)
    return TokenResponse(**tokens, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
