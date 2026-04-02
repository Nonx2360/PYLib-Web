from fastapi import FastAPI
from sqlalchemy import select

from app.core.security import get_password_hash
from app.db.session import SessionLocal, Base, engine
from app.models.member import Member
from app.models.user import User
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import api_router
from app.core.config import get_settings
from app.services.totp import generate_totp_secret


settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(api_router, prefix="/api/v1")


async def _run_migrations() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.on_event("startup")
async def ensure_default_admin() -> None:
    await _run_migrations()
    async with SessionLocal() as session:
        result = await session.execute(select(User).limit(1))
        if not result.scalar_one_or_none():
            user = User(
                username=settings.default_admin_username,
                password_hash=get_password_hash(settings.default_admin_password),
                role="admin",
            )
            session.add(user)
            await session.commit()

        members_stmt = select(Member).where(Member.totp_secret.is_(None))
        missing_members = (await session.execute(members_stmt)).scalars().all()
        if missing_members:
            for member in missing_members:
                member.totp_secret = generate_totp_secret()
            await session.commit()
