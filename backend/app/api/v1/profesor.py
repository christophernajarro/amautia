import uuid
import secrets
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, update
from app.core.database import get_db
from app.core.dependencies import get_profesor
from app.core.security import hash_password
from app.core.utils import parse_uuid
from app.models.user import User
from app.models.subject import Subject
from app.models.section import Section, SectionStudent
from app.models.exam import Exam
from app.models.student_exam import StudentExam
from app.schemas.profesor import (
    SubjectResponse, SubjectCreateRequest, SubjectUpdateRequest,
    SectionResponse, SectionCreateRequest, SectionUpdateRequest,
    StudentResponse, AddStudentRequest,
    ExamResponse, ExamCreateRequest, ProfesorDashboard, ScoreRange,
)

router = APIRouter()


async def _verify_section_ownership(db: AsyncSession, section_id, user_id):
    """Verify the section belongs to a subject owned by this professor."""
    result = await db.execute(
        select(Section).where(Section.id == section_id)
    )
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(404, "Seccion no encontrada")
    subj = await db.execute(
        select(Subject).where(Subject.id == section.subject_id, Subject.profesor_id == user_id)
    )
    if not subj.scalar_one_or_none():
        raise HTTPException(403, "No tienes permisos sobre esta seccion")
    return section


def _gen_code():
    return secrets.token_hex(4).upper()[:8]


# ─── Dashboard ───

@router.get("/dashboard", response_model=ProfesorDashboard)
async def profesor_dashboard(db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    total_subjects = (await db.execute(select(func.count(Subject.id)).where(Subject.profesor_id == user.id))).scalar() or 0
    subject_ids = (await db.execute(select(Subject.id).where(Subject.profesor_id == user.id))).scalars().all()
    total_sections = 0
    total_students = 0
    if subject_ids:
        total_sections = (await db.execute(select(func.count(Section.id)).where(Section.subject_id.in_(subject_ids)))).scalar() or 0
        section_ids = (await db.execute(select(Section.id).where(Section.subject_id.in_(subject_ids)))).scalars().all()
        if section_ids:
            total_students = (await db.execute(select(func.count(SectionStudent.id)).where(SectionStudent.section_id.in_(section_ids)))).scalar() or 0
    total_exams = (await db.execute(select(func.count(Exam.id)).where(Exam.profesor_id == user.id))).scalar() or 0
    recent = (await db.execute(select(Exam).where(Exam.profesor_id == user.id).order_by(desc(Exam.created_at)).limit(5))).scalars().all()
    recent_exams = [ExamResponse(id=str(e.id), title=e.title, description=e.description, section_id=str(e.section_id),
                    profesor_id=str(e.profesor_id), total_points=float(e.total_points), grading_scale=e.grading_scale,
                    status=e.status, created_at=e.created_at.isoformat()) for e in recent]

    # Analytics: score distribution, average, pass rate
    average_score = 0.0
    pass_rate = 0.0
    score_distribution: list[ScoreRange] = []

    exam_ids = (await db.execute(select(Exam.id).where(Exam.profesor_id == user.id))).scalars().all()
    if exam_ids:
        percentages = (await db.execute(
            select(StudentExam.percentage).where(
                StudentExam.exam_id.in_(exam_ids),
                StudentExam.status == "corrected",
                StudentExam.percentage.isnot(None),
            )
        )).scalars().all()
        scores = [float(p) for p in percentages]
        if scores:
            average_score = sum(scores) / len(scores)
            pass_rate = (sum(1 for s in scores if s >= 50) / len(scores)) * 100
            ranges = [
                ("0-5", 0, 25), ("6-10", 26, 50), ("11-13", 51, 65),
                ("14-16", 66, 80), ("17-18", 81, 90), ("19-20", 91, 100),
            ]
            score_distribution = [
                ScoreRange(range=r, count=sum(1 for s in scores if mn <= s <= mx))
                for r, mn, mx in ranges
            ]

    return ProfesorDashboard(
        total_subjects=total_subjects, total_sections=total_sections,
        total_students=total_students, total_exams=total_exams, recent_exams=recent_exams,
        average_score=round(average_score, 1), pass_rate=round(pass_rate, 1),
        score_distribution=score_distribution,
    )


# ─── Subjects CRUD ───

@router.get("/subjects", response_model=list[SubjectResponse])
async def list_subjects(db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    # Single query with subqueries to avoid N+1
    sec_count_sub = (
        select(func.count(Section.id))
        .where(Section.subject_id == Subject.id)
        .correlate(Subject)
        .scalar_subquery()
    )
    stu_count_sub = (
        select(func.count(SectionStudent.id))
        .join(Section, Section.id == SectionStudent.section_id)
        .where(Section.subject_id == Subject.id)
        .correlate(Subject)
        .scalar_subquery()
    )
    result = await db.execute(
        select(Subject, sec_count_sub.label("sec_count"), stu_count_sub.label("stu_count"))
        .where(Subject.profesor_id == user.id)
        .order_by(Subject.name)
    )
    return [
        SubjectResponse(
            id=str(s.id), name=s.name, description=s.description, color=s.color,
            icon=s.icon, profesor_id=str(s.profesor_id), sections_count=sec_count,
            students_count=stu_count, created_at=s.created_at.isoformat(),
        )
        for s, sec_count, stu_count in result.all()
    ]


@router.post("/subjects", response_model=SubjectResponse, status_code=201)
async def create_subject(data: SubjectCreateRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    subject = Subject(name=data.name, description=data.description, color=data.color, icon=data.icon, profesor_id=user.id)
    db.add(subject)
    await db.commit()
    await db.refresh(subject)
    return SubjectResponse(id=str(subject.id), name=subject.name, description=subject.description, color=subject.color,
            icon=subject.icon, profesor_id=str(subject.profesor_id), created_at=subject.created_at.isoformat())


@router.put("/subjects/{subject_id}", response_model=SubjectResponse)
async def update_subject(subject_id: str, data: SubjectUpdateRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    result = await db.execute(select(Subject).where(Subject.id == subject_id, Subject.profesor_id == user.id))
    subject = result.scalar_one_or_none()
    if not subject:
        raise HTTPException(404, "Materia no encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(subject, field, value)
    await db.commit()
    await db.refresh(subject)
    return SubjectResponse(id=str(subject.id), name=subject.name, description=subject.description, color=subject.color,
            icon=subject.icon, profesor_id=str(subject.profesor_id), created_at=subject.created_at.isoformat())


@router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    result = await db.execute(select(Subject).where(Subject.id == subject_id, Subject.profesor_id == user.id))
    subject = result.scalar_one_or_none()
    if not subject:
        raise HTTPException(404, "Materia no encontrada")
    await db.delete(subject)
    await db.commit()
    return {"ok": True}


# ─── Sections CRUD ───

@router.get("/subjects/{subject_id}/sections", response_model=list[SectionResponse])
async def list_sections(subject_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    # Verify ownership
    subj = await db.execute(select(Subject).where(Subject.id == subject_id, Subject.profesor_id == user.id))
    if not subj.scalar_one_or_none():
        raise HTTPException(404, "Materia no encontrada")
    result = await db.execute(select(Section).where(Section.subject_id == subject_id).order_by(Section.name))
    sections = result.scalars().all()
    responses = []
    for s in sections:
        stu_count = (await db.execute(select(func.count(SectionStudent.id)).where(SectionStudent.section_id == s.id))).scalar() or 0
        responses.append(SectionResponse(id=str(s.id), name=s.name, subject_id=str(s.subject_id),
                class_code=s.class_code, academic_period=s.academic_period, is_active=s.is_active,
                students_count=stu_count, created_at=s.created_at.isoformat()))
    return responses


@router.post("/subjects/{subject_id}/sections", response_model=SectionResponse, status_code=201)
async def create_section(subject_id: str, data: SectionCreateRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    subj = await db.execute(select(Subject).where(Subject.id == subject_id, Subject.profesor_id == user.id))
    if not subj.scalar_one_or_none():
        raise HTTPException(404, "Materia no encontrada")
    section = Section(name=data.name, subject_id=parse_uuid(subject_id, "subject_id"), class_code=_gen_code(), academic_period=data.academic_period)
    db.add(section)
    await db.commit()
    await db.refresh(section)
    return SectionResponse(id=str(section.id), name=section.name, subject_id=str(section.subject_id),
            class_code=section.class_code, academic_period=section.academic_period, is_active=section.is_active,
            students_count=0, created_at=section.created_at.isoformat())


@router.put("/sections/{section_id}", response_model=SectionResponse)
async def update_section(section_id: str, data: SectionUpdateRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    result = await db.execute(select(Section).where(Section.id == section_id))
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(404, "Sección no encontrada")
    # Verify ownership via subject
    subj = await db.execute(select(Subject).where(Subject.id == section.subject_id, Subject.profesor_id == user.id))
    if not subj.scalar_one_or_none():
        raise HTTPException(403, "No tienes permisos")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(section, field, value)
    await db.commit()
    await db.refresh(section)
    stu_count = (await db.execute(select(func.count(SectionStudent.id)).where(SectionStudent.section_id == section.id))).scalar() or 0
    return SectionResponse(id=str(section.id), name=section.name, subject_id=str(section.subject_id),
            class_code=section.class_code, academic_period=section.academic_period, is_active=section.is_active,
            students_count=stu_count, created_at=section.created_at.isoformat())


@router.delete("/sections/{section_id}")
async def delete_section(section_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    result = await db.execute(select(Section).where(Section.id == section_id))
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(404, "Sección no encontrada")
    subj = await db.execute(select(Subject).where(Subject.id == section.subject_id, Subject.profesor_id == user.id))
    if not subj.scalar_one_or_none():
        raise HTTPException(403, "No tienes permisos")
    await db.delete(section)
    await db.commit()
    return {"ok": True}


@router.post("/sections/{section_id}/regenerate-code")
async def regenerate_code(section_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    section = await _verify_section_ownership(db, section_id, user.id)
    section.class_code = _gen_code()
    await db.commit()
    return {"class_code": section.class_code}


# ─── Students ───

@router.get("/sections/{section_id}/students", response_model=list[StudentResponse])
async def list_students(section_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    await _verify_section_ownership(db, section_id, user.id)
    result = await db.execute(
        select(User, SectionStudent.joined_at)
        .join(SectionStudent, SectionStudent.student_id == User.id)
        .where(SectionStudent.section_id == section_id)
        .order_by(User.last_name)
    )
    rows = result.all()
    return [StudentResponse(id=str(u.id), email=u.email, first_name=u.first_name, last_name=u.last_name,
            phone=u.phone, joined_at=joined.isoformat()) for u, joined in rows]


@router.post("/sections/{section_id}/students", response_model=StudentResponse, status_code=201)
async def add_student(section_id: str, data: AddStudentRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    await _verify_section_ownership(db, section_id, user.id)
    # Find or create student
    result = await db.execute(select(User).where(User.email == data.email))
    student = result.scalar_one_or_none()
    if not student:
        default_pw = data.password or secrets.token_urlsafe(12)
        student = User(email=data.email, password_hash=hash_password(default_pw),
                       first_name=data.first_name, last_name=data.last_name, role="alumno",
                       is_active=True, is_verified=True)
        db.add(student)
        await db.flush()
    # Check if already in section
    existing = await db.execute(select(SectionStudent).where(
        SectionStudent.section_id == section_id, SectionStudent.student_id == student.id))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Alumno ya está en esta sección")
    ss = SectionStudent(section_id=parse_uuid(section_id, "section_id"), student_id=student.id)
    db.add(ss)
    await db.commit()
    return StudentResponse(id=str(student.id), email=student.email, first_name=student.first_name,
            last_name=student.last_name, phone=student.phone, joined_at=ss.joined_at.isoformat())


@router.delete("/sections/{section_id}/students/{student_id}")
async def remove_student(section_id: str, student_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    await _verify_section_ownership(db, section_id, user.id)
    result = await db.execute(select(SectionStudent).where(
        SectionStudent.section_id == section_id, SectionStudent.student_id == student_id))
    ss = result.scalar_one_or_none()
    if not ss:
        raise HTTPException(404, "Alumno no encontrado en la sección")
    await db.delete(ss)
    await db.commit()
    return {"ok": True}


# ─── Exams ───

@router.get("/exams", response_model=list[ExamResponse])
async def list_exams(section_id: str | None = None, skip: int = 0, limit: int = 50,
                     db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    q = select(Exam).where(Exam.profesor_id == user.id)
    if section_id:
        q = q.where(Exam.section_id == section_id)
    q = q.order_by(desc(Exam.created_at)).offset(skip).limit(limit)
    result = await db.execute(q)
    exams = result.scalars().all()
    return [ExamResponse(id=str(e.id), title=e.title, description=e.description, section_id=str(e.section_id),
            profesor_id=str(e.profesor_id), total_points=float(e.total_points), grading_scale=e.grading_scale,
            status=e.status, created_at=e.created_at.isoformat()) for e in exams]


@router.post("/exams", response_model=ExamResponse, status_code=201)
async def create_exam(data: ExamCreateRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    if data.total_points <= 0:
        raise HTTPException(400, "El puntaje total debe ser mayor a 0")
    # Verify section exists and belongs to this profesor
    section = (await db.execute(
        select(Section).join(Subject, Subject.id == Section.subject_id)
        .where(Section.id == data.section_id, Subject.profesor_id == user.id)
    )).scalar_one_or_none()
    if not section:
        raise HTTPException(404, "Sección no encontrada o no te pertenece")
    exam = Exam(title=data.title, description=data.description, section_id=parse_uuid(data.section_id, "section_id"),
                profesor_id=user.id, total_points=data.total_points, grading_scale=data.grading_scale)
    db.add(exam)
    await db.commit()
    await db.refresh(exam)
    return ExamResponse(id=str(exam.id), title=exam.title, description=exam.description, section_id=str(exam.section_id),
            profesor_id=str(exam.profesor_id), total_points=float(exam.total_points), grading_scale=exam.grading_scale,
            status=exam.status, created_at=exam.created_at.isoformat())


@router.get("/exams/{exam_id}", response_model=ExamResponse)
async def get_exam(exam_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    result = await db.execute(select(Exam).where(Exam.id == exam_id, Exam.profesor_id == user.id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(404, "Examen no encontrado")
    return ExamResponse(id=str(exam.id), title=exam.title, description=exam.description, section_id=str(exam.section_id),
            profesor_id=str(exam.profesor_id), total_points=float(exam.total_points), grading_scale=exam.grading_scale,
            status=exam.status, created_at=exam.created_at.isoformat())


@router.delete("/exams/{exam_id}")
async def delete_exam(exam_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    result = await db.execute(select(Exam).where(Exam.id == exam_id, Exam.profesor_id == user.id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(404, "Examen no encontrado")
    await db.delete(exam)
    await db.commit()
    return {"ok": True}


@router.post("/sections/{section_id}/import-csv")
async def import_students_csv(section_id: str, file: UploadFile = File(...),
                               db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    """Import students from CSV. Columns: email, first_name, last_name (optional: phone)"""
    import csv, io
    from app.core.security import hash_password
    from app.models.section import SectionStudent

    content = await file.read()
    text = content.decode("utf-8-sig")  # Handle BOM
    reader = csv.DictReader(io.StringIO(text))

    created, skipped, errors = 0, 0, []

    for row in reader:
        email = (row.get("email") or row.get("Email") or "").strip().lower()
        first_name = (row.get("first_name") or row.get("nombre") or row.get("Nombre") or "").strip()
        last_name = (row.get("last_name") or row.get("apellido") or row.get("Apellido") or "").strip()
        phone = (row.get("phone") or row.get("telefono") or "").strip()

        if not email:
            errors.append(f"Fila sin email: {row}")
            continue

        from sqlalchemy import select as sel
        existing = (await db.execute(sel(User).where(User.email == email))).scalar_one_or_none()

        if existing:
            # Just enroll if not already enrolled
            enrolled = (await db.execute(
                sel(SectionStudent).where(SectionStudent.section_id == parse_uuid(section_id, "section_id"),
                                          SectionStudent.student_id == existing.id)
            )).scalar_one_or_none()
            if not enrolled:
                db.add(SectionStudent(section_id=parse_uuid(section_id, "section_id"), student_id=existing.id))
                skipped += 1
            continue

        # Create new student
        student = User(
            email=email, password_hash=hash_password(secrets.token_urlsafe(12)),
            first_name=first_name or email.split("@")[0],
            last_name=last_name, role="alumno", is_active=True, phone=phone,
        )
        db.add(student)
        await db.flush()
        db.add(SectionStudent(section_id=parse_uuid(section_id, "section_id"), student_id=student.id))
        created += 1

        # Welcome email
        import asyncio
        from app.services.email_service import send_welcome
        asyncio.create_task(send_welcome(email, f"{first_name} {last_name}", "alumno"))

    await db.commit()
    return {"created": created, "enrolled_existing": skipped, "errors": len(errors), "error_details": errors[:5]}
