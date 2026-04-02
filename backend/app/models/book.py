from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.db.session import Base


class Book(Base):
    __tablename__ = "books"

    book_id = Column(String(64), primary_key=True)
    title = Column(String(255), index=True, nullable=False)
    author = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    available_quantity = Column(Integer, nullable=False, default=1)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)
