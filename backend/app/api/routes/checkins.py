from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api import deps
from app.db.session import get_session
from app.models.checkin import CheckIn
from app.models.member import Member
from app.models.user import User
from app.schemas.checkin import CheckInRead, CheckInRequest
from app.services.audit import record_log
from app.services.totp import ensure_member_totp_secret, verify_totp_code


router = APIRouter()


def _serialize(entry: CheckIn) -> CheckInRead:
    return CheckInRead(
        id=entry.id,
        member_id=entry.member_id,
        member_name=entry.member.full_name if entry.member else entry.member_id,
        staff_username=entry.staff.username if entry.staff else None,
        method=entry.method,
        created_at=entry.created_at,
    )


@router.post("", response_model=CheckInRead, status_code=status.HTTP_201_CREATED)
async def record_checkin(
    payload: CheckInRequest,
    session: AsyncSession = Depends(get_session),
    staff_user: User = Depends(deps.get_current_user),
) -> CheckInRead:
    member = await session.get(Member, payload.member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    await ensure_member_totp_secret(session, member)
    if not verify_totp_code(member.totp_secret, payload.code):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid TOTP code")
    entry = CheckIn(member_id=member.member_id, staff_id=str(staff_user.id), method="staff_terminal")
    session.add(entry)
    await record_log(
        session,
        str(staff_user.id),
        "STUDENT_CHECKED_IN",
        {"member_id": member.member_id},
    )
    await session.commit()
    result = await session.execute(
        select(CheckIn)
            .options(selectinload(CheckIn.member), selectinload(CheckIn.staff))
            .where(CheckIn.id == entry.id)
    )
    persisted = result.scalar_one()
    return _serialize(persisted)


@router.get("/today", response_model=list[CheckInRead])
async def today_checkins(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(deps.get_current_user),
) -> list[CheckInRead]:
    start = datetime.combine(date.today(), time.min)
    stmt = (
        select(CheckIn)
        .where(CheckIn.created_at >= start)
        .options(selectinload(CheckIn.member), selectinload(CheckIn.staff))
        .order_by(CheckIn.created_at.desc())
    )
    result = await session.execute(stmt)
    entries = result.scalars().all()
    return [_serialize(entry) for entry in entries]
