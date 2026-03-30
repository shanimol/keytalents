import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class TemplateStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    archived = "archived"


class AppraisalFormTemplate(BaseModel):
    __tablename__ = "appraisal_form_templates"

    name: Mapped[str] = mapped_column(String, index=True)
    status: Mapped[TemplateStatus] = mapped_column(
        Enum(TemplateStatus, name="templatestatus"),
        server_default=TemplateStatus.draft.value,
    )
    structure_json: Mapped[dict] = mapped_column(JSONB, server_default="{}")
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        default=None,
    )
    updated_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        default=None,
    )


class TemplateDesignationMapping(BaseModel):
    __tablename__ = "template_designation_mappings"

    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("appraisal_form_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    designation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("designations.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
