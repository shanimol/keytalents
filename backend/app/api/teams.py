import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_role
from app.models.user import User, UserRole
from app.schemas.team import TeamCreate, TeamListResponse, TeamResponse, TeamUpdate
from app.services import team as svc

router = APIRouter()

_admin = Depends(require_role(UserRole.admin))


@router.post("", response_model=TeamResponse, status_code=201)
async def create_team(
    body: TeamCreate,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.create_team(db, body)


@router.get("", response_model=TeamListResponse)
async def list_teams(
    search: str | None = Query(None),
    sort_dir: str = Query("asc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.get_teams(
        db,
        search=search,
        sort_dir=sort_dir,
        page=page,
        per_page=per_page,
    )


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.get_team_by_id(db, team_id)


@router.put("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: uuid.UUID,
    body: TeamUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    return await svc.update_team(db, team_id, body)


@router.delete("/{team_id}", status_code=204)
async def delete_team(
    team_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = _admin,
):
    await svc.delete_team(db, team_id)
