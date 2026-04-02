from datetime import date

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api import deps
from app.core.config import get_settings
from app.core.security import create_student_token
from app.db.session import get_session
from app.models.loan import Loan, LoanStatus
from app.models.member import Member
from app.schemas.student import (
    CheckInRequest,
    CheckInResponse,
    StudentLoanRead,
    StudentLoanSummary,
    StudentLoginRequest,
    StudentProfile,
    StudentSession,
    StudentTotpResponse,
)
from app.services.totp import generate_totp_secret, get_current_totp_code, verify_totp_code
from app.utils.crypto import decrypt_value, verify_integrity


router = APIRouter()
settings = get_settings()


def _serialize_profile(member: Member) -> StudentProfile:
    return StudentProfile(
        member_id=member.member_id,
        full_name=member.full_name,
        member_type=member.member_type,
        joined_date=member.joined_date,
    )


def _serialize_loan(loan: Loan) -> StudentLoanRead:
    status_value = loan.status.value if isinstance(loan.status, LoanStatus) else loan.status
    overdue_days = 0
    if status_value != LoanStatus.RETURNED.value and loan.due_date < date.today():
        overdue_days = (date.today() - loan.due_date).days
    return StudentLoanRead(
        id=loan.id,
        book_id=loan.book_id,
        title=loan.book.title if loan.book else loan.book_id,
        due_date=loan.due_date,
        return_date=loan.return_date,
        status=status_value,
        days_overdue=overdue_days,
    )


async def _ensure_member_secret(member: Member, session: AsyncSession) -> None:
    if not member.totp_secret:
        member.totp_secret = generate_totp_secret()
        session.add(member)
        await session.commit()
        await session.refresh(member)


@router.post("/login", response_model=StudentSession)
async def student_login(
    payload: StudentLoginRequest,
    session: AsyncSession = Depends(get_session),
) -> StudentSession:
    member = await session.get(Member, payload.member_id)
    if not member or member.member_type != "student":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Student not found")
    decrypted_id = decrypt_value(member.encrypted_national_id)
    if not verify_integrity({"member_id": member.member_id, "national_id": decrypted_id}, member.hmac_integrity):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Member data corrupted")
    if decrypted_id != payload.national_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    await _ensure_member_secret(member, session)
    return StudentSession(
        access_token=create_student_token(member.member_id),
        expires_in=settings.student_access_token_expire_minutes * 60,
        profile=_serialize_profile(member),
    )


@router.get("/me", response_model=StudentProfile)
async def student_profile(member: Member = Depends(deps.get_current_student)) -> StudentProfile:
    return _serialize_profile(member)


@router.get("/totp", response_model=StudentTotpResponse)
async def current_totp(
    member: Member = Depends(deps.get_current_student), session: AsyncSession = Depends(get_session)
) -> StudentTotpResponse:
    await _ensure_member_secret(member, session)
    code, remaining = get_current_totp_code(member.totp_secret)
    return StudentTotpResponse(code=code, expires_in=remaining)


@router.get("/loans", response_model=StudentLoanSummary)
async def student_loans(
    member: Member = Depends(deps.get_current_student), session: AsyncSession = Depends(get_session)
) -> StudentLoanSummary:
    stmt = (
        select(Loan)
        .options(selectinload(Loan.book))
        .where(Loan.member_id == member.member_id)
        .order_by(Loan.loan_date.desc())
    )
    result = await session.execute(stmt)
    loans = result.scalars().all()
    today = date.today()
    dirty = False
    for loan in loans:
        if loan.status != LoanStatus.RETURNED and loan.due_date < today:
            if loan.status != LoanStatus.OVERDUE:
                loan.status = LoanStatus.OVERDUE
                dirty = True
    if dirty:
        await session.commit()
    serialized = [_serialize_loan(loan) for loan in loans]
    overdue = sum(1 for loan in serialized if loan.days_overdue > 0 and loan.status != LoanStatus.RETURNED.value)
    active = sum(1 for loan in serialized if loan.status in {LoanStatus.BORROWED.value, LoanStatus.OVERDUE.value})
    return StudentLoanSummary(loans=serialized, overdue_count=overdue, active_count=active)


@router.post("/checkin", response_model=CheckInResponse)
async def verify_checkin(
    payload: CheckInRequest,
    session: AsyncSession = Depends(get_session),
    scanner_key: str | None = Header(default=None, alias="X-Scanner-Key"),
) -> CheckInResponse:
    if scanner_key != settings.door_scanner_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Scanner unauthorized")
    member = await session.get(Member, payload.member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    await _ensure_member_secret(member, session)
    if not verify_totp_code(member.totp_secret, payload.code):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid code")
    return CheckInResponse(
        member_id=member.member_id,
        full_name=member.full_name,
        status="checked_in",
        verified=True,
    )
