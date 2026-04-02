from datetime import date

from pydantic import BaseModel


class LoanPayload(BaseModel):
    book_id: str
    member_id: str
    due_date: date


class ReturnPayload(BaseModel):
    book_id: str
    member_id: str


class LoanRead(BaseModel):
    id: int
    book_id: str
    member_id: str
    loan_date: date
    due_date: date
    return_date: date | None
    status: str

    class Config:
        from_attributes = True
