from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class CheckIn(Base):
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, autoincrement=True)
    member_id = Column(String(64), ForeignKey("members.member_id"), nullable=False)
    staff_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    method = Column(String(40), nullable=False, default="staff_terminal")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    member = relationship("Member")
    staff = relationship("User")
