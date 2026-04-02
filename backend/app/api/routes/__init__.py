from fastapi import APIRouter

from . import auth, books, loans, members, reports

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(members.router, prefix="/members", tags=["members"])
api_router.include_router(books.router, prefix="/books", tags=["books"])
api_router.include_router(loans.router, prefix="/loans", tags=["loans"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
