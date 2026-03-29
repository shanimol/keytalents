from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator


class SkillResponse(BaseModel):
    id: UUID
    name: str

    model_config = {"from_attributes": True}


class EmployeeCreate(BaseModel):
    employee_number: str
    name: str
    email: EmailStr
    joining_date: date
    total_experience: Decimal
    skill_ids: list[UUID] = []
    team_id: UUID | None = None
    designation_id: UUID | None = None
    last_appraisal_cycle: str | None = None

    @field_validator("employee_number", "name")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()

    @field_validator("total_experience")
    @classmethod
    def non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Total experience cannot be negative")
        return v


class EmployeeUpdate(BaseModel):
    employee_number: str | None = None
    name: str | None = None
    email: EmailStr | None = None
    joining_date: date | None = None
    total_experience: Decimal | None = None
    skill_ids: list[UUID] | None = None
    team_id: UUID | None = None
    designation_id: UUID | None = None
    last_appraisal_cycle: str | None = None
    is_active: bool | None = None


class EmployeeResponse(BaseModel):
    id: UUID
    employee_number: str
    name: str
    email: str
    user_id: UUID | None
    joining_date: date
    total_experience: Decimal
    skills: list[SkillResponse] = []
    team_id: UUID | None
    designation_id: UUID | None
    is_active: bool
    last_appraisal_cycle: str | None
    created_at: datetime
    updated_at: datetime
    # resolved via JOIN
    team_name: str | None = None
    designation_title: str | None = None
    department: str | None = None

    model_config = {"from_attributes": True}


class EmployeeListResponse(BaseModel):
    items: list[EmployeeResponse]
    total: int
    page: int
    per_page: int


class TeamResponse(BaseModel):
    id: UUID
    name: str

    model_config = {"from_attributes": True}


class DesignationResponse(BaseModel):
    id: UUID
    title: str
    department: str
    is_active: bool

    model_config = {"from_attributes": True}
