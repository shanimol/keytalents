from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth as auth_api
from app.api.v1.router import router as v1_router
from app.config import settings

app = FastAPI(title="KeyTalent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(v1_router)
app.include_router(auth_api.router, prefix="/api/auth", tags=["auth"])

if settings.is_development:
    from app.api import dev as dev_api
    app.include_router(dev_api.router, prefix="/api/dev", tags=["dev"])
