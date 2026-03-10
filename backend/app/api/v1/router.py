from fastapi import APIRouter
from app.api.v1 import auth, admin, profesor, alumno, payments, notifications, exams, tutor, upload

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(profesor.router, prefix="/profesor", tags=["profesor"])
api_router.include_router(exams.router, prefix="/profesor", tags=["exams"])
api_router.include_router(alumno.router, prefix="/alumno", tags=["alumno"])
api_router.include_router(tutor.router, prefix="/alumno/tutor", tags=["tutor"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(upload.router, tags=["upload"])
