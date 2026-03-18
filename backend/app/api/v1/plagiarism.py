"""Plagiarism detection: similarity checking between student exam submissions."""
import uuid
from decimal import Decimal
from itertools import combinations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.dependencies import get_profesor
from app.core.utils import parse_uuid
from app.models.user import User
from app.models.exam import Exam
from app.models.student_exam import StudentExam, StudentAnswer
from app.models.plagiarism import PlagiarismCheck, PlagiarismMatch
from app.schemas.features import PlagiarismCheckResponse, PlagiarismRunRequest

router = APIRouter()


def calculate_similarity(text1: str, text2: str) -> float:
    """Jaccard similarity on word sets. Returns percentage 0-100."""
    if not text1 or not text2:
        return 0.0
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    if not words1 or not words2:
        return 0.0
    intersection = words1 & words2
    union = words1 | words2
    return len(intersection) / len(union) * 100


def estimate_ai_generated_score(text: str) -> float:
    """Simple heuristic to estimate if text may be AI-generated.

    Checks for:
    - Very uniform sentence lengths
    - Lack of common typos or informal language markers
    - High ratio of long, well-structured sentences
    Returns a score 0-100 where higher = more likely AI-generated.
    """
    if not text or len(text.strip()) < 50:
        return 0.0

    sentences = [s.strip() for s in text.replace("!", ".").replace("?", ".").split(".") if s.strip()]
    if len(sentences) < 2:
        return 0.0

    # Check sentence length uniformity
    lengths = [len(s.split()) for s in sentences]
    avg_len = sum(lengths) / len(lengths)
    if avg_len == 0:
        return 0.0
    variance = sum((l - avg_len) ** 2 for l in lengths) / len(lengths)
    std_dev = variance ** 0.5

    # Low std deviation relative to mean = very uniform = suspicious
    coefficient_of_variation = std_dev / avg_len if avg_len > 0 else 1.0
    uniformity_score = max(0, 50 - coefficient_of_variation * 100)

    # Check for informal language markers (presence lowers AI score)
    informal_markers = ["jaja", "xd", "pues", "bueno,", "osea", "esque", "neta", "wey", "x q", "xq", "tbien", "tmb"]
    informal_count = sum(1 for marker in informal_markers if marker in text.lower())
    informal_penalty = min(30, informal_count * 10)

    # High average sentence length is somewhat suspicious
    length_score = min(20, max(0, (avg_len - 12) * 2))

    score = uniformity_score + length_score - informal_penalty
    return max(0.0, min(100.0, score))


@router.post("/check", response_model=PlagiarismCheckResponse)
async def run_plagiarism_check(
    data: PlagiarismRunRequest,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor),
):
    """Run plagiarism check on an exam's submissions.

    For each pair of student answers, calculates text similarity.
    Also checks for AI-generated patterns.
    """
    exam_id = parse_uuid(data.exam_id, "exam_id")
    exam = (await db.execute(
        select(Exam).where(Exam.id == exam_id, Exam.profesor_id == user.id)
    )).scalar_one_or_none()
    if not exam:
        raise HTTPException(404, "Examen no encontrado")

    # Get all corrected student exams for this exam
    student_exams = (await db.execute(
        select(StudentExam).where(
            StudentExam.exam_id == exam.id,
            StudentExam.status.in_(["corrected", "published"]),
        )
    )).scalars().all()

    if len(student_exams) < 2:
        raise HTTPException(400, "Se necesitan al menos 2 exámenes corregidos para verificar plagio")

    # Collect all answers per student exam
    se_answers: dict[uuid.UUID, str] = {}
    for se in student_exams:
        answers = (await db.execute(
            select(StudentAnswer).where(StudentAnswer.student_exam_id == se.id)
        )).scalars().all()
        # Combine all answer texts into one block for comparison
        combined = " ".join(
            (a.answer_text or "") for a in answers if a.answer_text
        )
        se_answers[se.id] = combined

    # Create the plagiarism check record
    check = PlagiarismCheck(
        exam_id=exam.id,
        status="processing",
        checked_by="system",
    )
    db.add(check)
    await db.flush()

    # Compare each pair
    max_similarity = 0.0
    total_ai_score = 0.0
    ai_count = 0
    matches_data: list[dict] = []

    for se_a, se_b in combinations(student_exams, 2):
        text_a = se_answers.get(se_a.id, "")
        text_b = se_answers.get(se_b.id, "")

        if not text_a or not text_b:
            continue

        sim = calculate_similarity(text_a, text_b)
        if sim > max_similarity:
            max_similarity = sim

        # Only record matches above a threshold
        if sim >= 30.0:
            match = PlagiarismMatch(
                check_id=check.id,
                matched_student_exam_id=se_b.id,
                similarity_percentage=Decimal(str(round(sim, 2))),
                matched_segments={
                    "student_exam_a": str(se_a.id),
                    "student_exam_b": str(se_b.id),
                    "similarity": round(sim, 2),
                },
            )
            db.add(match)
            matches_data.append({
                "student_exam_a": str(se_a.id),
                "student_exam_b": str(se_b.id),
                "similarity": round(sim, 2),
            })

    # Check AI-generated score for each submission
    for se_id, text in se_answers.items():
        if text:
            ai_score = estimate_ai_generated_score(text)
            total_ai_score += ai_score
            ai_count += 1

    avg_ai_score = total_ai_score / ai_count if ai_count > 0 else 0.0

    # Update check record
    check.similarity_score = Decimal(str(round(max_similarity, 2)))
    check.ai_generated_score = Decimal(str(round(avg_ai_score, 2)))
    check.status = "completed"
    check.report = {
        "total_submissions": len(student_exams),
        "pairs_checked": len(list(combinations(student_exams, 2))),
        "matches_found": len(matches_data),
        "max_similarity": round(max_similarity, 2),
        "avg_ai_score": round(avg_ai_score, 2),
    }
    await db.commit()
    await db.refresh(check)

    return PlagiarismCheckResponse(
        id=str(check.id),
        exam_id=str(check.exam_id),
        student_exam_id=str(check.student_exam_id) if check.student_exam_id else None,
        status=check.status,
        similarity_score=float(check.similarity_score) if check.similarity_score else None,
        ai_generated_score=float(check.ai_generated_score) if check.ai_generated_score else None,
        matches=matches_data,
        created_at=check.created_at.isoformat(),
    )


@router.get("/results/{exam_id}", response_model=list[PlagiarismCheckResponse])
async def get_plagiarism_results(
    exam_id: str,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor),
):
    """Get all plagiarism check results for an exam."""
    eid = parse_uuid(exam_id, "exam_id")
    # Verify ownership
    exam = (await db.execute(
        select(Exam).where(Exam.id == eid, Exam.profesor_id == user.id)
    )).scalar_one_or_none()
    if not exam:
        raise HTTPException(404, "Examen no encontrado")

    checks = (await db.execute(
        select(PlagiarismCheck)
        .where(PlagiarismCheck.exam_id == eid)
        .order_by(PlagiarismCheck.created_at.desc())
    )).scalars().all()

    results = []
    for check in checks:
        # Load matches
        matches = (await db.execute(
            select(PlagiarismMatch).where(PlagiarismMatch.check_id == check.id)
        )).scalars().all()
        matches_data = [
            {
                "id": str(m.id),
                "matched_student_exam_id": str(m.matched_student_exam_id),
                "similarity": float(m.similarity_percentage),
                "segments": m.matched_segments,
            }
            for m in matches
        ]
        results.append(PlagiarismCheckResponse(
            id=str(check.id),
            exam_id=str(check.exam_id),
            student_exam_id=str(check.student_exam_id) if check.student_exam_id else None,
            status=check.status,
            similarity_score=float(check.similarity_score) if check.similarity_score else None,
            ai_generated_score=float(check.ai_generated_score) if check.ai_generated_score else None,
            matches=matches_data,
            created_at=check.created_at.isoformat(),
        ))
    return results


@router.get("/check/{check_id}", response_model=PlagiarismCheckResponse)
async def get_plagiarism_check_detail(
    check_id: str,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor),
):
    """Get detailed plagiarism check with matches."""
    cid = parse_uuid(check_id, "check_id")
    check = (await db.execute(
        select(PlagiarismCheck).where(PlagiarismCheck.id == cid)
    )).scalar_one_or_none()
    if not check:
        raise HTTPException(404, "Verificación no encontrada")

    # Verify ownership via exam
    exam = (await db.execute(
        select(Exam).where(Exam.id == check.exam_id, Exam.profesor_id == user.id)
    )).scalar_one_or_none()
    if not exam:
        raise HTTPException(403, "No tienes acceso a este recurso")

    # Load matches with student names
    matches = (await db.execute(
        select(PlagiarismMatch).where(PlagiarismMatch.check_id == check.id)
    )).scalars().all()

    matches_data = []
    for m in matches:
        # Get student names for matched exams
        matched_se = (await db.execute(
            select(StudentExam, User)
            .outerjoin(User, User.id == StudentExam.student_id)
            .where(StudentExam.id == m.matched_student_exam_id)
        )).first()
        student_name = None
        if matched_se:
            _, student = matched_se
            if student:
                student_name = f"{student.first_name} {student.last_name}"
        matches_data.append({
            "id": str(m.id),
            "matched_student_exam_id": str(m.matched_student_exam_id),
            "student_name": student_name,
            "similarity": float(m.similarity_percentage),
            "segments": m.matched_segments,
        })

    return PlagiarismCheckResponse(
        id=str(check.id),
        exam_id=str(check.exam_id),
        student_exam_id=str(check.student_exam_id) if check.student_exam_id else None,
        status=check.status,
        similarity_score=float(check.similarity_score) if check.similarity_score else None,
        ai_generated_score=float(check.ai_generated_score) if check.ai_generated_score else None,
        matches=matches_data,
        created_at=check.created_at.isoformat(),
    )
