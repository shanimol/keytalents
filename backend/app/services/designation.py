import uuid

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.designation import Designation
from app.models.employee import Employee
from app.schemas.designation import (
    DesignationCreate,
    DesignationListResponse,
    DesignationResponse,
    DesignationUpdate,
)


def _designation_query():
    """Select Designation + employee count via LEFT JOIN."""
    return (
        select(
            Designation,
            func.count(Employee.id).label("member_count"),
        )
        .outerjoin(Employee, Employee.designation_id == Designation.id)
        .group_by(Designation.id)
    )


def _build_response(row: object) -> DesignationResponse:
    designation: Designation = row[0]
    member_count: int = row[1]
    return DesignationResponse(
        id=designation.id,
        name=designation.name,
        created_at=designation.created_at,
        member_count=member_count,
    )


async def get_designations(
    db: AsyncSession,
    *,
    search: str | None = None,
    sort_dir: str = "asc",
    page: int = 1,
    per_page: int = 10,
) -> DesignationListResponse:
    q = _designation_query()

    if search:
        q = q.where(Designation.name.ilike(f"%{search}%"))

    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar_one()

    order = Designation.name.desc() if sort_dir == "desc" else Designation.name.asc()
    q = q.order_by(order).offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(q)).all()

    return DesignationListResponse(
        items=[_build_response(row) for row in rows],
        total=total,
        page=page,
        per_page=per_page,
    )


async def get_designation_by_id(db: AsyncSession, designation_id: uuid.UUID) -> DesignationResponse:
    q = _designation_query().where(Designation.id == designation_id)
    row = (await db.execute(q)).one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Designation not found")
    return _build_response(row)


async def create_designation(db: AsyncSession, data: DesignationCreate) -> DesignationResponse:
    existing = await db.execute(select(Designation).where(Designation.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A designation with this name already exists")

    designation = Designation(name=data.name)
    db.add(designation)
    await db.commit()
    await db.refresh(designation)
    return await get_designation_by_id(db, designation.id)


async def update_designation(
    db: AsyncSession, designation_id: uuid.UUID, data: DesignationUpdate
) -> DesignationResponse:
    result = await db.execute(select(Designation).where(Designation.id == designation_id))
    designation = result.scalar_one_or_none()
    if not designation:
        raise HTTPException(status_code=404, detail="Designation not found")

    conflict = await db.execute(
        select(Designation).where(Designation.name == data.name, Designation.id != designation_id)
    )
    if conflict.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A designation with this name already exists")

    designation.name = data.name
    await db.commit()
    await db.refresh(designation)
    return await get_designation_by_id(db, designation_id)


async def delete_designation(db: AsyncSession, designation_id: uuid.UUID) -> None:
    result = await db.execute(select(Designation).where(Designation.id == designation_id))
    designation = result.scalar_one_or_none()
    if not designation:
        raise HTTPException(status_code=404, detail="Designation not found")
    await db.delete(designation)
    await db.commit()
