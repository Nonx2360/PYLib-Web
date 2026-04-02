from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.db.session import get_session
from app.models.member import Member
from app.models.user import User
from app.schemas.member import MemberCreate, MemberRead, MemberUpdate
from app.services.audit import record_log
from app.services.qr import generate_qr_code
from app.services.totp import generate_totp_secret
from app.utils.crypto import compute_integrity, decrypt_value, encrypt_value
from app.reports.member_card import generate_member_card

router = APIRouter()
QR_DIR = Path(__file__).resolve().parents[3] / "storage" / "qr"


def _member_schema(member: Member, include_sensitive: bool = False) -> MemberRead:
    national_id = decrypt_value(member.encrypted_national_id) if include_sensitive else None
    return MemberRead(
        member_id=member.member_id,
        full_name=member.full_name,
        member_type=member.member_type,
        joined_date=member.joined_date,
        qr_code_path=member.qr_code_path,
        national_id=national_id,
    )


@router.get("", response_model=list[MemberRead])
async def list_members(
    search: str | None = Query(default=None, description="Search full name"),
    skip: int = 0,
    limit: int = Query(default=20, le=100),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user),
) -> list[MemberRead]:
    stmt: Select[tuple[Member]] = select(Member)
    if search:
        stmt = stmt.where(Member.full_name.ilike(f"%{search}%"))
    stmt = stmt.offset(skip).limit(limit).order_by(Member.joined_date.desc())
    result = await session.execute(stmt)
    members = result.scalars().all()
    return [_member_schema(member) for member in members]


@router.post("", response_model=MemberRead, status_code=status.HTTP_201_CREATED)
async def create_member(
    payload: MemberCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_admin_user),
) -> MemberRead:
    existing = await session.get(Member, payload.member_id)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Member exists")
    encrypted = encrypt_value(payload.national_id)
    signature = compute_integrity({"member_id": payload.member_id, "national_id": payload.national_id})
    qr_path = generate_qr_code(payload.member_id, QR_DIR)
    member = Member(
        member_id=payload.member_id,
        full_name=payload.full_name,
        member_type=payload.member_type,
        encrypted_national_id=encrypted,
        hmac_integrity=signature,
        qr_code_path=qr_path,
        totp_secret=generate_totp_secret(),
    )
    session.add(member)
    await record_log(
        session,
        str(current_user.id),
        "MEMBER_CREATED",
        {"member_id": member.member_id},
    )
    await session.commit()
    await session.refresh(member)
    return _member_schema(member, include_sensitive=True)


@router.get("/{member_id}", response_model=MemberRead)
async def get_member(
    member_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user),
) -> MemberRead:
    member = await session.get(Member, member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return _member_schema(member, include_sensitive=True)


@router.patch("/{member_id}", response_model=MemberRead)
async def update_member(
    member_id: str,
    payload: MemberUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_admin_user),
) -> MemberRead:
    member = await session.get(Member, member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(member, field, value)
    await record_log(
        session,
        str(current_user.id),
        "MEMBER_UPDATED",
        {"member_id": member.member_id},
    )
    await session.commit()
    await session.refresh(member)
    return _member_schema(member, include_sensitive=True)


@router.get("/{member_id}/card.pdf")
async def member_card(
    member_id: str,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(deps.get_current_user),
) -> StreamingResponse:
    member = await session.get(Member, member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    pdf_bytes = generate_member_card(member)
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={member_id}-card.pdf"},
    )
