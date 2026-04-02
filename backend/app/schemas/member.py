from datetime import date

from pydantic import BaseModel, Field


class MemberBase(BaseModel):
    full_name: str
    member_type: str = Field(pattern="^(student|teacher)$", description="Member type label")


class MemberCreate(MemberBase):
    member_id: str
    national_id: str = Field(min_length=6)


class MemberUpdate(BaseModel):
    full_name: str | None = None
    member_type: str | None = None


class MemberRead(MemberBase):
    member_id: str
    joined_date: date
    qr_code_path: str | None = None
    national_id: str | None = None

    class Config:
        from_attributes = True
