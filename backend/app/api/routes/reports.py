from io import BytesIO

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.db.session import get_session
from app.models.book import Book
from app.models.loan import Loan, LoanStatus
from app.models.log import AuditLog
from app.models.member import Member
from app.models.user import User
from app.schemas.log import AuditLogRead
from app.reports.summary import generate_summary_report

router = APIRouter()


@router.get("/summary.pdf")
async def summary_report(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(deps.get_current_user),
) -> StreamingResponse:
    stats = {
        "Members": (await session.execute(select(func.count(Member.member_id)))).scalar_one(),
        "Books": (await session.execute(select(func.count(Book.book_id)))).scalar_one(),
        "Active Loans": (
            await session.execute(
                select(func.count(Loan.id)).where(Loan.status.in_([LoanStatus.BORROWED, LoanStatus.OVERDUE]))
            )
        ).scalar_one(),
    }
    pdf_bytes = generate_summary_report(stats)
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=summary.pdf"},
    )


@router.get("/logs", response_model=list[AuditLogRead])
async def export_logs(
    limit: int = 100,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(deps.get_admin_user),
) -> list[AuditLogRead]:
    stmt = select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit)
    result = await session.execute(stmt)
    logs = result.scalars().all()
    return [AuditLogRead.from_orm(log) for log in logs]
