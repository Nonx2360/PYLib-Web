from datetime import date

from pydantic import BaseModel, Field, model_validator


class MemberBase(BaseModel):
    full_name: str
    member_type: str = Field(pattern="^(student|staff)$", description="Member type label")


class MemberCreate(MemberBase):
    member_id: str
    national_id: str = Field(min_length=6)
    username: str | None = None
    password: str | None = None

    @model_validator(mode="after")
    def enforce_staff_credentials(self) -> "MemberCreate":
        if self.member_type == "staff":
            if not self.username or not self.password:
                raise ValueError("Staff members require username and password")
        return self


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
