from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Designation(BaseModel):
    __tablename__ = "designations"

    title: Mapped[str] = mapped_column(String)
    department: Mapped[str] = mapped_column(String)  # e.g. "Engineering" — drives badge color
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
