from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, field_validator


class TemplateDesignationInfo(BaseModel):
    id: UUID
    name: str

    model_config = {"from_attributes": True}


class TemplateCreate(BaseModel):
    name: str
    structure_json: dict[str, Any] = {}
    designation_ids: list[UUID] = []

    @field_validator("name")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Template name cannot be empty")
        return v.strip()


class TemplateUpdate(BaseModel):
    name: str | None = None
    structure_json: dict[str, Any] | None = None

    @field_validator("name")
    @classmethod
    def not_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Template name cannot be empty")
        return v.strip() if v else v


class TemplateCopyRequest(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Template name cannot be empty")
        return v.strip()


class DesignationMappingRequest(BaseModel):
    designation_id: UUID


class TemplateResponse(BaseModel):
    id: UUID
    name: str
    status: str
    structure_json: dict[str, Any]
    created_by_id: UUID | None
    updated_by_id: UUID | None
    created_at: datetime
    updated_at: datetime
    designations: list[TemplateDesignationInfo] = []

    model_config = {"from_attributes": True}


class TemplateListResponse(BaseModel):
    items: list[TemplateResponse]
    total: int
    page: int
    per_page: int
