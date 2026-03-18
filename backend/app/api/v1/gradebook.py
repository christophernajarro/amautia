"""Gradebook: periods, entries, summaries, config, auto-sync."""
import uuid
import logging
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.core.database import get_db
from app.core.dependencies import get_profesor, get_current_user
from app.core.utils import parse_uuid
from app.models.user import User
from app.models.section import Section, SectionStudent
from app.models.subject import Subject
from app.models.exam import Exam
from app.models.student_exam import StudentExam
from app.models.gradebook import GradingPeriod, GradebookEntry, GradebookConfig

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Request schemas ───

class CreateGradingPeriodRequest(BaseModel):
    section_id: str
    name: str
    weight: float = 1.0
    start_date: str | None = None
    end_date: str | None = None
    order_index: int = 1


class UpdateGradingPeriodRequest(BaseModel):
    name: str | None = None
    weight: float | None = None
    start_date: str | None = None
    end_date: str | None = None
    is_active: bool | None = None
    order_index: int | None = None


class CreateGradebookEntryRequest(BaseModel):
    student_id: str
    section_id: str
    grading_period_id: str | None = None
    exam_id: str | None = None
    category: str  # exam, homework, participation, project
    title: str
    score: float
    max_score: float = 20.0
    weight: float = 1.0
    notes: str | None = None


class UpdateGradebookEntryRequest(BaseModel):
    score: float | None = None
    max_score: float | None = None
    weight: float | None = None
    category: str | None = None
    title: str | None = None
    notes: str | None = None
    grading_period_id: str | None = None


class UpdateGradebookConfigRequest(BaseModel):
    grading_scale: str | None = None
    passing_score: float | None = None
    categories_weights: dict | None = None
    round_to: int | None = None


# ─── Helpers ───

def _verify_section_ownership(section, subject):
    """Check that the section belongs to the profesor via subject."""
    return section is not None and subject is not None


def calculate_weighted_average(entries: list) -> float:
    """Calculate weighted average from gradebook entries, normalized to 0-20 scale."""
    total_weight = sum(float(e.weight) for e in entries)
    if total_weight == 0:
        return 0
    weighted_sum = sum(
        (float(e.score) / float(e.max_score) * 20) * float(e.weight)
        for e in entries
        if float(e.max_score) > 0
    )
    return round(weighted_sum / total_weight, 1)


async def _check_section_access(section_id: uuid.UUID, user: User, db: AsyncSession) -> Section:
    """Verify profesor owns the section. Returns section or raises 404."""
    section = (await db.execute(
        select(Section).join(Subject, Subject.id == Section.subject_id)
        .where(Section.id == section_id, Subject.profesor_id == user.id)
    )).scalar_one_or_none()
    if not section:
        raise HTTPException(404, "Seccion no encontrada o no te pertenece")
    return section


# ─── Grading Periods ───

@router.post("/periods")
async def create_grading_period(
    data: CreateGradingPeriodRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Create a grading period for a section."""
    section_id = parse_uuid(data.section_id, "section_id")
    await _check_section_access(section_id, user, db)

    from datetime import date as date_type
    start = None
    end = None
    if data.start_date:
        try:
            start = date_type.fromisoformat(data.start_date)
        except ValueError:
            raise HTTPException(400, "Formato de fecha de inicio invalido (YYYY-MM-DD)")
    if data.end_date:
        try:
            end = date_type.fromisoformat(data.end_date)
        except ValueError:
            raise HTTPException(400, "Formato de fecha de fin invalido (YYYY-MM-DD)")

    period = GradingPeriod(
        section_id=section_id,
        name=data.name,
        weight=Decimal(str(data.weight)),
        start_date=start,
        end_date=end,
        order_index=data.order_index,
    )
    db.add(period)
    await db.commit()
    await db.refresh(period)

    return {
        "id": str(period.id),
        "name": period.name,
        "weight": float(period.weight),
        "start_date": period.start_date.isoformat() if period.start_date else None,
        "end_date": period.end_date.isoformat() if period.end_date else None,
        "is_active": period.is_active,
        "order_index": period.order_index,
    }


@router.get("/periods")
async def list_grading_periods(
    section_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """List grading periods for a section."""
    sid = parse_uuid(section_id, "section_id")
    await _check_section_access(sid, user, db)

    periods = (await db.execute(
        select(GradingPeriod)
        .where(GradingPeriod.section_id == sid)
        .order_by(GradingPeriod.order_index)
    )).scalars().all()

    return [{
        "id": str(p.id),
        "name": p.name,
        "weight": float(p.weight),
        "start_date": p.start_date.isoformat() if p.start_date else None,
        "end_date": p.end_date.isoformat() if p.end_date else None,
        "is_active": p.is_active,
        "order_index": p.order_index,
    } for p in periods]


@router.put("/periods/{period_id}")
async def update_grading_period(
    period_id: str,
    data: UpdateGradingPeriodRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Update a grading period."""
    period = (await db.execute(
        select(GradingPeriod).where(GradingPeriod.id == parse_uuid(period_id, "period_id"))
    )).scalar_one_or_none()
    if not period:
        raise HTTPException(404, "Periodo no encontrado")

    await _check_section_access(period.section_id, user, db)

    from datetime import date as date_type
    if data.name is not None:
        period.name = data.name
    if data.weight is not None:
        period.weight = Decimal(str(data.weight))
    if data.start_date is not None:
        try:
            period.start_date = date_type.fromisoformat(data.start_date)
        except ValueError:
            raise HTTPException(400, "Formato de fecha invalido")
    if data.end_date is not None:
        try:
            period.end_date = date_type.fromisoformat(data.end_date)
        except ValueError:
            raise HTTPException(400, "Formato de fecha invalido")
    if data.is_active is not None:
        period.is_active = data.is_active
    if data.order_index is not None:
        period.order_index = data.order_index

    await db.commit()
    return {"ok": True}


@router.delete("/periods/{period_id}")
async def delete_grading_period(
    period_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Delete a grading period."""
    period = (await db.execute(
        select(GradingPeriod).where(GradingPeriod.id == parse_uuid(period_id, "period_id"))
    )).scalar_one_or_none()
    if not period:
        raise HTTPException(404, "Periodo no encontrado")

    await _check_section_access(period.section_id, user, db)

    await db.delete(period)
    await db.commit()
    return {"ok": True}


# ─── Entries ───

@router.post("/entries")
async def create_gradebook_entry(
    data: CreateGradebookEntryRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Create a gradebook entry."""
    VALID_CATEGORIES = {"exam", "homework", "participation", "project"}
    if data.category not in VALID_CATEGORIES:
        raise HTTPException(400, f"Categoria invalida: {data.category}")
    if data.score < 0:
        raise HTTPException(400, "El puntaje no puede ser negativo")
    if data.max_score <= 0:
        raise HTTPException(400, "El puntaje maximo debe ser mayor a 0")

    section_id = parse_uuid(data.section_id, "section_id")
    student_id = parse_uuid(data.student_id, "student_id")
    await _check_section_access(section_id, user, db)

    # Verify student is in section
    enrolled = (await db.execute(
        select(SectionStudent).where(
            SectionStudent.section_id == section_id,
            SectionStudent.student_id == student_id,
        )
    )).scalar_one_or_none()
    if not enrolled:
        raise HTTPException(404, "Alumno no encontrado en esta seccion")

    period_id = parse_uuid(data.grading_period_id, "grading_period_id") if data.grading_period_id else None
    exam_id = parse_uuid(data.exam_id, "exam_id") if data.exam_id else None

    entry = GradebookEntry(
        student_id=student_id,
        section_id=section_id,
        grading_period_id=period_id,
        exam_id=exam_id,
        category=data.category,
        title=data.title,
        score=Decimal(str(data.score)),
        max_score=Decimal(str(data.max_score)),
        weight=Decimal(str(data.weight)),
        notes=data.notes,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    return {
        "id": str(entry.id),
        "student_id": str(entry.student_id),
        "category": entry.category,
        "title": entry.title,
        "score": float(entry.score),
        "max_score": float(entry.max_score),
        "weight": float(entry.weight),
        "created_at": entry.created_at.isoformat(),
    }


@router.get("/entries")
async def list_gradebook_entries(
    section_id: str = Query(None),
    student_id: str = Query(None),
    period_id: str = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List gradebook entries with filters."""
    q = select(GradebookEntry)

    if section_id:
        sid = parse_uuid(section_id, "section_id")
        q = q.where(GradebookEntry.section_id == sid)
    if student_id:
        stid = parse_uuid(student_id, "student_id")
        q = q.where(GradebookEntry.student_id == stid)
    if period_id:
        pid = parse_uuid(period_id, "period_id")
        q = q.where(GradebookEntry.grading_period_id == pid)

    q = q.order_by(desc(GradebookEntry.created_at))
    entries = (await db.execute(q)).scalars().all()

    return [{
        "id": str(e.id),
        "student_id": str(e.student_id),
        "section_id": str(e.section_id),
        "grading_period_id": str(e.grading_period_id) if e.grading_period_id else None,
        "exam_id": str(e.exam_id) if e.exam_id else None,
        "category": e.category,
        "title": e.title,
        "score": float(e.score),
        "max_score": float(e.max_score),
        "weight": float(e.weight),
        "notes": e.notes,
        "created_at": e.created_at.isoformat(),
    } for e in entries]


@router.put("/entries/{entry_id}")
async def update_gradebook_entry(
    entry_id: str,
    data: UpdateGradebookEntryRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Update a gradebook entry."""
    entry = (await db.execute(
        select(GradebookEntry).where(GradebookEntry.id == parse_uuid(entry_id, "entry_id"))
    )).scalar_one_or_none()
    if not entry:
        raise HTTPException(404, "Entrada no encontrada")

    await _check_section_access(entry.section_id, user, db)

    if data.score is not None:
        entry.score = Decimal(str(data.score))
    if data.max_score is not None:
        entry.max_score = Decimal(str(data.max_score))
    if data.weight is not None:
        entry.weight = Decimal(str(data.weight))
    if data.category is not None:
        entry.category = data.category
    if data.title is not None:
        entry.title = data.title
    if data.notes is not None:
        entry.notes = data.notes
    if data.grading_period_id is not None:
        entry.grading_period_id = parse_uuid(data.grading_period_id, "grading_period_id")

    await db.commit()
    return {"ok": True}


@router.delete("/entries/{entry_id}")
async def delete_gradebook_entry(
    entry_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Delete a gradebook entry."""
    entry = (await db.execute(
        select(GradebookEntry).where(GradebookEntry.id == parse_uuid(entry_id, "entry_id"))
    )).scalar_one_or_none()
    if not entry:
        raise HTTPException(404, "Entrada no encontrada")

    await _check_section_access(entry.section_id, user, db)

    await db.delete(entry)
    await db.commit()
    return {"ok": True}


# ─── Summary ───

@router.get("/summary/{section_id}")
async def gradebook_summary(
    section_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Full gradebook summary for a section."""
    sid = parse_uuid(section_id, "section_id")
    await _check_section_access(sid, user, db)

    # Get config
    config = (await db.execute(
        select(GradebookConfig).where(GradebookConfig.section_id == sid)
    )).scalar_one_or_none()
    passing_score = float(config.passing_score) if config else 10.5

    # Get all students in section
    students = (await db.execute(
        select(User, SectionStudent.joined_at)
        .join(SectionStudent, SectionStudent.student_id == User.id)
        .where(SectionStudent.section_id == sid)
        .order_by(User.last_name, User.first_name)
    )).all()

    # Get all grading periods
    periods = (await db.execute(
        select(GradingPeriod)
        .where(GradingPeriod.section_id == sid)
        .order_by(GradingPeriod.order_index)
    )).scalars().all()

    # Batch-load all entries for this section
    all_entries = (await db.execute(
        select(GradebookEntry).where(GradebookEntry.section_id == sid)
    )).scalars().all()

    # Group entries by student
    entries_by_student: dict[uuid.UUID, list] = {}
    for e in all_entries:
        entries_by_student.setdefault(e.student_id, []).append(e)

    results = []
    for student, joined_at in students:
        student_entries = entries_by_student.get(student.id, [])

        # Per-period averages
        period_averages = {}
        for period in periods:
            period_entries = [e for e in student_entries if e.grading_period_id == period.id]
            if period_entries:
                period_averages[str(period.id)] = {
                    "name": period.name,
                    "average": calculate_weighted_average(period_entries),
                    "entries_count": len(period_entries),
                }

        # Overall average
        overall = calculate_weighted_average(student_entries) if student_entries else 0
        is_passing = overall >= passing_score

        results.append({
            "student_id": str(student.id),
            "student_name": f"{student.first_name} {student.last_name}",
            "student_email": student.email,
            "overall_average": overall,
            "is_passing": is_passing,
            "entries_count": len(student_entries),
            "period_averages": period_averages,
            "entries": [{
                "id": str(e.id),
                "category": e.category,
                "title": e.title,
                "score": float(e.score),
                "max_score": float(e.max_score),
                "weight": float(e.weight),
                "grading_period_id": str(e.grading_period_id) if e.grading_period_id else None,
            } for e in student_entries],
        })

    return results


@router.get("/student/{student_id}/section/{section_id}")
async def student_gradebook(
    student_id: str,
    section_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get single student's grades for a section."""
    sid = parse_uuid(section_id, "section_id")
    stid = parse_uuid(student_id, "student_id")

    # Access check: profesor owns section, or student is requesting own grades
    if user.role in ("profesor", "superadmin"):
        await _check_section_access(sid, user, db)
    elif user.id != stid:
        raise HTTPException(403, "No tienes acceso a estas calificaciones")

    student = (await db.execute(select(User).where(User.id == stid))).scalar_one_or_none()
    if not student:
        raise HTTPException(404, "Alumno no encontrado")

    config = (await db.execute(
        select(GradebookConfig).where(GradebookConfig.section_id == sid)
    )).scalar_one_or_none()
    passing_score = float(config.passing_score) if config else 10.5

    entries = (await db.execute(
        select(GradebookEntry).where(
            GradebookEntry.section_id == sid,
            GradebookEntry.student_id == stid,
        ).order_by(GradebookEntry.created_at)
    )).scalars().all()

    periods = (await db.execute(
        select(GradingPeriod)
        .where(GradingPeriod.section_id == sid)
        .order_by(GradingPeriod.order_index)
    )).scalars().all()

    period_averages = {}
    for period in periods:
        period_entries = [e for e in entries if e.grading_period_id == period.id]
        if period_entries:
            period_averages[str(period.id)] = {
                "name": period.name,
                "average": calculate_weighted_average(period_entries),
                "entries_count": len(period_entries),
            }

    overall = calculate_weighted_average(entries) if entries else 0

    return {
        "student_id": str(student.id),
        "student_name": f"{student.first_name} {student.last_name}",
        "overall_average": overall,
        "is_passing": overall >= passing_score,
        "entries_count": len(entries),
        "period_averages": period_averages,
        "entries": [{
            "id": str(e.id),
            "category": e.category,
            "title": e.title,
            "score": float(e.score),
            "max_score": float(e.max_score),
            "weight": float(e.weight),
            "notes": e.notes,
            "grading_period_id": str(e.grading_period_id) if e.grading_period_id else None,
            "created_at": e.created_at.isoformat(),
        } for e in entries],
    }


# ─── Config ───

@router.get("/config/{section_id}")
async def get_gradebook_config(
    section_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Get or create default gradebook config for a section."""
    sid = parse_uuid(section_id, "section_id")
    await _check_section_access(sid, user, db)

    config = (await db.execute(
        select(GradebookConfig).where(GradebookConfig.section_id == sid)
    )).scalar_one_or_none()

    if not config:
        config = GradebookConfig(
            section_id=sid,
            grading_scale="0-20",
            passing_score=Decimal("10.5"),
            round_to=1,
        )
        db.add(config)
        await db.commit()
        await db.refresh(config)

    return {
        "id": str(config.id),
        "section_id": str(config.section_id),
        "grading_scale": config.grading_scale,
        "passing_score": float(config.passing_score),
        "categories_weights": config.categories_weights,
        "round_to": config.round_to,
    }


@router.put("/config/{section_id}")
async def update_gradebook_config(
    section_id: str,
    data: UpdateGradebookConfigRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Update gradebook config for a section."""
    sid = parse_uuid(section_id, "section_id")
    await _check_section_access(sid, user, db)

    config = (await db.execute(
        select(GradebookConfig).where(GradebookConfig.section_id == sid)
    )).scalar_one_or_none()

    if not config:
        config = GradebookConfig(section_id=sid)
        db.add(config)

    if data.grading_scale is not None:
        config.grading_scale = data.grading_scale
    if data.passing_score is not None:
        config.passing_score = Decimal(str(data.passing_score))
    if data.categories_weights is not None:
        config.categories_weights = data.categories_weights
    if data.round_to is not None:
        config.round_to = data.round_to

    await db.commit()
    return {"ok": True}


# ─── Auto-sync ───

@router.post("/sync/{section_id}")
async def sync_exam_scores(
    section_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Sync exam scores to gradebook entries."""
    sid = parse_uuid(section_id, "section_id")
    await _check_section_access(sid, user, db)

    # Get all published/corrected exams for this section
    exams = (await db.execute(
        select(Exam).where(
            Exam.section_id == sid,
            Exam.profesor_id == user.id,
            Exam.status.in_(["corrected", "published"]),
        )
    )).scalars().all()

    if not exams:
        return {"synced": 0, "created": 0, "updated": 0}

    created = 0
    updated = 0

    for exam in exams:
        # Get corrected student exams
        student_exams = (await db.execute(
            select(StudentExam).where(
                StudentExam.exam_id == exam.id,
                StudentExam.status == "corrected",
                StudentExam.student_id.isnot(None),
                StudentExam.total_score.isnot(None),
            )
        )).scalars().all()

        for se in student_exams:
            # Check if entry already exists for this student+exam
            existing = (await db.execute(
                select(GradebookEntry).where(
                    GradebookEntry.student_id == se.student_id,
                    GradebookEntry.exam_id == exam.id,
                )
            )).scalar_one_or_none()

            if existing:
                # Update score
                existing.score = se.adjusted_score if se.adjusted_score else se.total_score
                existing.max_score = exam.total_points
                updated += 1
            else:
                # Create new entry
                entry = GradebookEntry(
                    student_id=se.student_id,
                    section_id=sid,
                    exam_id=exam.id,
                    category="exam",
                    title=exam.title,
                    score=se.adjusted_score if se.adjusted_score else se.total_score,
                    max_score=exam.total_points,
                    weight=Decimal("1"),
                )
                db.add(entry)
                created += 1

    await db.commit()
    return {
        "synced": len(exams),
        "created": created,
        "updated": updated,
    }
