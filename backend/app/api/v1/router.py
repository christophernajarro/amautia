from fastapi import APIRouter
from app.api.v1 import (
    auth, admin, profesor, alumno, payments, notifications, exams, tutor, upload,
    gamification, live_quiz, plagiarism, parent, question_bank,
    messaging, flashcards, gradebook, peer_review, certificates, analytics, lti,
)

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
api_router.include_router(gamification.router, prefix="/gamification", tags=["gamification"])
api_router.include_router(live_quiz.router, prefix="/live-quiz", tags=["live-quiz"])
api_router.include_router(plagiarism.router, prefix="/plagiarism", tags=["plagiarism"])
api_router.include_router(parent.router, prefix="/parent", tags=["parent"])
api_router.include_router(question_bank.router, prefix="/question-bank", tags=["question-bank"])
api_router.include_router(messaging.router, prefix="/messaging", tags=["messaging"])
api_router.include_router(flashcards.router, prefix="/flashcards", tags=["flashcards"])
api_router.include_router(gradebook.router, prefix="/gradebook", tags=["gradebook"])
api_router.include_router(peer_review.router, prefix="/peer-review", tags=["peer-review"])
api_router.include_router(certificates.router, prefix="/certificates", tags=["certificates"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(lti.router, prefix="/lti", tags=["lti"])
