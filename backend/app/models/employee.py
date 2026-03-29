import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.skill import Skill, employee_skills


class Employee(BaseModel):
    __tablename__ = "employees"

    employee_number: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        default=None,
        index=True,
    )
    joining_date: Mapped[date] = mapped_column(Date)
    total_experience: Mapped[Decimal] = mapped_column(Numeric(precision=5, scale=2))
    team_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("teams.id", ondelete="SET NULL"),
        nullable=True,
        default=None,
        index=True,
    )
    designation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("designations.id", ondelete="SET NULL"),
        nullable=True,
        default=None,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    last_appraisal_cycle: Mapped[str | None] = mapped_column(String, nullable=True, default=None)

    skills: Mapped[list[Skill]] = relationship(
        Skill,
        secondary=employee_skills,
        lazy="selectin",
    )
