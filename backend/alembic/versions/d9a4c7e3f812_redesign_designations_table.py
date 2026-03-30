"""redesign designations table: replace title/department/is_active with name, seed data

Revision ID: d9a4c7e3f812
Revises: c6f3a9d2b1e7
Create Date: 2026-03-29 00:00:00.000000

"""

from typing import Sequence, Union
import uuid

import sqlalchemy as sa
from alembic import op

revision: str = "d9a4c7e3f812"
down_revision: Union[str, None] = "c6f3a9d2b1e7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DESIGNATIONS = [
    "Associate",
    "Software Engineer",
    "Senior Software Engineer",
    "Associate Technical Lead",
    "Technical Lead",
    "Senior Technical Lead",
    "Associate Product Architect",
    "Product Architect",
    "Associate Engineering Manager",
    "Engineering Manager",
    "Quality Assurance Engineer",
    "Senior Quality Assurance Engineer",
    "Product Designer",
    "Devops Engineer",
]


def upgrade() -> None:
    # Add name column (nullable first, populate, then make non-null)
    op.add_column("designations", sa.Column("name", sa.String(), nullable=True))

    # Migrate existing data: copy title → name
    op.execute("UPDATE designations SET name = title")

    # Make name non-null
    op.alter_column("designations", "name", nullable=False)

    # Drop old columns
    op.drop_column("designations", "title")
    op.drop_column("designations", "department")
    op.drop_column("designations", "is_active")

    # Add unique constraint and index on name
    op.create_unique_constraint("uq_designations_name", "designations", ["name"])
    op.create_index("ix_designations_name", "designations", ["name"])

    # Seed 14 designations (skip if name already exists from migrated data)
    designations_table = sa.table(
        "designations",
        sa.column("id", sa.dialects.postgresql.UUID(as_uuid=True) if hasattr(sa, "dialects") else sa.String),
        sa.column("name", sa.String),
    )

    # Use raw SQL to insert only names that don't already exist
    conn = op.get_bind()
    existing = {row[0] for row in conn.execute(sa.text("SELECT name FROM designations"))}
    rows = [
        {"id": uuid.uuid4(), "name": name}
        for name in DESIGNATIONS
        if name not in existing
    ]
    if rows:
        op.bulk_insert(designations_table, rows)


def downgrade() -> None:
    op.drop_index("ix_designations_name", table_name="designations")
    op.drop_constraint("uq_designations_name", "designations", type_="unique")
    op.add_column("designations", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.add_column("designations", sa.Column("department", sa.String(), nullable=False, server_default=""))
    op.add_column("designations", sa.Column("title", sa.String(), nullable=True))
    op.execute("UPDATE designations SET title = name")
    op.alter_column("designations", "title", nullable=False)
    op.drop_column("designations", "name")
