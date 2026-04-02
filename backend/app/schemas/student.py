from datetime import date

from pydantic import BaseModel, Field


class StudentProfile(BaseModel):
    member_id: str
    full_name: str
    member_type: str
    joined_date: date


class StudentLoginRequest(BaseModel):
    member_id: str = Field(min_length=3)
    national_id: str = Field(min_length=4)


class StudentSession(BaseModel):
    access_token: str
    expires_in: int
    profile: StudentProfile


class StudentTotpResponse(BaseModel):
    code: str
    expires_in: int


class StudentLoanRead(BaseModel):
    id: int
    book_id: str
    title: str
    due_date: date
    return_date: date | None
    status: str
    days_overdue: int


class StudentLoanSummary(BaseModel):
    loans: list[StudentLoanRead]
    overdue_count: int
    active_count: int


class CheckInRequest(BaseModel):
    member_id: str
    code: str


class CheckInResponse(BaseModel):
    member_id: str
    full_name: str
    status: str
    verified: bool
