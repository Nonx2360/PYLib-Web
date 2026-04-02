from datetime import date

from sqlalchemy import Column, Date, String, Text

from app.db.session import Base


class Member(Base):
    __tablename__ = "members"

    member_id = Column(String(64), primary_key=True)
    full_name = Column(String(120), nullable=False)
    encrypted_national_id = Column(Text, nullable=False)
    hmac_integrity = Column(Text, nullable=False)
    member_type = Column(String(30), nullable=False)
    joined_date = Column(Date, default=date.today, nullable=False)
    qr_code_path = Column(String(255), nullable=True)
