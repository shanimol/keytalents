import uuid

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee import Employee
from app.models.team import Team
from app.schemas.team import TeamCreate, TeamListResponse, TeamResponse, TeamUpdate


def _team_query():
    """Select Team + employee count via LEFT JOIN."""
    return (
        select(
            Team,
            func.count(Employee.id).label("member_count"),
        )
        .outerjoin(Employee, Employee.team_id == Team.id)
        .group_by(Team.id)
    )


def _build_response(row: object) -> TeamResponse:
    team: Team = row[0]
    member_count: int = row[1]
    return TeamResponse(
        id=team.id,
        name=team.name,
        created_at=team.created_at,
        member_count=member_count,
    )


async def get_teams(
    db: AsyncSession,
    *,
    search: str | None = None,
    sort_dir: str = "asc",
    page: int = 1,
    per_page: int = 10,
) -> TeamListResponse:
    q = _team_query()

    if search:
        q = q.where(Team.name.ilike(f"%{search}%"))

    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar_one()

    order = Team.name.desc() if sort_dir == "desc" else Team.name.asc()
    q = q.order_by(order).offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(q)).all()

    return TeamListResponse(
        items=[_build_response(row) for row in rows],
        total=total,
        page=page,
        per_page=per_page,
    )


async def get_team_by_id(db: AsyncSession, team_id: uuid.UUID) -> TeamResponse:
    q = _team_query().where(Team.id == team_id)
    row = (await db.execute(q)).one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Team not found")
    return _build_response(row)


async def create_team(db: AsyncSession, data: TeamCreate) -> TeamResponse:
    existing = await db.execute(select(Team).where(Team.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A team with this name already exists")

    team = Team(name=data.name)
    db.add(team)
    await db.commit()
    await db.refresh(team)
    return await get_team_by_id(db, team.id)


async def update_team(
    db: AsyncSession, team_id: uuid.UUID, data: TeamUpdate
) -> TeamResponse:
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    conflict = await db.execute(
        select(Team).where(Team.name == data.name, Team.id != team_id)
    )
    if conflict.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A team with this name already exists")

    team.name = data.name
    await db.commit()
    await db.refresh(team)
    return await get_team_by_id(db, team_id)


async def delete_team(db: AsyncSession, team_id: uuid.UUID) -> None:
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    await db.delete(team)
    await db.commit()
