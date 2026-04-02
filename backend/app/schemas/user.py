from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class UserRole(str, Enum):
    admin = "admin"
    staff = "staff"


class UserBase(BaseModel):
    username: str
    role: UserRole = UserRole.staff


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
