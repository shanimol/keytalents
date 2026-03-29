"""simplify teams table: remove description and is_active columns

Revision ID: c6f3a9d2b1e7
Revises: b5e2d8f1c490
Create Date: 2026-03-29 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c6f3a9d2b1e7"
down_revision: Union[str, None] = "b5e2d8f1c490"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("teams", "description")
    op.drop_column("teams", "is_active")


def downgrade() -> None:
    op.add_column(
        "teams",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.add_column(
        "teams",
        sa.Column("description", sa.String(), nullable=True),
    )
