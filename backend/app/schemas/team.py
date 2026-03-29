from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


class TeamCreate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Team name cannot be empty")
        return v.strip()


class TeamUpdate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Team name cannot be empty")
        return v.strip()


class TeamResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime
    member_count: int = 0

    model_config = {"from_attributes": True}


class TeamListResponse(BaseModel):
    items: list[TeamResponse]
    total: int
    page: int
    per_page: int
