import uuid
from typing import Any

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.appraisal_template import AppraisalFormTemplate, TemplateDesignationMapping, TemplateStatus
from app.models.designation import Designation
from app.schemas.appraisal_template import (
    DesignationMappingRequest,
    TemplateCreate,
    TemplateCopyRequest,
    TemplateListResponse,
    TemplateResponse,
    TemplateDesignationInfo,
    TemplateUpdate,
)


async def _get_template_or_404(db: AsyncSession, template_id: uuid.UUID) -> AppraisalFormTemplate:
    result = await db.execute(
        select(AppraisalFormTemplate).where(AppraisalFormTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


async def _get_designations_for_template(
    db: AsyncSession, template_id: uuid.UUID
) -> list[TemplateDesignationInfo]:
    result = await db.execute(
        select(Designation)
        .join(TemplateDesignationMapping, TemplateDesignationMapping.designation_id == Designation.id)
        .where(TemplateDesignationMapping.template_id == template_id)
        .order_by(Designation.name)
    )
    designations = result.scalars().all()
    return [TemplateDesignationInfo(id=d.id, name=d.name) for d in designations]


async def _build_response(db: AsyncSession, template: AppraisalFormTemplate) -> TemplateResponse:
    designations = await _get_designations_for_template(db, template.id)
    return TemplateResponse(
        id=template.id,
        name=template.name,
        status=template.status.value,
        structure_json=template.structure_json or {},
        created_by_id=template.created_by_id,
        updated_by_id=template.updated_by_id,
        created_at=template.created_at,
        updated_at=template.updated_at,
        designations=designations,
    )


async def get_templates(
    db: AsyncSession,
    *,
    search: str | None = None,
    status: str | None = None,
    page: int = 1,
    per_page: int = 10,
) -> TemplateListResponse:
    q = select(AppraisalFormTemplate)

    if search:
        q = q.where(AppraisalFormTemplate.name.ilike(f"%{search}%"))
    if status:
        try:
            q = q.where(AppraisalFormTemplate.status == TemplateStatus(status))
        except ValueError:
            pass

    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar_one()

    q = q.order_by(AppraisalFormTemplate.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    templates = (await db.execute(q)).scalars().all()

    items = [await _build_response(db, t) for t in templates]
    return TemplateListResponse(items=items, total=total, page=page, per_page=per_page)


async def get_template_by_id(db: AsyncSession, template_id: uuid.UUID) -> TemplateResponse:
    template = await _get_template_or_404(db, template_id)
    return await _build_response(db, template)


async def create_template(
    db: AsyncSession,
    data: TemplateCreate,
    current_user_id: uuid.UUID,
) -> TemplateResponse:
    template = AppraisalFormTemplate(
        name=data.name,
        status=TemplateStatus.draft,
        structure_json=data.structure_json,
        created_by_id=current_user_id,
        updated_by_id=current_user_id,
    )
    db.add(template)
    await db.flush()  # get ID without committing

    # Map designations if provided
    for designation_id in data.designation_ids:
        await _map_designation_inner(db, template.id, designation_id)

    await db.commit()
    await db.refresh(template)
    return await _build_response(db, template)


async def update_template(
    db: AsyncSession,
    template_id: uuid.UUID,
    data: TemplateUpdate,
    current_user_id: uuid.UUID,
) -> TemplateResponse:
    template = await _get_template_or_404(db, template_id)

    if template.status == TemplateStatus.archived:
        raise HTTPException(status_code=409, detail="Cannot edit an archived template")

    if data.name is not None:
        template.name = data.name
    if data.structure_json is not None:
        template.structure_json = data.structure_json
    template.updated_by_id = current_user_id

    await db.commit()
    await db.refresh(template)
    return await _build_response(db, template)


async def activate_template(db: AsyncSession, template_id: uuid.UUID) -> TemplateResponse:
    template = await _get_template_or_404(db, template_id)
    template.status = TemplateStatus.active
    await db.commit()
    await db.refresh(template)
    return await _build_response(db, template)


async def archive_template(db: AsyncSession, template_id: uuid.UUID) -> TemplateResponse:
    template = await _get_template_or_404(db, template_id)
    template.status = TemplateStatus.archived
    await db.commit()
    await db.refresh(template)
    return await _build_response(db, template)


async def delete_template(db: AsyncSession, template_id: uuid.UUID) -> None:
    template = await _get_template_or_404(db, template_id)

    if template.status != TemplateStatus.draft:
        raise HTTPException(status_code=409, detail="Only draft templates can be deleted")

    # Check if any designations are mapped
    mapping_count = (await db.execute(
        select(func.count()).where(TemplateDesignationMapping.template_id == template_id)
    )).scalar_one()
    if mapping_count > 0:
        raise HTTPException(status_code=409, detail="Cannot delete a template that is mapped to designations")

    await db.delete(template)
    await db.commit()


async def copy_template(
    db: AsyncSession,
    source_id: uuid.UUID,
    data: TemplateCopyRequest,
    current_user_id: uuid.UUID,
) -> TemplateResponse:
    source = await _get_template_or_404(db, source_id)

    new_template = AppraisalFormTemplate(
        name=data.name,
        status=TemplateStatus.draft,
        structure_json=source.structure_json,
        created_by_id=current_user_id,
        updated_by_id=current_user_id,
    )
    db.add(new_template)
    await db.commit()
    await db.refresh(new_template)
    return await _build_response(db, new_template)


async def _map_designation_inner(
    db: AsyncSession, template_id: uuid.UUID, designation_id: uuid.UUID
) -> None:
    """Inner helper — checks for existing mapping and inserts."""
    existing = await db.execute(
        select(TemplateDesignationMapping).where(
            TemplateDesignationMapping.designation_id == designation_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="This designation already has a template assigned",
        )
    mapping = TemplateDesignationMapping(template_id=template_id, designation_id=designation_id)
    db.add(mapping)


async def map_designation(
    db: AsyncSession,
    template_id: uuid.UUID,
    data: DesignationMappingRequest,
) -> TemplateResponse:
    await _get_template_or_404(db, template_id)
    await _map_designation_inner(db, template_id, data.designation_id)
    await db.commit()
    template = await _get_template_or_404(db, template_id)
    return await _build_response(db, template)


async def unmap_designation(
    db: AsyncSession,
    template_id: uuid.UUID,
    designation_id: uuid.UUID,
) -> TemplateResponse:
    await _get_template_or_404(db, template_id)

    result = await db.execute(
        select(TemplateDesignationMapping).where(
            TemplateDesignationMapping.template_id == template_id,
            TemplateDesignationMapping.designation_id == designation_id,
        )
    )
    mapping = result.scalar_one_or_none()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")

    await db.delete(mapping)
    await db.commit()
    template = await _get_template_or_404(db, template_id)
    return await _build_response(db, template)
