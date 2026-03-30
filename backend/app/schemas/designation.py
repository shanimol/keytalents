from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


class DesignationCreate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Designation name cannot be empty")
        return v.strip()


class DesignationUpdate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Designation name cannot be empty")
        return v.strip()


class DesignationResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime
    member_count: int = 0

    model_config = {"from_attributes": True}


class DesignationListResponse(BaseModel):
    items: list[DesignationResponse]
    total: int
    page: int
    per_page: int
