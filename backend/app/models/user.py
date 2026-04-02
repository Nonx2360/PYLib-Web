from datetime import datetime
import uuid
from enum import Enum

from sqlalchemy import Column, DateTime, String

from app.db.session import Base


class UserRole(str, Enum):
    ADMIN = "admin"
    STAFF = "staff"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.STAFF.value, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
