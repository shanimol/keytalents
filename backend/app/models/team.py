from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Team(BaseModel):
    __tablename__ = "teams"

    name: Mapped[str] = mapped_column(String, unique=True, index=True)
