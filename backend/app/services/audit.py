from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.log import AuditLog


async def record_log(session: AsyncSession, user_id: str, action: str, details: dict[str, Any] | None = None) -> None:
    log = AuditLog(user_id=user_id, action=action, details=details)
    session.add(log)
