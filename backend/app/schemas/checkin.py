from datetime import datetime

from pydantic import BaseModel, Field


class CheckInRequest(BaseModel):
    member_id: str = Field(min_length=3)
    code: str = Field(min_length=4)


class CheckInRead(BaseModel):
    id: int
    member_id: str
    member_name: str
    staff_username: str | None
    method: str
    created_at: datetime

    class Config:
        from_attributes = True
