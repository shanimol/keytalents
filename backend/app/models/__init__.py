# Import all models here so Alembic can discover them via Base.metadata
from app.models.appraisal_template import AppraisalFormTemplate, TemplateDesignationMapping  # noqa: F401
from app.models.designation import Designation  # noqa: F401
from app.models.employee import Employee  # noqa: F401
from app.models.skill import Skill, employee_skills  # noqa: F401
from app.models.team import Team  # noqa: F401
from app.models.user import User  # noqa: F401
