import uuid
from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.designation import Designation
from app.models.employee import Employee
from app.models.skill import Skill
from app.models.team import Team
from app.schemas.employee import EmployeeCreate, EmployeeListResponse, EmployeeResponse, EmployeeUpdate, SkillResponse

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_response(row: object) -> EmployeeResponse:
    """Build EmployeeResponse from a SQLAlchemy Row with joined columns."""
    emp: Employee = row[0]
    team_name: str | None = row[1]
    designation_title: str | None = row[2]
    return EmployeeResponse(
        id=emp.id,
        employee_number=emp.employee_number,
        name=emp.name,
        email=emp.email,
        user_id=emp.user_id,
        joining_date=emp.joining_date,
        total_experience=emp.total_experience,
        skills=[SkillResponse(id=s.id, name=s.name) for s in emp.skills],
        team_id=emp.team_id,
        designation_id=emp.designation_id,
        is_active=emp.is_active,
        last_appraisal_cycle=emp.last_appraisal_cycle,
        created_at=emp.created_at,
        updated_at=emp.updated_at,
        team_name=team_name,
        designation_title=designation_title,
        department=None,
    )


def _joined_query():
    return (
        select(
            Employee,
            Team.name.label("team_name"),
            Designation.name.label("designation_title"),
        )
        .outerjoin(Team, Employee.team_id == Team.id)
        .outerjoin(Designation, Employee.designation_id == Designation.id)
    )


async def _load_skills(db: AsyncSession, skill_ids: list[uuid.UUID]) -> list[Skill]:
    if not skill_ids:
        return []
    result = await db.execute(select(Skill).where(Skill.id.in_(skill_ids)))
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

_SORT_COLUMNS = {
    "name": Employee.name,
    "email": Employee.email,
    "joining_date": Employee.joining_date,
}


async def get_employees(
    db: AsyncSession,
    *,
    search: str | None = None,
    is_active: bool | None = None,
    team_id: uuid.UUID | None = None,
    designation_id: uuid.UUID | None = None,
    sort_by: str = "name",
    sort_dir: str = "asc",
    page: int = 1,
    per_page: int = 10,
) -> EmployeeListResponse:
    q = _joined_query()

    if search:
        pattern = f"%{search}%"
        q = q.where(
            or_(
                Employee.name.ilike(pattern),
                Employee.email.ilike(pattern),
                Employee.employee_number.ilike(pattern),
            )
        )
    if is_active is not None:
        q = q.where(Employee.is_active == is_active)
    if team_id:
        q = q.where(Employee.team_id == team_id)
    if designation_id:
        q = q.where(Employee.designation_id == designation_id)

    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar_one()

    col = _SORT_COLUMNS.get(sort_by, Employee.name)
    order = col.desc() if sort_dir == "desc" else col.asc()
    q = q.order_by(order).offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(q)).all()

    return EmployeeListResponse(
        items=[_build_response(row) for row in rows],
        total=total,
        page=page,
        per_page=per_page,
    )


async def get_employee_by_id(db: AsyncSession, employee_id: uuid.UUID) -> EmployeeResponse:
    q = _joined_query().where(Employee.id == employee_id)
    row = (await db.execute(q)).one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Employee not found")
    return _build_response(row)


async def create_employee(db: AsyncSession, data: EmployeeCreate) -> EmployeeResponse:
    # Check unique constraints
    existing = await db.execute(
        select(Employee).where(
            or_(Employee.email == data.email, Employee.employee_number == data.employee_number)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409, detail="Employee with this email or employee number already exists"
        )

    skill_ids = data.skill_ids
    employee_data = data.model_dump(exclude={"skill_ids"})

    emp = Employee(**employee_data)
    emp.skills = await _load_skills(db, skill_ids)

    db.add(emp)
    await db.commit()
    await db.refresh(emp)
    return await get_employee_by_id(db, emp.id)


async def update_employee(
    db: AsyncSession, employee_id: uuid.UUID, data: EmployeeUpdate
) -> EmployeeResponse:
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    updates = data.model_dump(exclude_unset=True)

    # Check uniqueness if email or employee_number is being changed
    if "email" in updates or "employee_number" in updates:
        conflict = await db.execute(
            select(Employee).where(
                Employee.id != employee_id,
                or_(
                    Employee.email == updates.get("email", emp.email),
                    Employee.employee_number == updates.get("employee_number", emp.employee_number),
                ),
            )
        )
        if conflict.scalar_one_or_none():
            raise HTTPException(
                status_code=409,
                detail="Another employee with this email or employee number already exists",
            )

    # Handle skills separately
    if "skill_ids" in updates:
        skill_ids = updates.pop("skill_ids") or []
        emp.skills = await _load_skills(db, skill_ids)

    for field, value in updates.items():
        setattr(emp, field, value)

    await db.commit()
    await db.refresh(emp)
    return await get_employee_by_id(db, emp.id)


async def deactivate_employee(db: AsyncSession, employee_id: uuid.UUID) -> EmployeeResponse:
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp.is_active = not emp.is_active
    await db.commit()
    await db.refresh(emp)
    return await get_employee_by_id(db, emp.id)


async def delete_employee(db: AsyncSession, employee_id: uuid.UUID) -> None:
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    await db.delete(emp)
    await db.commit()


async def get_skills(db: AsyncSession) -> list[Skill]:
    result = await db.execute(select(Skill).order_by(Skill.name))
    return list(result.scalars().all())
