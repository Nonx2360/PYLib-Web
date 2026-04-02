from datetime import date
from enum import Enum

from sqlalchemy import Column, Date, Enum as SqlEnum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class LoanStatus(str, Enum):
    BORROWED = "borrowed"
    RETURNED = "returned"
    OVERDUE = "overdue"


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    book_id = Column(String(64), ForeignKey("books.book_id"), nullable=False)
    member_id = Column(String(64), ForeignKey("members.member_id"), nullable=False)
    loan_date = Column(Date, default=date.today, nullable=False)
    due_date = Column(Date, nullable=False)
    return_date = Column(Date, nullable=True)
    status = Column(SqlEnum(LoanStatus), default=LoanStatus.BORROWED, nullable=False)

    book = relationship("Book")
    member = relationship("Member")
