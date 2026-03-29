import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_role
from app.models.designation import Designation
from app.models.team import Team
from app.models.user import User, UserRole
from app.schemas.employee import (
    DesignationResponse,
    EmployeeCreate,
    EmployeeListResponse,
    EmployeeResponse,
    EmployeeUpdate,
    SkillResponse,
    TeamResponse,
)
from app.services import employee as svc
from sqlalchemy import select

router = APIRouter()

_admin = Depends(require_role(UserRole.admin))


# ---------------------------------------------------------------------------
# Reference data — used to populate dropdowns (admin-only)
# ---------------------------------------------------------------------------

@router.get("/skills", response_model=list[SkillResponse])
async def list_skills(
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.get_skills(db)


@router.get("/teams", response_model=list[TeamResponse])
async def list_teams(
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    result = await db.execute(select(Team).order_by(Team.name))
    return result.scalars().all()


@router.get("/designations", response_model=list[DesignationResponse])
async def list_designations(
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    result = await db.execute(
        select(Designation).where(Designation.is_active.is_(True)).order_by(Designation.title)
    )
    return result.scalars().all()


# ---------------------------------------------------------------------------
# Employees CRUD
# ---------------------------------------------------------------------------

@router.post("", response_model=EmployeeResponse, status_code=201)
async def create_employee(
    body: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.create_employee(db, body)


@router.get("", response_model=EmployeeListResponse)
async def list_employees(
    search: str | None = Query(None),
    is_active: bool | None = Query(None),
    team_id: uuid.UUID | None = Query(None),
    designation_id: uuid.UUID | None = Query(None),
    sort_by: str = Query("name", pattern="^(name|email|joining_date)$"),
    sort_dir: str = Query("asc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.get_employees(
        db,
        search=search,
        is_active=is_active,
        team_id=team_id,
        designation_id=designation_id,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        per_page=per_page,
    )


@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.get_employee_by_id(db, employee_id)


@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: uuid.UUID,
    body: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.update_employee(db, employee_id, body)


@router.patch("/{employee_id}/deactivate", response_model=EmployeeResponse)
async def toggle_active(
    employee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.deactivate_employee(db, employee_id)


@router.delete("/{employee_id}", status_code=204)
async def delete_employee(
    employee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    await svc.delete_employee(db, employee_id)
