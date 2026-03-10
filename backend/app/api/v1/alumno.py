import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.core.database import get_db
from app.core.dependencies import get_alumno
from app.models.user import User
from app.models.subject import Subject
from app.models.section import Section, SectionStudent
from app.models.exam import Exam
from app.models.student_exam import StudentExam
from app.schemas.alumno import (
    JoinSectionRequest, AlumnoDashboard, AlumnoSectionResponse, AlumnoExamResponse,
)

router = APIRouter()


@router.get("/dashboard", response_model=AlumnoDashboard)
async def alumno_dashboard(db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    section_ids = (await db.execute(
        select(SectionStudent.section_id).where(SectionStudent.student_id == user.id)
    )).scalars().all()
    total_sections = len(section_ids)
    total_exams = 0
    avg_score = None
    if section_ids:
        total_exams = (await db.execute(
            select(func.count(StudentExam.id)).where(StudentExam.student_id == user.id)
        )).scalar() or 0
        avg = (await db.execute(
            select(func.avg(StudentExam.percentage)).where(
                StudentExam.student_id == user.id, StudentExam.status == "corrected")
        )).scalar()
        avg_score = float(avg) if avg else None
    return AlumnoDashboard(total_sections=total_sections, total_exams=total_exams, average_score=avg_score)


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
        id=str(sec.id), name=sec.name, subject_name=subj.name, subject_color=subj.color,
        class_code=sec.class_code, profesor_name=f"{fname} {lname}", joined_at=joined.isoformat()
    ) for sec, subj, joined, fname, lname in rows]


@router.get("/exams", response_model=list[AlumnoExamResponse])
async def my_exams(db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    result = await db.execute(
        select(StudentExam, Exam.title, Subject.name)
        .join(Exam, Exam.id == StudentExam.exam_id)
        .join(Section, Section.id == Exam.section_id)
        .join(Subject, Subject.id == Section.subject_id)
        .where(StudentExam.student_id == user.id)
        .order_by(desc(StudentExam.created_at))
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
