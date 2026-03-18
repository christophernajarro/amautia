import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, distinct
from app.core.database import get_db
from app.core.dependencies import get_alumno
from app.models.user import User
from app.models.subject import Subject
from app.models.section import Section, SectionStudent
from app.models.exam import Exam
from app.models.student_exam import StudentExam
from app.models.tutor import PracticeExercise, StudyPlan
from app.schemas.alumno import (
    JoinSectionRequest, AlumnoDashboard, AlumnoSectionResponse, AlumnoExamResponse,
    RecentExamItem,
)

router = APIRouter()


@router.get("/dashboard", response_model=AlumnoDashboard)
async def alumno_dashboard(db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    section_ids = (await db.execute(
        select(SectionStudent.section_id).where(SectionStudent.student_id == user.id)
    )).scalars().all()
    total_sections = len(section_ids)

    # Count distinct subjects from enrolled sections
    total_subjects = 0
    if section_ids:
        total_subjects = (await db.execute(
            select(func.count(distinct(Section.subject_id)))
            .where(Section.id.in_(section_ids))
        )).scalar() or 0

    total_exams = 0
    avg_score = None
    recent_exams: list[RecentExamItem] = []
    if section_ids:
        total_exams = (await db.execute(
            select(func.count(StudentExam.id)).where(StudentExam.student_id == user.id)
        )).scalar() or 0
        avg = (await db.execute(
            select(func.avg(StudentExam.percentage)).where(
                StudentExam.student_id == user.id, StudentExam.status == "corrected")
        )).scalar()
        avg_score = float(avg) if avg else None

        # Recent exams (last 5)
        recent_rows = (await db.execute(
            select(StudentExam, Exam.title)
            .join(Exam, Exam.id == StudentExam.exam_id)
            .where(StudentExam.student_id == user.id)
            .order_by(desc(StudentExam.created_at))
            .limit(5)
        )).all()
        recent_exams = [
            RecentExamItem(
                id=str(se.id),
                title=title,
                date=(se.corrected_at or se.created_at).isoformat(),
                score=float(se.total_score) if se.total_score is not None else None,
                status=se.status,
            )
            for se, title in recent_rows
        ]

    # Exercises completed (from PracticeExercise model)
    exercises_completed = (await db.execute(
        select(func.count(PracticeExercise.id)).where(
            PracticeExercise.student_id == user.id,
            PracticeExercise.completed_at.isnot(None),
        )
    )).scalar() or 0

    # Accuracy: correct / completed exercises
    correct_exercises = (await db.execute(
        select(func.count(PracticeExercise.id)).where(
            PracticeExercise.student_id == user.id,
            PracticeExercise.is_correct == True,
        )
    )).scalar() or 0
    accuracy = (correct_exercises / exercises_completed * 100) if exercises_completed else 0

    # Active study plans
    active_plans = (await db.execute(
        select(func.count(StudyPlan.id)).where(
            StudyPlan.student_id == user.id,
            StudyPlan.status == "active",
        )
    )).scalar() or 0

    return AlumnoDashboard(
        total_sections=total_sections,
        total_subjects=total_subjects,
        total_exams=total_exams,
        average_score=avg_score,
        exercises_completed=exercises_completed,
        accuracy=round(accuracy, 1),
        active_plans=active_plans,
        recent_exams=recent_exams,
    )


@router.post("/join")
async def join_section(data: JoinSectionRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    result = await db.execute(select(Section).where(Section.class_code == data.class_code, Section.is_active == True))
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(404, "Código de clase no encontrado o sección inactiva")
    existing = await db.execute(select(SectionStudent).where(
        SectionStudent.section_id == section.id, SectionStudent.student_id == user.id))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Ya estás inscrito en esta sección")
    ss = SectionStudent(section_id=section.id, student_id=user.id)
    db.add(ss)
    await db.commit()
    # Get subject info
    subj = (await db.execute(select(Subject).where(Subject.id == section.subject_id))).scalar_one()
    return {"ok": True, "section": section.name, "subject": subj.name}


@router.get("/sections", response_model=list[AlumnoSectionResponse])
async def my_sections(db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    result = await db.execute(
        select(Section, Subject, SectionStudent.joined_at, User.first_name, User.last_name)
        .join(SectionStudent, SectionStudent.section_id == Section.id)
        .join(Subject, Subject.id == Section.subject_id)
        .join(User, User.id == Subject.profesor_id)
        .where(SectionStudent.student_id == user.id)
    )
    rows = result.all()
    return [AlumnoSectionResponse(
        id=str(sec.id), name=sec.name, subject_id=str(subj.id), subject_name=subj.name,
        subject_color=subj.color, class_code=sec.class_code,
        profesor_name=f"{fname} {lname}", joined_at=joined.isoformat()
    ) for sec, subj, joined, fname, lname in rows]


@router.get("/exams", response_model=list[AlumnoExamResponse])
async def my_exams(skip: int = 0, limit: int = 50,
                   db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    result = await db.execute(
        select(StudentExam, Exam.title, Subject.name)
        .join(Exam, Exam.id == StudentExam.exam_id)
        .join(Section, Section.id == Exam.section_id)
        .join(Subject, Subject.id == Section.subject_id)
        .where(StudentExam.student_id == user.id, Exam.status == "published")
        .order_by(desc(StudentExam.created_at))
        .offset(skip).limit(limit)
    )
    rows = result.all()
    return [AlumnoExamResponse(
        id=str(se.id), exam_title=title, subject_name=subj_name,
        total_score=float(se.total_score) if se.total_score else None,
        percentage=float(se.percentage) if se.percentage else None,
        status=se.status, corrected_at=se.corrected_at.isoformat() if se.corrected_at else None
    ) for se, title, subj_name in rows]


@router.get("/stats")
async def my_stats(db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    total = (await db.execute(select(func.count(StudentExam.id)).where(StudentExam.student_id == user.id))).scalar() or 0
    corrected = (await db.execute(select(func.count(StudentExam.id)).where(
        StudentExam.student_id == user.id, StudentExam.status == "corrected"))).scalar() or 0
    avg = (await db.execute(select(func.avg(StudentExam.percentage)).where(
        StudentExam.student_id == user.id, StudentExam.status == "corrected"))).scalar()
    best = (await db.execute(select(func.max(StudentExam.percentage)).where(
        StudentExam.student_id == user.id, StudentExam.status == "corrected"))).scalar()
    return {
        "total_exams": total, "corrected_exams": corrected,
        "average_percentage": float(avg) if avg else None,
        "best_percentage": float(best) if best else None,
    }


@router.get("/exams/{student_exam_id}/resultado")
async def exam_resultado(student_exam_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    """Alumno ve el detalle de su corrección: nota por pregunta, feedback, puntaje total."""
    from app.models.student_exam import StudentAnswer
    from app.models.exam import ExamQuestion

    se = (await db.execute(
        select(StudentExam).where(StudentExam.id == student_exam_id, StudentExam.student_id == user.id)
    )).scalar_one_or_none()
    if not se:
        raise HTTPException(404, "Examen no encontrado")
    if se.status not in ("corrected", "published"):
        raise HTTPException(400, "El examen aún no ha sido corregido")

    exam = (await db.execute(select(Exam).where(Exam.id == se.exam_id))).scalar_one()

    # Students can only see results once the professor has published them
    if exam.status != "published":
        raise HTTPException(403, "Los resultados aún no han sido publicados por el profesor")

    # Get answers with question text
    answers_raw = (await db.execute(
        select(StudentAnswer, ExamQuestion)
        .outerjoin(ExamQuestion, ExamQuestion.id == StudentAnswer.question_id)
        .where(StudentAnswer.student_exam_id == se.id)
        .order_by(ExamQuestion.question_number)
    )).all()

    answers = []
    for sa, q in answers_raw:
        answers.append({
            "question_number": q.question_number if q else None,
            "question_text": q.question_text if q else None,
            "score": float(sa.score) if sa.score else 0,
            "max_score": float(sa.max_score) if sa.max_score else 0,
            "is_correct": sa.is_correct,
            "feedback": sa.feedback or "",
        })

    return {
        "exam_title": exam.title,
        "total_score": float(se.total_score) if se.total_score else None,
        "total_points": float(exam.total_points),
        "percentage": float(se.percentage) if se.percentage else None,
        "general_feedback": se.general_feedback or "",
        "corrected_at": se.corrected_at.isoformat() if se.corrected_at else None,
        "answers": answers,
    }
