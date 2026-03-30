import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_role
from app.models.user import User, UserRole
from app.schemas.appraisal_template import (
    DesignationMappingRequest,
    TemplateCreate,
    TemplateCopyRequest,
    TemplateListResponse,
    TemplateResponse,
    TemplateUpdate,
)
from app.services import appraisal_template as svc

router = APIRouter()

_admin = Depends(require_role(UserRole.admin))


@router.post("", response_model=TemplateResponse, status_code=201)
async def create_template(
    body: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    return await svc.create_template(db, body, current_user.id)


@router.get("", response_model=TemplateListResponse)
async def list_templates(
    search: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.get_templates(db, search=search, status=status, page=page, per_page=per_page)


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.get_template_by_id(db, template_id)


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: uuid.UUID,
    body: TemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    return await svc.update_template(db, template_id, body, current_user.id)


@router.delete("/{template_id}", status_code=204)
async def delete_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    await svc.delete_template(db, template_id)


@router.post("/{template_id}/activate", response_model=TemplateResponse)
async def activate_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.activate_template(db, template_id)


@router.post("/{template_id}/archive", response_model=TemplateResponse)
async def archive_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.archive_template(db, template_id)


@router.post("/{template_id}/copy", response_model=TemplateResponse, status_code=201)
async def copy_template(
    template_id: uuid.UUID,
    body: TemplateCopyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    return await svc.copy_template(db, template_id, body, current_user.id)


@router.post("/{template_id}/designations", response_model=TemplateResponse)
async def map_designation(
    template_id: uuid.UUID,
    body: DesignationMappingRequest,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.map_designation(db, template_id, body)


@router.delete("/{template_id}/designations/{designation_id}", response_model=TemplateResponse)
async def unmap_designation(
    template_id: uuid.UUID,
    designation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.unmap_designation(db, template_id, designation_id)
