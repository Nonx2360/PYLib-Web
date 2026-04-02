from datetime import datetime

from pydantic import BaseModel, Field


class BookBase(BaseModel):
    title: str
    author: str
    category: str | None = None
    quantity: int = Field(ge=0)


class BookCreate(BookBase):
    book_id: str


class BookUpdate(BaseModel):
    title: str | None = None
    author: str | None = None
    category: str | None = None
    quantity: int | None = None
    available_quantity: int | None = None


class BookRead(BookBase):
    book_id: str
    available_quantity: int
    added_at: datetime

    class Config:
        from_attributes = True
