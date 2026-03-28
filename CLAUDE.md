# KeyTalent

Employee appraisal platform.

## Stack
- **Backend**: FastAPI + SQLAlchemy 2.0 async + PostgreSQL + Alembic
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + Redux Toolkit (RTK Query)
- **Infrastructure**: Docker Compose

## Structure
```
keytalents/
├── backend/          # FastAPI app
├── frontend/         # React + Vite app
├── docker-compose.yml
└── .env.example
```

## Development
```bash
cp .env.example .env
# Fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SECRET_KEY
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

## Conventions

### Backend
- snake_case for Python identifiers
- async/await everywhere (no sync SQLAlchemy calls)
- UUID primary keys on all models, inherited from `BaseModel` in `app/models/base.py`
- API routes under `/api/v1/`
- Settings read from env vars via `app/config.py` (pydantic-settings)

### Frontend
- PascalCase for React components, camelCase for functions/variables
- Named exports for pages and components
- RTK Query slices in `src/services/` (inject into base `api` slice)
- Redux feature slices in `src/store/slices/`
- Path alias `@/` maps to `src/`
- Use `useAppDispatch` / `useAppSelector` typed hooks, never raw `useDispatch`/`useSelector`
