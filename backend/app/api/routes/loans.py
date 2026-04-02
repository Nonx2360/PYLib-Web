from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.db.session import get_session
from app.models.book import Book
from app.models.loan import Loan, LoanStatus
from app.models.member import Member
from app.models.user import User
from app.schemas.loan import LoanPayload, LoanRead, ReturnPayload
from app.services.audit import record_log

router = APIRouter()


def _serialize(loan: Loan) -> LoanRead:
    return LoanRead(
        id=loan.id,
        book_id=loan.book_id,
        member_id=loan.member_id,
        loan_date=loan.loan_date,
        due_date=loan.due_date,
        return_date=loan.return_date,
        status=loan.status.value if isinstance(loan.status, LoanStatus) else loan.status,
    )


async def _ensure_entities(
    session: AsyncSession, payload: LoanPayload | ReturnPayload
) -> tuple[Book, Member]:
    book = await session.get(Book, payload.book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    member = await session.get(Member, payload.member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return book, member


@router.post("/borrow", response_model=LoanRead, status_code=status.HTTP_201_CREATED)
async def borrow_book(
    payload: LoanPayload,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user),
) -> LoanRead:
    book, _ = await _ensure_entities(session, payload)
    if book.available_quantity <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No copies available")
    active_stmt = select(Loan).where(
        Loan.book_id == payload.book_id,
        Loan.member_id == payload.member_id,
        Loan.status == LoanStatus.BORROWED,
    )
    active = await session.execute(active_stmt)
    if active.scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Active loan exists")
    loan = Loan(
        book_id=payload.book_id,
        member_id=payload.member_id,
        due_date=payload.due_date,
    )
    book.available_quantity -= 1
    session.add(loan)
    await record_log(
        session,
        str(current_user.id),
        "BOOK_BORROWED",
        {"book_id": payload.book_id, "member_id": payload.member_id},
    )
    await session.commit()
    await session.refresh(loan)
    return _serialize(loan)


@router.post("/return", response_model=LoanRead)
async def return_book(
    payload: ReturnPayload,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user),
) -> LoanRead:
    book, _ = await _ensure_entities(session, payload)
    stmt = select(Loan).where(
        Loan.book_id == payload.book_id,
        Loan.member_id == payload.member_id,
        Loan.status.in_([LoanStatus.BORROWED, LoanStatus.OVERDUE]),
    )
    result = await session.execute(stmt)
    loan = result.scalars().first()
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found")
    loan.return_date = date.today()
    loan.status = LoanStatus.RETURNED
    book.available_quantity += 1
    await record_log(
        session,
        str(current_user.id),
        "BOOK_RETURNED",
        {"book_id": payload.book_id, "member_id": payload.member_id},
    )
    await session.commit()
    await session.refresh(loan)
    return _serialize(loan)


@router.get("/overdue", response_model=list[LoanRead])
async def overdue_loans(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(deps.get_current_user),
) -> list[LoanRead]:
    stmt = select(Loan).where(Loan.due_date < date.today(), Loan.status != LoanStatus.RETURNED)
    result = await session.execute(stmt)
    loans = result.scalars().all()
    for loan in loans:
        if loan.status != LoanStatus.OVERDUE:
            loan.status = LoanStatus.OVERDUE
    if loans:
        await session.commit()
    return [_serialize(loan) for loan in loans]
