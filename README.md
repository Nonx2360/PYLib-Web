# Smart Library Web App

Modernized edition of the Smart Library project with a FastAPI backend and a React + TypeScript frontend. The project is split into two workspaces:

- `backend/`: FastAPI service with async SQLAlchemy, JWT auth, AES-encrypted member fields, QR/PDF utilities, and modular routers that mirror the migration plan.
- `frontend/`: Vite-powered React 18 client that implements the dashboard, member management, inventory, and loan terminal flows using React Query, Zustand, and CSS Modules.

## Backend

### Install dependencies
```bash
cd backend
python -m venv .venv
# On Windows use: .venv\Scripts\activate
# On macOS/Linux use: source .venv/bin/activate
pip install -e .
```
Prefer Poetry/uv/pip-tools? Point them at the included `pyproject.toml` and you're set.

### Environment variables
Create `backend/.env` (values below mirror the defaults and target a local SQLite database):
```
SECRET_KEY=change-me
DATABASE_URL=sqlite+aiosqlite:///./smart_library.db
CORS_ORIGINS=["http://localhost:5173"]
ENCRYPTION_SECRET=library-encryption-key
HMAC_SECRET=library-hmac-secret
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=changeme123
```
Drop the Sarabun `.ttf` font under `backend/resources/fonts/THSarabunNew.ttf` (or change `sarabun_font_path` in `app/core/config.py`).

### Run
```bash
uvicorn app.main:app --reload --port 8000
```
Migrations can be managed with Alembic (configured via `sqlalchemy` Base in `app/db/session.py`).

## Frontend

### Install dependencies
```bash
cd frontend
npm install
```

### Configure env
Copy `.env.example` to `.env` and tweak `VITE_API_URL` if the API base path changes.

### Run
```bash
npm run dev
```
Vite serves on `http://localhost:5173` by default.

## Features Implemented
- JWT auth with refresh + password hashing.
- AES-256 + HMAC member data protection with QR generation utility.
- Members, Books, Loans, and Reports routers covering the required endpoints.
- React dashboard with status cards, Recharts visualization, member management CRUD, inventory admin, and loan terminal with QR scanning.
- Shared UI primitives (buttons, tables, QR scanner, layouts) following the "Modern Library Dark" palette.
- On startup the API seeds an admin account (`DEFAULT_ADMIN_USERNAME` / `DEFAULT_ADMIN_PASSWORD`) if none exist, making first-run logins easy.
- Staff can download ready-to-print member cards in PDF form directly from the Member Management page (served by `/api/v1/members/{id}/card.pdf`).
- Responsive layout/hamburger-friendly navigation ensures the app works on tablets and smaller laptops without horizontal scrolling.
