from fastapi import APIRouter

from . import auth, books, checkins, loans, members, reports, students

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(members.router, prefix="/members", tags=["members"])
api_router.include_router(books.router, prefix="/books", tags=["books"])
api_router.include_router(loans.router, prefix="/loans", tags=["loans"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(students.router, prefix="/student", tags=["student"])
api_router.include_router(checkins.router, prefix="/checkins", tags=["checkins"])
