"""Peer review: assignments, review distribution, submission."""
import uuid
import random
import logging
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.core.database import get_db
from app.core.dependencies import get_profesor, get_alumno, get_current_user
from app.core.utils import parse_uuid
from app.models.user import User
from app.models.exam import Exam
from app.models.student_exam import StudentExam
from app.models.peer_review import PeerReviewAssignment, PeerReview

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Request schemas ───

class CreatePeerReviewAssignmentRequest(BaseModel):
    exam_id: str
    reviews_per_student: int = 2
    is_anonymous: bool = True
    rubric: dict | None = None
    deadline: str | None = None


class SubmitPeerReviewRequest(BaseModel):
    score: float
    feedback: str
    rubric_scores: dict | None = None


# ─── Helpers ───

def _assign_reviewers(student_exam_ids: list[uuid.UUID], reviews_per_student: int) -> list[tuple[uuid.UUID, uuid.UUID]]:
    """Circular assignment: each student reviews the next N students' exams.

    Returns list of (reviewer_student_id, reviewee_student_exam_id) pairs.
    The reviewer is the student who submitted the next student exam in the
    shuffled circular list.
    """
    if len(student_exam_ids) < 2:
        return []

    # Shuffle for randomness
    shuffled = list(student_exam_ids)
    random.shuffle(shuffled)

    assignments = []
    n = len(shuffled)
    reviews_count = min(reviews_per_student, n - 1)  # Can't review yourself

    for i, se_id in enumerate(shuffled):
        for offset in range(1, reviews_count + 1):
            reviewer_idx = (i + offset) % n
            # se_id is the exam being reviewed, shuffled[reviewer_idx] is the reviewer's exam
            # We need to map exam IDs to student IDs later
            assignments.append((shuffled[reviewer_idx], se_id))

    return assignments


# ─── Endpoints ───

@router.post("/assignments")
async def create_peer_review_assignment(
    data: CreatePeerReviewAssignmentRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Create a peer review assignment and distribute reviews."""
    exam_id = parse_uuid(data.exam_id, "exam_id")

    # Verify exam exists and belongs to profesor
    exam = (await db.execute(
        select(Exam).where(Exam.id == exam_id, Exam.profesor_id == user.id)
    )).scalar_one_or_none()
    if not exam:
        raise HTTPException(404, "Examen no encontrado")

    # Get corrected student exams with assigned students
    student_exams = (await db.execute(
        select(StudentExam).where(
            StudentExam.exam_id == exam_id,
            StudentExam.status.in_(["corrected", "published"]),
            StudentExam.student_id.isnot(None),
        )
    )).scalars().all()

    if len(student_exams) < 2:
        raise HTTPException(400, "Se necesitan al menos 2 estudiantes con examenes corregidos")

    if data.reviews_per_student < 1:
        raise HTTPException(400, "Se requiere al menos 1 revision por estudiante")

    # Parse deadline
    deadline = None
    if data.deadline:
        try:
            deadline = datetime.fromisoformat(data.deadline)
        except ValueError:
            raise HTTPException(400, "Formato de deadline invalido")

    # Create assignment
    assignment = PeerReviewAssignment(
        exam_id=exam_id,
        reviews_per_student=data.reviews_per_student,
        is_anonymous=data.is_anonymous,
        rubric=data.rubric,
        deadline=deadline,
        status="assigned",
    )
    db.add(assignment)
    await db.flush()

    # Build student_exam_id -> student_id mapping
    se_to_student = {se.id: se.student_id for se in student_exams}
    se_ids = [se.id for se in student_exams]

    # Assign reviewers using circular distribution
    raw_assignments = _assign_reviewers(se_ids, data.reviews_per_student)

    reviews_created = 0
    for reviewer_se_id, reviewee_se_id in raw_assignments:
        reviewer_student_id = se_to_student[reviewer_se_id]
        # Don't let student review themselves
        if reviewer_student_id == se_to_student[reviewee_se_id]:
            continue

        review = PeerReview(
            assignment_id=assignment.id,
            reviewer_id=reviewer_student_id,
            reviewee_exam_id=reviewee_se_id,
            status="pending",
        )
        db.add(review)
        reviews_created += 1

    await db.commit()
    await db.refresh(assignment)

    return {
        "id": str(assignment.id),
        "exam_id": str(assignment.exam_id),
        "status": assignment.status,
        "reviews_per_student": assignment.reviews_per_student,
        "is_anonymous": assignment.is_anonymous,
        "reviews_created": reviews_created,
        "deadline": assignment.deadline.isoformat() if assignment.deadline else None,
        "created_at": assignment.created_at.isoformat(),
    }


@router.get("/assignments")
async def list_assignments(
    exam_id: str = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """List peer review assignments (profesor)."""
    q = select(PeerReviewAssignment).join(
        Exam, Exam.id == PeerReviewAssignment.exam_id
    ).where(Exam.profesor_id == user.id)

    if exam_id:
        q = q.where(PeerReviewAssignment.exam_id == parse_uuid(exam_id, "exam_id"))

    q = q.order_by(desc(PeerReviewAssignment.created_at))
    assignments = (await db.execute(q)).scalars().all()

    results = []
    for a in assignments:
        total_reviews = (await db.execute(
            select(func.count(PeerReview.id)).where(PeerReview.assignment_id == a.id)
        )).scalar() or 0
        submitted_reviews = (await db.execute(
            select(func.count(PeerReview.id)).where(
                PeerReview.assignment_id == a.id,
                PeerReview.status == "submitted",
            )
        )).scalar() or 0

        results.append({
            "id": str(a.id),
            "exam_id": str(a.exam_id),
            "status": a.status,
            "reviews_per_student": a.reviews_per_student,
            "is_anonymous": a.is_anonymous,
            "total_reviews": total_reviews,
            "submitted_reviews": submitted_reviews,
            "deadline": a.deadline.isoformat() if a.deadline else None,
            "created_at": a.created_at.isoformat(),
        })

    return results


@router.get("/assignments/{assignment_id}")
async def get_assignment(
    assignment_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Get assignment with all reviews."""
    aid = parse_uuid(assignment_id, "assignment_id")

    assignment = (await db.execute(
        select(PeerReviewAssignment).where(PeerReviewAssignment.id == aid)
    )).scalar_one_or_none()
    if not assignment:
        raise HTTPException(404, "Asignacion no encontrada")

    # Verify ownership
    exam = (await db.execute(
        select(Exam).where(Exam.id == assignment.exam_id, Exam.profesor_id == user.id)
    )).scalar_one_or_none()
    if not exam:
        raise HTTPException(403, "No tienes acceso a esta asignacion")

    # Get all reviews with reviewer info
    reviews = (await db.execute(
        select(PeerReview, User.first_name, User.last_name, User.email)
        .join(User, User.id == PeerReview.reviewer_id)
        .where(PeerReview.assignment_id == aid)
        .order_by(PeerReview.created_at)
    )).all()

    return {
        "id": str(assignment.id),
        "exam_id": str(assignment.exam_id),
        "status": assignment.status,
        "reviews_per_student": assignment.reviews_per_student,
        "is_anonymous": assignment.is_anonymous,
        "rubric": assignment.rubric,
        "deadline": assignment.deadline.isoformat() if assignment.deadline else None,
        "reviews": [{
            "id": str(r.id),
            "reviewer_name": f"{fname} {lname}",
            "reviewer_email": email,
            "reviewee_exam_id": str(r.reviewee_exam_id),
            "score": float(r.score) if r.score else None,
            "feedback": r.feedback,
            "rubric_scores": r.rubric_scores,
            "status": r.status,
            "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
        } for r, fname, lname, email in reviews],
    }


@router.get("/my-reviews")
async def my_pending_reviews(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_alumno),
):
    """Get student's pending peer reviews."""
    reviews = (await db.execute(
        select(PeerReview, PeerReviewAssignment, Exam.title)
        .join(PeerReviewAssignment, PeerReviewAssignment.id == PeerReview.assignment_id)
        .join(Exam, Exam.id == PeerReviewAssignment.exam_id)
        .where(
            PeerReview.reviewer_id == user.id,
            PeerReview.status == "pending",
        )
        .order_by(PeerReview.created_at)
    )).all()

    return [{
        "id": str(r.id),
        "assignment_id": str(a.id),
        "exam_title": title,
        "reviewee_exam_id": str(r.reviewee_exam_id),
        "is_anonymous": a.is_anonymous,
        "rubric": a.rubric,
        "deadline": a.deadline.isoformat() if a.deadline else None,
        "status": r.status,
    } for r, a, title in reviews]


@router.post("/reviews/{review_id}/submit")
async def submit_review(
    review_id: str,
    data: SubmitPeerReviewRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_alumno),
):
    """Submit a peer review."""
    rid = parse_uuid(review_id, "review_id")

    review = (await db.execute(
        select(PeerReview).where(
            PeerReview.id == rid,
            PeerReview.reviewer_id == user.id,
        )
    )).scalar_one_or_none()
    if not review:
        raise HTTPException(404, "Revision no encontrada")

    if review.status == "submitted":
        raise HTTPException(400, "Esta revision ya fue enviada")

    if data.score < 0:
        raise HTTPException(400, "El puntaje no puede ser negativo")
    if not data.feedback.strip():
        raise HTTPException(400, "El feedback es requerido")

    review.score = Decimal(str(data.score))
    review.feedback = data.feedback
    review.rubric_scores = data.rubric_scores
    review.status = "submitted"
    review.submitted_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(review)

    return {
        "id": str(review.id),
        "score": float(review.score),
        "feedback": review.feedback,
        "status": review.status,
        "submitted_at": review.submitted_at.isoformat(),
    }


@router.get("/received/{student_exam_id}")
async def get_received_reviews(
    student_exam_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get reviews received for a student exam."""
    se_id = parse_uuid(student_exam_id, "student_exam_id")

    # Verify access: student owns the exam or profesor owns the parent exam
    se = (await db.execute(
        select(StudentExam).where(StudentExam.id == se_id)
    )).scalar_one_or_none()
    if not se:
        raise HTTPException(404, "Examen de alumno no encontrado")

    if user.role == "alumno" and se.student_id != user.id:
        raise HTTPException(403, "No tienes acceso a estas revisiones")
    elif user.role in ("profesor", "superadmin"):
        exam = (await db.execute(
            select(Exam).where(Exam.id == se.exam_id, Exam.profesor_id == user.id)
        )).scalar_one_or_none()
        if not exam:
            raise HTTPException(403, "No tienes acceso a estas revisiones")

    # Get submitted reviews for this student exam
    reviews = (await db.execute(
        select(PeerReview, PeerReviewAssignment.is_anonymous, User.first_name, User.last_name)
        .join(PeerReviewAssignment, PeerReviewAssignment.id == PeerReview.assignment_id)
        .join(User, User.id == PeerReview.reviewer_id)
        .where(
            PeerReview.reviewee_exam_id == se_id,
            PeerReview.status == "submitted",
        )
    )).all()

    return [{
        "id": str(r.id),
        "reviewer_name": None if is_anon and user.role == "alumno" else f"{fname} {lname}",
        "score": float(r.score) if r.score else None,
        "feedback": r.feedback,
        "rubric_scores": r.rubric_scores,
        "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
    } for r, is_anon, fname, lname in reviews]


@router.post("/assignments/{assignment_id}/complete")
async def complete_assignment(
    assignment_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Mark a peer review assignment as completed."""
    aid = parse_uuid(assignment_id, "assignment_id")

    assignment = (await db.execute(
        select(PeerReviewAssignment).where(PeerReviewAssignment.id == aid)
    )).scalar_one_or_none()
    if not assignment:
        raise HTTPException(404, "Asignacion no encontrada")

    exam = (await db.execute(
        select(Exam).where(Exam.id == assignment.exam_id, Exam.profesor_id == user.id)
    )).scalar_one_or_none()
    if not exam:
        raise HTTPException(403, "No tienes acceso a esta asignacion")

    assignment.status = "completed"
    await db.commit()

    return {"ok": True, "status": "completed"}
