"""Dev-only endpoints — seed test data without real Google accounts."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import _make_tokens
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse

router = APIRouter()

_SEED_USERS = [
    {
        "email": "admin@keytalent.dev",
        "name": "Admin User",
        "role": UserRole.admin,
        "google_id": "dev_admin_001",
        "avatar_url": None,
    },
    {
        "email": "alice@keytalent.dev",
        "name": "Alice Johnson",
        "role": UserRole.employee,
        "google_id": "dev_emp_001",
        "avatar_url": None,
    },
    {
        "email": "bob@keytalent.dev",
        "name": "Bob Smith",
        "role": UserRole.employee,
        "google_id": "dev_emp_002",
        "avatar_url": None,
    },
    {
        "email": "carol@keytalent.dev",
        "name": "Carol Williams",
        "role": UserRole.lead,
        "google_id": "dev_lead_001",
        "avatar_url": None,
    },
]


@router.post("/seed")
async def seed_dev_data(db: AsyncSession = Depends(get_db)):
    """Create dev users if they don't exist and return their access tokens."""
    results = []
    for data in _SEED_USERS:
        result = await db.execute(select(User).where(User.google_id == data["google_id"]))
        user = result.scalar_one_or_none()
        if not user:
            user = User(**data)
            db.add(user)
            await db.commit()
            await db.refresh(user)

        tokens = _make_tokens(user)
        results.append(
            {
                "user": UserResponse.model_validate(user).model_dump(mode="json"),
                "access_token": tokens["access_token"],
            }
        )

    return {"seeded": results}
