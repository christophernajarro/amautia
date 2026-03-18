"""Analytics: psychometric analysis, at-risk students, question stats."""
import math
import uuid
import logging
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.core.database import get_db
from app.core.dependencies import get_profesor
from app.core.utils import parse_uuid
from app.models.user import User
from app.models.exam import Exam, ExamQuestion
from app.models.student_exam import StudentExam, StudentAnswer
from app.models.section import Section, SectionStudent
from app.models.subject import Subject

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Statistical helpers ───

def calculate_mean(scores: list[float]) -> float:
    if not scores:
        return 0
    return sum(scores) / len(scores)


def calculate_median(scores: list[float]) -> float:
    if not scores:
        return 0
    sorted_scores = sorted(scores)
    n = len(sorted_scores)
    if n % 2 == 1:
        return sorted_scores[n // 2]
    return (sorted_scores[n // 2 - 1] + sorted_scores[n // 2]) / 2


def calculate_std_dev(scores: list[float]) -> float:
    if len(scores) < 2:
        return 0
    mean = sum(scores) / len(scores)
    variance = sum((s - mean) ** 2 for s in scores) / (len(scores) - 1)
    return math.sqrt(variance)


def calculate_discrimination_index(
    top_scores: list[bool], bottom_scores: list[bool]
) -> float:
    """Calculate discrimination index for a question.
    top_scores and bottom_scores are lists of bool indicating correct/incorrect
    for top 27% and bottom 27% of students by total score.
    """
    if not top_scores:
        return 0
    top_correct = sum(1 for s in top_scores if s)
    bottom_correct = sum(1 for s in bottom_scores if s)
    return (top_correct - bottom_correct) / len(top_scores)


# ─── Exam analytics ───

@router.get("/exam/{exam_id}")
async def exam_analytics(
    exam_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Full psychometric analysis of an exam."""
    eid = parse_uuid(exam_id, "exam_id")

    exam = (await db.execute(
        select(Exam).where(Exam.id == eid, Exam.profesor_id == user.id)
    )).scalar_one_or_none()
    if not exam:
        raise HTTPException(404, "Examen no encontrado")

    # Get all corrected student exams
    student_exams = (await db.execute(
        select(StudentExam).where(
            StudentExam.exam_id == eid,
            StudentExam.status.in_(["corrected", "published"]),
            StudentExam.percentage.isnot(None),
        )
    )).scalars().all()

    if not student_exams:
        return {
            "exam_id": str(eid),
            "title": exam.title,
            "total_attempts": 0,
            "overall": None,
            "questions": [],
        }

    # Overall statistics
    percentages = [float(se.percentage) for se in student_exams]
    total_scores = [float(se.total_score) for se in student_exams if se.total_score]
    pass_count = sum(1 for p in percentages if p >= 50)

    # Score distribution histogram (bins of 10%)
    histogram = []
    for lo in range(0, 100, 10):
        hi = lo + 10
        label = f"{lo}-{hi}"
        count = sum(1 for p in percentages if lo <= p < hi)
        if lo == 90:  # Include 100 in last bin
            count = sum(1 for p in percentages if lo <= p <= 100)
        histogram.append({"range": label, "count": count})

    overall = {
        "mean": round(calculate_mean(percentages), 1),
        "median": round(calculate_median(percentages), 1),
        "std_dev": round(calculate_std_dev(percentages), 2),
        "pass_rate": round((pass_count / len(percentages)) * 100, 1) if percentages else 0,
        "min_score": round(min(percentages), 1) if percentages else 0,
        "max_score": round(max(percentages), 1) if percentages else 0,
        "score_distribution": histogram,
    }

    # Sort student exams by total score for discrimination index calculation
    sorted_se = sorted(student_exams, key=lambda se: float(se.total_score or 0))
    n = len(sorted_se)
    top_n = max(1, round(n * 0.27))
    bottom_group = sorted_se[:top_n]
    top_group = sorted_se[-top_n:]
    bottom_se_ids = {se.id for se in bottom_group}
    top_se_ids = {se.id for se in top_group}

    # Get all questions
    questions = (await db.execute(
        select(ExamQuestion)
        .where(ExamQuestion.exam_id == eid)
        .order_by(ExamQuestion.order_index)
    )).scalars().all()

    # Batch-load all student answers for this exam
    se_ids = [se.id for se in student_exams]
    all_answers = []
    if se_ids:
        all_answers = (await db.execute(
            select(StudentAnswer).where(StudentAnswer.student_exam_id.in_(se_ids))
        )).scalars().all()

    # Group answers by question_id
    answers_by_question: dict[uuid.UUID, list[StudentAnswer]] = {}
    for a in all_answers:
        if a.question_id:
            answers_by_question.setdefault(a.question_id, []).append(a)

    # Per-question analysis
    question_analytics = []
    for q in questions:
        q_answers = answers_by_question.get(q.id, [])
        total_attempts = len(q_answers)

        if total_attempts == 0:
            question_analytics.append({
                "question_number": q.question_number,
                "question_text": q.question_text[:200] if q.question_text else None,
                "question_type": q.question_type,
                "points": float(q.points),
                "difficulty_index": None,
                "discrimination_index": None,
                "total_attempts": 0,
                "correct_count": 0,
                "avg_score": 0,
            })
            continue

        correct_count = sum(1 for a in q_answers if a.is_correct)
        difficulty_index = correct_count / total_attempts

        # Discrimination index: compare top 27% vs bottom 27%
        top_answers = [a.is_correct for a in q_answers if a.student_exam_id in top_se_ids]
        bottom_answers = [a.is_correct for a in q_answers if a.student_exam_id in bottom_se_ids]
        disc_index = calculate_discrimination_index(top_answers, bottom_answers)

        # Average score for this question
        q_scores = [float(a.score) for a in q_answers if a.score is not None]
        avg_score = calculate_mean(q_scores) if q_scores else 0

        # Option distribution for MC questions
        option_dist = None
        if q.question_type == "multiple_choice" and q.options:
            option_dist = {}
            for a in q_answers:
                answer_text = (a.answer_text or "").strip()
                if answer_text:
                    option_dist[answer_text] = option_dist.get(answer_text, 0) + 1

        result = {
            "question_number": q.question_number,
            "question_text": q.question_text[:200] if q.question_text else None,
            "question_type": q.question_type,
            "points": float(q.points),
            "difficulty_index": round(difficulty_index, 3),
            "discrimination_index": round(disc_index, 3),
            "total_attempts": total_attempts,
            "correct_count": correct_count,
            "avg_score": round(avg_score, 2),
        }
        if option_dist:
            result["option_distribution"] = option_dist

        question_analytics.append(result)

    return {
        "exam_id": str(eid),
        "title": exam.title,
        "total_attempts": len(student_exams),
        "overall": overall,
        "questions": question_analytics,
    }


# ─── At-risk students ───

@router.get("/at-risk")
async def at_risk_students(
    section_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Identify at-risk students in a section."""
    sid = parse_uuid(section_id, "section_id")

    # Verify section ownership
    section = (await db.execute(
        select(Section).join(Subject, Subject.id == Section.subject_id)
        .where(Section.id == sid, Subject.profesor_id == user.id)
    )).scalar_one_or_none()
    if not section:
        raise HTTPException(404, "Seccion no encontrada o no te pertenece")

    # Get students in section
    students = (await db.execute(
        select(User)
        .join(SectionStudent, SectionStudent.student_id == User.id)
        .where(SectionStudent.section_id == sid)
    )).scalars().all()

    if not students:
        return []

    # Get all exams for this section
    exams = (await db.execute(
        select(Exam).where(Exam.section_id == sid).order_by(Exam.created_at)
    )).scalars().all()
    exam_ids = [e.id for e in exams]

    if not exam_ids:
        return []

    # Get all student exams for these exams
    all_se = (await db.execute(
        select(StudentExam).where(
            StudentExam.exam_id.in_(exam_ids),
            StudentExam.status.in_(["corrected", "published"]),
            StudentExam.percentage.isnot(None),
            StudentExam.student_id.isnot(None),
        ).order_by(StudentExam.created_at)
    )).scalars().all()

    # Group by student
    se_by_student: dict[uuid.UUID, list[StudentExam]] = {}
    for se in all_se:
        se_by_student.setdefault(se.student_id, []).append(se)

    # Calculate class average
    all_percentages = [float(se.percentage) for se in all_se]
    class_avg = calculate_mean(all_percentages) if all_percentages else 50

    results = []
    for student in students:
        student_ses = se_by_student.get(student.id, [])
        if not student_ses:
            continue

        percentages = [float(se.percentage) for se in student_ses]
        avg = calculate_mean(percentages)

        risk_level = None
        risk_factors = []

        # High risk: average below passing (50%)
        if avg < 50:
            risk_level = "high"
            risk_factors.append(f"Promedio ({avg:.1f}%) debajo del aprobatorio")

        # Medium risk: declining trend over last 3 exams
        if len(percentages) >= 3:
            last_three = percentages[-3:]
            if last_three[0] > last_three[1] > last_three[2]:
                if risk_level != "high":
                    risk_level = "medium"
                risk_factors.append("Tendencia descendente en ultimos 3 examenes")

        # Low risk: below class average
        if avg < class_avg:
            if risk_level is None:
                risk_level = "low"
            risk_factors.append(f"Por debajo del promedio de la clase ({class_avg:.1f}%)")

        if risk_level:
            results.append({
                "student_id": str(student.id),
                "student_name": f"{student.first_name} {student.last_name}",
                "student_email": student.email,
                "risk_level": risk_level,
                "risk_factors": risk_factors,
                "average_score": round(avg, 1),
                "total_exams": len(percentages),
                "recent_scores": [round(p, 1) for p in percentages[-5:]],
            })

    # Sort by risk level: high first, then medium, then low
    risk_order = {"high": 0, "medium": 1, "low": 2}
    results.sort(key=lambda r: risk_order.get(r["risk_level"], 3))

    return results


# ─── Single question stats ───

@router.get("/question/{question_id}")
async def question_analytics(
    question_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Detailed analytics for a single question."""
    qid = parse_uuid(question_id, "question_id")

    question = (await db.execute(
        select(ExamQuestion).where(ExamQuestion.id == qid)
    )).scalar_one_or_none()
    if not question:
        raise HTTPException(404, "Pregunta no encontrada")

    # Verify exam ownership
    exam = (await db.execute(
        select(Exam).where(Exam.id == question.exam_id, Exam.profesor_id == user.id)
    )).scalar_one_or_none()
    if not exam:
        raise HTTPException(403, "No tienes acceso a esta pregunta")

    # Get all answers for this question
    answers = (await db.execute(
        select(StudentAnswer).where(StudentAnswer.question_id == qid)
    )).scalars().all()

    if not answers:
        return {
            "question_id": str(qid),
            "question_number": question.question_number,
            "question_text": question.question_text,
            "question_type": question.question_type,
            "points": float(question.points),
            "total_attempts": 0,
            "stats": None,
        }

    scores = [float(a.score) for a in answers if a.score is not None]
    correct_count = sum(1 for a in answers if a.is_correct)
    total = len(answers)

    # Option distribution for MC
    option_dist = None
    if question.question_type == "multiple_choice":
        option_dist = {}
        for a in answers:
            answer_text = (a.answer_text or "").strip()
            if answer_text:
                option_dist[answer_text] = option_dist.get(answer_text, 0) + 1

    stats = {
        "mean_score": round(calculate_mean(scores), 2) if scores else 0,
        "median_score": round(calculate_median(scores), 2) if scores else 0,
        "std_dev": round(calculate_std_dev(scores), 2) if scores else 0,
        "min_score": round(min(scores), 2) if scores else 0,
        "max_score": round(max(scores), 2) if scores else 0,
        "difficulty_index": round(correct_count / total, 3) if total else 0,
        "correct_count": correct_count,
        "incorrect_count": total - correct_count,
    }
    if option_dist:
        stats["option_distribution"] = option_dist

    # Score distribution
    score_bins = []
    max_points = float(question.points)
    if max_points > 0 and scores:
        bin_size = max_points / 5
        for i in range(5):
            lo = round(i * bin_size, 2)
            hi = round((i + 1) * bin_size, 2)
            count = sum(1 for s in scores if lo <= s < hi)
            if i == 4:  # Include max in last bin
                count = sum(1 for s in scores if lo <= s <= hi)
            score_bins.append({"range": f"{lo}-{hi}", "count": count})
        stats["score_distribution"] = score_bins

    return {
        "question_id": str(qid),
        "question_number": question.question_number,
        "question_text": question.question_text,
        "question_type": question.question_type,
        "points": float(question.points),
        "total_attempts": total,
        "stats": stats,
    }
