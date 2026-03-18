"""Parent portal: link to students, view progress and dashboard."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.utils import parse_uuid
from app.models.user import User
from app.models.parent import ParentStudentLink
from app.models.student_exam import StudentExam
from app.models.exam import Exam
from app.models.section import Section, SectionStudent
from app.models.subject import Subject
from app.schemas.features import (
    ParentLinkRequest, ParentLinkResponse, ParentDashboardResponse, ParentChildProgressResponse
)

router = APIRouter()


def _require_padre(user: User):
    """Validate that the user has the padre role."""
    if user.role != "padre":
        raise HTTPException(403, "Solo usuarios con rol 'padre' pueden acceder a esta sección")


def _link_response(link: ParentStudentLink, student: User) -> ParentLinkResponse:
    return ParentLinkResponse(
        id=str(link.id),
        student_id=str(link.student_id),
        student_name=f"{student.first_name} {student.last_name}",
        student_email=student.email,
        relationship=link.relationship,
        status=link.status,
        created_at=link.created_at.isoformat(),
    )


# ─── Link Management ───

@router.post("/link", response_model=ParentLinkResponse, status_code=201)
async def link_student(
    data: ParentLinkRequest,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user),
):
    """Link parent to student by student email. Creates a pending link."""
    _require_padre(user)

    # Find student by email
    student = (await db.execute(
        select(User).where(User.email == data.student_email, User.role == "alumno")
    )).scalar_one_or_none()
    if not student:
        raise HTTPException(404, "No se encontró un alumno con ese email")

    # Check for existing link
    existing = (await db.execute(
        select(ParentStudentLink).where(
            ParentStudentLink.parent_id == user.id,
            ParentStudentLink.student_id == student.id,
        )
    )).scalar_one_or_none()
    if existing:
        if existing.status == "revoked":
            # Reactivate
            existing.status = "pending"
            existing.relationship = data.relationship
            existing.confirmed_at = None
            await db.commit()
            return _link_response(existing, student)
        raise HTTPException(400, "Ya existe un vínculo con este alumno")

    link = ParentStudentLink(
        parent_id=user.id,
        student_id=student.id,
        relationship=data.relationship,
        status="pending",
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)
    return _link_response(link, student)


@router.get("/children", response_model=list[ParentLinkResponse])
async def list_children(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """List all linked children for the parent."""
    _require_padre(user)

    rows = (await db.execute(
        select(ParentStudentLink, User)
        .join(User, User.id == ParentStudentLink.student_id)
        .where(ParentStudentLink.parent_id == user.id)
        .order_by(ParentStudentLink.created_at)
    )).all()

    return [_link_response(link, student) for link, student in rows]


@router.post("/link/{link_id}/confirm", response_model=ParentLinkResponse)
async def confirm_link(
    link_id: str,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user),
):
    """Student confirms parent link. Only the student can confirm."""
    lid = parse_uuid(link_id, "link_id")
    link = (await db.execute(
        select(ParentStudentLink).where(ParentStudentLink.id == lid)
    )).scalar_one_or_none()
    if not link:
        raise HTTPException(404, "Vínculo no encontrado")

    # Only the student can confirm
    if link.student_id != user.id:
        raise HTTPException(403, "Solo el alumno puede confirmar el vínculo")
    if link.status == "active":
        raise HTTPException(400, "El vínculo ya está activo")
    if link.status == "revoked":
        raise HTTPException(400, "El vínculo fue revocado")

    link.status = "active"
    link.confirmed_at = datetime.now(timezone.utc)
    await db.commit()

    student = (await db.execute(select(User).where(User.id == link.student_id))).scalar_one()
    return _link_response(link, student)


@router.delete("/link/{link_id}")
async def revoke_link(
    link_id: str,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user),
):
    """Revoke a parent-student link. Either parent or student can revoke."""
    lid = parse_uuid(link_id, "link_id")
    link = (await db.execute(
        select(ParentStudentLink).where(ParentStudentLink.id == lid)
    )).scalar_one_or_none()
    if not link:
        raise HTTPException(404, "Vínculo no encontrado")

    # Only the parent or the student can revoke
    if link.parent_id != user.id and link.student_id != user.id:
        raise HTTPException(403, "No tienes permisos para revocar este vínculo")

    link.status = "revoked"
    await db.commit()
    return {"ok": True}


# ─── Dashboard & Progress ───

@router.get("/dashboard", response_model=ParentDashboardResponse)
async def parent_dashboard(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Parent dashboard with summaries for all active linked children."""
    _require_padre(user)

    # Get active links
    links = (await db.execute(
        select(ParentStudentLink, User)
        .join(User, User.id == ParentStudentLink.student_id)
        .where(
            ParentStudentLink.parent_id == user.id,
            ParentStudentLink.status == "active",
        )
    )).all()

    children = []
    for link, student in links:
        # Average score
        avg = (await db.execute(
            select(func.avg(StudentExam.percentage)).where(
                StudentExam.student_id == student.id,
                StudentExam.status == "corrected",
            )
        )).scalar()
        average_score = float(avg) if avg else None

        # Recent exams (last 5)
        recent_rows = (await db.execute(
            select(StudentExam, Exam.title)
            .join(Exam, Exam.id == StudentExam.exam_id)
            .where(StudentExam.student_id == student.id)
            .order_by(desc(StudentExam.created_at))
            .limit(5)
        )).all()
        recent_exams = [
            {
                "id": str(se.id),
                "title": title,
                "score": float(se.total_score) if se.total_score else None,
                "percentage": float(se.percentage) if se.percentage else None,
                "status": se.status,
                "date": (se.corrected_at or se.created_at).isoformat(),
            }
            for se, title in recent_rows
        ]

        # Subjects list
        section_ids = (await db.execute(
            select(SectionStudent.section_id).where(SectionStudent.student_id == student.id)
        )).scalars().all()
        subjects = []
        if section_ids:
            subj_rows = (await db.execute(
                select(Subject.name, Subject.color)
                .join(Section, Section.subject_id == Subject.id)
                .where(Section.id.in_(section_ids))
                .distinct()
            )).all()
            subjects = [{"name": name, "color": color} for name, color in subj_rows]

        children.append({
            "student_id": str(student.id),
            "name": f"{student.first_name} {student.last_name}",
            "average_score": average_score,
            "recent_exams": recent_exams,
            "subjects": subjects,
        })

    return ParentDashboardResponse(children=children)


@router.get("/child/{student_id}/progress", response_model=ParentChildProgressResponse)
async def child_progress(
    student_id: str,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user),
):
    """Detailed progress for a specific linked child."""
    _require_padre(user)
    sid = parse_uuid(student_id, "student_id")

    # Verify active link
    link = (await db.execute(
        select(ParentStudentLink).where(
            ParentStudentLink.parent_id == user.id,
            ParentStudentLink.student_id == sid,
            ParentStudentLink.status == "active",
        )
    )).scalar_one_or_none()
    if not link:
        raise HTTPException(403, "No tienes un vínculo activo con este alumno")

    student = (await db.execute(select(User).where(User.id == sid))).scalar_one_or_none()
    if not student:
        raise HTTPException(404, "Alumno no encontrado")

    # Overall average
    avg = (await db.execute(
        select(func.avg(StudentExam.percentage)).where(
            StudentExam.student_id == sid,
            StudentExam.status == "corrected",
        )
    )).scalar()
    average_score = float(avg) if avg else None

    # Get subjects with per-subject average scores
    section_ids = (await db.execute(
        select(SectionStudent.section_id).where(SectionStudent.student_id == sid)
    )).scalars().all()

    subjects = []
    if section_ids:
        # Get subjects from enrolled sections
        subj_rows = (await db.execute(
            select(Subject, Section.id.label("section_id"))
            .join(Section, Section.subject_id == Subject.id)
            .where(Section.id.in_(section_ids))
        )).all()

        seen_subjects: set = set()
        for subj, sec_id in subj_rows:
            if subj.id in seen_subjects:
                continue
            seen_subjects.add(subj.id)

            # Get average score for exams in this subject's sections
            subj_section_ids = [s_id for s, s_id in subj_rows if s.id == subj.id]
            subj_exam_ids = (await db.execute(
                select(Exam.id).where(Exam.section_id.in_(subj_section_ids))
            )).scalars().all()

            subj_avg = None
            if subj_exam_ids:
                subj_avg_result = (await db.execute(
                    select(func.avg(StudentExam.percentage)).where(
                        StudentExam.student_id == sid,
                        StudentExam.exam_id.in_(subj_exam_ids),
                        StudentExam.status == "corrected",
                    )
                )).scalar()
                subj_avg = float(subj_avg_result) if subj_avg_result else None

            subjects.append({
                "subject_id": str(subj.id),
                "name": subj.name,
                "color": subj.color,
                "average_score": subj_avg,
                "exam_count": len(subj_exam_ids) if subj_exam_ids else 0,
            })

    # Recent exams with full details
    recent_rows = (await db.execute(
        select(StudentExam, Exam.title, Subject.name)
        .join(Exam, Exam.id == StudentExam.exam_id)
        .join(Section, Section.id == Exam.section_id)
        .join(Subject, Subject.id == Section.subject_id)
        .where(StudentExam.student_id == sid)
        .order_by(desc(StudentExam.created_at))
        .limit(20)
    )).all()

    recent_exams = [
        {
            "id": str(se.id),
            "title": title,
            "subject": subj_name,
            "score": float(se.total_score) if se.total_score else None,
            "percentage": float(se.percentage) if se.percentage else None,
            "status": se.status,
            "date": (se.corrected_at or se.created_at).isoformat(),
        }
        for se, title, subj_name in recent_rows
    ]

    return ParentChildProgressResponse(
        student_id=str(student.id),
        student_name=f"{student.first_name} {student.last_name}",
        subjects=subjects,
        recent_exams=recent_exams,
        average_score=average_score,
        attendance_rate=None,  # Not tracked yet
    )
