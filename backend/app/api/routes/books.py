from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.db.session import get_session
from app.models.book import Book
from app.models.loan import Loan, LoanStatus
from app.models.user import User
from app.schemas.book import BookCreate, BookRead, BookUpdate

router = APIRouter()


def _to_schema(book: Book) -> BookRead:
    return BookRead(
        book_id=book.book_id,
        title=book.title,
        author=book.author,
        category=book.category,
        quantity=book.quantity,
        available_quantity=book.available_quantity,
        added_at=book.added_at,
    )


@router.get("", response_model=list[BookRead])
async def list_books(
    search: str | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(deps.get_current_user),
) -> list[BookRead]:
    stmt = select(Book)
    if search:
        stmt = stmt.where(Book.title.ilike(f"%{search}%"))
    stmt = stmt.order_by(Book.added_at.desc())
    result = await session.execute(stmt)
    return [_to_schema(book) for book in result.scalars().all()]


@router.post("", response_model=BookRead, status_code=status.HTTP_201_CREATED)
async def create_book(
    payload: BookCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(deps.get_admin_user),
) -> BookRead:
    existing = await session.get(Book, payload.book_id)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Book exists")
    book = Book(
        book_id=payload.book_id,
        title=payload.title,
        author=payload.author,
        category=payload.category,
        quantity=payload.quantity,
        available_quantity=payload.quantity,
    )
    session.add(book)
    await session.commit()
    await session.refresh(book)
    return _to_schema(book)


@router.patch("/{book_id}", response_model=BookRead)
async def update_book(
    book_id: str,
    payload: BookUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(deps.get_admin_user),
) -> BookRead:
    book = await session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(book, field, value)
    await session.commit()
    await session.refresh(book)
    return _to_schema(book)


@router.get("/stats")
async def book_stats(session: AsyncSession = Depends(get_session)) -> dict[str, int]:
    total_books = (await session.execute(select(func.count(Book.book_id)))).scalar_one()
    available = (
        await session.execute(select(func.sum(Book.available_quantity)))
    ).scalar() or 0
    overdue = (
        await session.execute(select(func.count(Loan.id)).where(Loan.status == LoanStatus.OVERDUE))
    ).scalar_one()
    return {
        "total_books": total_books,
        "available_copies": int(available),
        "overdue_loans": overdue,
    }
