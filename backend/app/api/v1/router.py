from fastapi import APIRouter
from app.api.v1 import auth, admin, profesor, alumno, payments, notifications

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(profesor.router, prefix="/profesor", tags=["profesor"])
api_router.include_router(alumno.router, prefix="/alumno", tags=["alumno"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
