from datetime import datetime
from typing import Any

from pydantic import BaseModel


class AuditLogRead(BaseModel):
    id: int
    user_id: str
    action: str
    details: dict[str, Any] | None = None
    timestamp: datetime

    class Config:
        from_attributes = True
