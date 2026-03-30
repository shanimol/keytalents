import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_role
from app.models.user import User, UserRole
from app.schemas.designation import (
    DesignationCreate,
    DesignationListResponse,
    DesignationResponse,
    DesignationUpdate,
)
from app.services import designation as svc

router = APIRouter()

_admin = Depends(require_role(UserRole.admin))


@router.post("", response_model=DesignationResponse, status_code=201)
async def create_designation(
    body: DesignationCreate,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.create_designation(db, body)


@router.get("", response_model=DesignationListResponse)
async def list_designations(
    search: str | None = Query(None),
    sort_dir: str = Query("asc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.get_designations(
        db,
        search=search,
        sort_dir=sort_dir,
        page=page,
        per_page=per_page,
    )


@router.get("/{designation_id}", response_model=DesignationResponse)
async def get_designation(
    designation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.get_designation_by_id(db, designation_id)


@router.put("/{designation_id}", response_model=DesignationResponse)
async def update_designation(
    designation_id: uuid.UUID,
    body: DesignationUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.update_designation(db, designation_id, body)


@router.delete("/{designation_id}", status_code=204)
async def delete_designation(
    designation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    await svc.delete_designation(db, designation_id)
