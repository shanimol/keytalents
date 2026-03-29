import enum

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class UserRole(str, enum.Enum):
    admin = "admin"
    employee = "employee"
    lead = "lead"


class User(BaseModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="userrole"))
    google_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
