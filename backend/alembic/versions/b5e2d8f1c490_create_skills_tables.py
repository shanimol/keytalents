"""create skills and employee_skills tables

Revision ID: b5e2d8f1c490
Revises: a3c7f1d2e845
Create Date: 2026-03-28 00:00:00.000000

"""

from typing import Sequence, Union
import uuid

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "b5e2d8f1c490"
down_revision: Union[str, None] = "a3c7f1d2e845"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SKILLS = [
    ".NET", "AI", "Android Kotlin", "Angular", "Automation", "AWS",
    "Blockchain", "C#", "Compliance", "C++", "CSS", "Dart", "Data",
    "Deep Learning", "DevOps", "Docker", "Ethereum", "FastAPI", "Flutter",
    "Go", "Golang", "HTML", "iOS", "Java", "JavaScript", "Kotlin",
    "LangChain", "LangGraph", "LLM", "Machine Learning", "Manual Testing",
    "NestJS", "Next.js", "Node.js", "Playwright", "PM", "Postman", "PWA",
    "Python", "React", "React Native", "Redux", "RoR", "Salesforce",
    "Scala", "Security", "Solidity", "Spring", "Spring Boot", "Swift",
    "Tailwind", "Terraform", "TypeORM", "TypeScript", "Video", "Vue.js",
    "Webflow", "Writing",
]


def upgrade() -> None:
    # --- skills ---
    op.create_table(
        "skills",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_skills_name"),
    )
    op.create_index("ix_skills_name", "skills", ["name"])

    # --- employee_skills join table ---
    op.create_table(
        "employee_skills",
        sa.Column(
            "employee_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("employees.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "skill_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("skills.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("employee_id", "skill_id"),
    )

    # --- seed skills (deduplicated) ---
    skills_table = sa.table(
        "skills",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String),
    )
    seen: set[str] = set()
    rows = []
    for name in SKILLS:
        if name not in seen:
            seen.add(name)
            rows.append({"id": uuid.uuid4(), "name": name})
    op.bulk_insert(skills_table, rows)

    # --- drop legacy JSONB skill_set column ---
    op.drop_column("employees", "skill_set")


def downgrade() -> None:
    # Restore skill_set column
    op.add_column(
        "employees",
        sa.Column(
            "skill_set",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )
    op.drop_table("employee_skills")
    op.drop_index("ix_skills_name", table_name="skills")
    op.drop_table("skills")
