"""create appraisal_form_templates and template_designation_mappings tables

Revision ID: e1b3f8c2d047
Revises: d9a4c7e3f812
Create Date: 2026-03-29 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "e1b3f8c2d047"
down_revision: Union[str, None] = "d9a4c7e3f812"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create appraisal_form_templates table
    # (Alembic auto-creates the templatestatus enum when it encounters the Enum column)
    op.create_table(
        "appraisal_form_templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("draft", "active", "archived", name="templatestatus"),
            nullable=False,
            server_default="draft",
        ),
        sa.Column("structure_json", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column(
            "created_by_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "updated_by_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_appraisal_form_templates_name", "appraisal_form_templates", ["name"])

    # Create template_designation_mappings table
    op.create_table(
        "template_designation_mappings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "template_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("appraisal_form_templates.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "designation_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("designations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("designation_id", name="uq_template_designation_mapping_designation"),
    )
    op.create_index("ix_template_designation_mappings_template_id", "template_designation_mappings", ["template_id"])
    op.create_index("ix_template_designation_mappings_designation_id", "template_designation_mappings", ["designation_id"])


def downgrade() -> None:
    op.drop_index("ix_template_designation_mappings_designation_id", table_name="template_designation_mappings")
    op.drop_index("ix_template_designation_mappings_template_id", table_name="template_designation_mappings")
    op.drop_table("template_designation_mappings")
    op.drop_index("ix_appraisal_form_templates_name", table_name="appraisal_form_templates")
    op.drop_table("appraisal_form_templates")
    op.execute("DROP TYPE IF EXISTS templatestatus")
