"""Question bank: create, manage, and generate exams from reusable question pools."""
import uuid
import random
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, update, or_
from app.core.database import get_db
from app.core.dependencies import get_profesor
from app.core.utils import parse_uuid
from app.models.user import User
from app.models.question_bank import QuestionBank, QuestionBankItem
from app.models.exam import Exam, ExamQuestion
from app.models.section import Section
from app.models.subject import Subject
from app.schemas.features import (
    QuestionBankCreateRequest, QuestionBankResponse,
    QuestionBankItemCreateRequest, QuestionBankItemResponse,
    GenerateFromBankRequest
)

router = APIRouter()


def _bank_response(bank: QuestionBank) -> QuestionBankResponse:
    return QuestionBankResponse(
        id=str(bank.id),
        name=bank.name,
        description=bank.description,
        subject_id=str(bank.subject_id) if bank.subject_id else None,
        is_public=bank.is_public,
        tags=bank.tags if bank.tags else [],
        total_questions=bank.total_questions,
        created_at=bank.created_at.isoformat(),
    )


def _item_response(item: QuestionBankItem) -> QuestionBankItemResponse:
    return QuestionBankItemResponse(
        id=str(item.id),
        question_text=item.question_text,
        question_type=item.question_type,
        correct_answer=item.correct_answer,
        options=item.options,
        points=float(item.points) if item.points else 1.0,
        difficulty=item.difficulty or "medium",
        tags=item.tags if item.tags else [],
        explanation=item.explanation,
        times_used=item.times_used,
        created_at=item.created_at.isoformat(),
    )


async def _get_owned_bank(db: AsyncSession, bank_id: uuid.UUID, user_id: uuid.UUID) -> QuestionBank:
    """Get a question bank that belongs to the user, or raise 404."""
    bank = (await db.execute(
        select(QuestionBank).where(QuestionBank.id == bank_id, QuestionBank.profesor_id == user_id)
    )).scalar_one_or_none()
    if not bank:
        raise HTTPException(404, "Banco de preguntas no encontrado")
    return bank


async def _update_bank_count(db: AsyncSession, bank_id: uuid.UUID):
    """Recalculate and update total_questions count for a bank."""
    count = (await db.execute(
        select(func.count(QuestionBankItem.id)).where(QuestionBankItem.bank_id == bank_id)
    )).scalar() or 0
    await db.execute(
        update(QuestionBank).where(QuestionBank.id == bank_id).values(total_questions=count)
    )


# ─── Bank CRUD ───

@router.post("/", response_model=QuestionBankResponse, status_code=201)
async def create_bank(
    data: QuestionBankCreateRequest,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor),
):
    """Create a new question bank."""
    bank = QuestionBank(
        profesor_id=user.id,
        name=data.name,
        description=data.description,
        subject_id=parse_uuid(data.subject_id, "subject_id") if data.subject_id else None,
        is_public=data.is_public,
        tags=data.tags if data.tags else None,
    )
    db.add(bank)
    await db.commit()
    await db.refresh(bank)
    return _bank_response(bank)


@router.get("/", response_model=list[QuestionBankResponse])
async def list_banks(db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    """List profesor's own banks plus public banks from other users."""
    banks = (await db.execute(
        select(QuestionBank)
        .where(
            or_(
                QuestionBank.profesor_id == user.id,
                QuestionBank.is_public == True,
            )
        )
        .order_by(desc(QuestionBank.created_at))
    )).scalars().all()
    return [_bank_response(b) for b in banks]


@router.get("/{bank_id}", response_model=QuestionBankResponse)
async def get_bank(bank_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    """Get bank details. Accessible if owned or public."""
    bid = parse_uuid(bank_id, "bank_id")
    bank = (await db.execute(
        select(QuestionBank).where(
            QuestionBank.id == bid,
            or_(QuestionBank.profesor_id == user.id, QuestionBank.is_public == True),
        )
    )).scalar_one_or_none()
    if not bank:
        raise HTTPException(404, "Banco de preguntas no encontrado")
    return _bank_response(bank)


@router.put("/{bank_id}", response_model=QuestionBankResponse)
async def update_bank(
    bank_id: str, data: QuestionBankCreateRequest,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor),
):
    """Update a question bank."""
    bid = parse_uuid(bank_id, "bank_id")
    bank = await _get_owned_bank(db, bid, user.id)

    bank.name = data.name
    bank.description = data.description
    bank.is_public = data.is_public
    bank.tags = data.tags if data.tags else None
    if data.subject_id:
        bank.subject_id = parse_uuid(data.subject_id, "subject_id")
    await db.commit()
    await db.refresh(bank)
    return _bank_response(bank)


@router.delete("/{bank_id}")
async def delete_bank(bank_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    """Delete a question bank and all its items."""
    bid = parse_uuid(bank_id, "bank_id")
    bank = await _get_owned_bank(db, bid, user.id)
    await db.delete(bank)
    await db.commit()
    return {"ok": True}


# ─── Items CRUD ───

@router.post("/{bank_id}/items", response_model=QuestionBankItemResponse, status_code=201)
async def add_item(
    bank_id: str, data: QuestionBankItemCreateRequest,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor),
):
    """Add a question to a bank."""
    bid = parse_uuid(bank_id, "bank_id")
    bank = await _get_owned_bank(db, bid, user.id)

    item = QuestionBankItem(
        bank_id=bank.id,
        question_text=data.question_text,
        question_type=data.question_type,
        correct_answer=data.correct_answer,
        options=data.options,
        points=Decimal(str(data.points)),
        difficulty=data.difficulty,
        tags=data.tags if data.tags else None,
        explanation=data.explanation,
    )
    db.add(item)
    await db.flush()
    await _update_bank_count(db, bank.id)
    await db.commit()
    await db.refresh(item)
    return _item_response(item)


@router.get("/{bank_id}/items", response_model=list[QuestionBankItemResponse])
async def list_items(
    bank_id: str,
    difficulty: str | None = None,
    type: str | None = None,
    tag: str | None = None,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor),
):
    """List items in a bank with optional filters."""
    bid = parse_uuid(bank_id, "bank_id")
    # Allow access to owned or public banks
    bank = (await db.execute(
        select(QuestionBank).where(
            QuestionBank.id == bid,
            or_(QuestionBank.profesor_id == user.id, QuestionBank.is_public == True),
        )
    )).scalar_one_or_none()
    if not bank:
        raise HTTPException(404, "Banco de preguntas no encontrado")

    query = select(QuestionBankItem).where(QuestionBankItem.bank_id == bank.id)
    if difficulty:
        query = query.where(QuestionBankItem.difficulty == difficulty)
    if type:
        query = query.where(QuestionBankItem.question_type == type)
    # Tag filtering: check if tag is in the JSONB tags array
    # SQLAlchemy JSONB contains is used for array membership
    if tag:
        query = query.where(QuestionBankItem.tags.contains([tag]))

    query = query.order_by(QuestionBankItem.created_at)
    items = (await db.execute(query)).scalars().all()
    return [_item_response(item) for item in items]


@router.put("/{bank_id}/items/{item_id}", response_model=QuestionBankItemResponse)
async def update_item(
    bank_id: str, item_id: str, data: QuestionBankItemCreateRequest,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor),
):
    """Update a question bank item."""
    bid = parse_uuid(bank_id, "bank_id")
    iid = parse_uuid(item_id, "item_id")
    await _get_owned_bank(db, bid, user.id)

    item = (await db.execute(
        select(QuestionBankItem).where(QuestionBankItem.id == iid, QuestionBankItem.bank_id == bid)
    )).scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Pregunta no encontrada")

    item.question_text = data.question_text
    item.question_type = data.question_type
    item.correct_answer = data.correct_answer
    item.options = data.options
    item.points = Decimal(str(data.points))
    item.difficulty = data.difficulty
    item.tags = data.tags if data.tags else None
    item.explanation = data.explanation

    await db.commit()
    await db.refresh(item)
    return _item_response(item)


@router.delete("/{bank_id}/items/{item_id}")
async def delete_item(
    bank_id: str, item_id: str,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor),
):
    """Delete a question bank item and update the bank count."""
    bid = parse_uuid(bank_id, "bank_id")
    iid = parse_uuid(item_id, "item_id")
    await _get_owned_bank(db, bid, user.id)

    item = (await db.execute(
        select(QuestionBankItem).where(QuestionBankItem.id == iid, QuestionBankItem.bank_id == bid)
    )).scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Pregunta no encontrada")

    await db.delete(item)
    await db.flush()
    await _update_bank_count(db, bid)
    await db.commit()
    return {"ok": True}


# ─── Generate Exam from Bank ───

@router.post("/generate-exam")
async def generate_exam_from_bank(
    data: GenerateFromBankRequest,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor),
):
    """Generate a new exam by selecting random questions from a bank.

    Selects questions matching optional difficulty and type filters,
    creates a new Exam with ExamQuestions, and updates times_used counters.
    """
    bid = parse_uuid(data.bank_id, "bank_id")
    bank = (await db.execute(
        select(QuestionBank).where(
            QuestionBank.id == bid,
            or_(QuestionBank.profesor_id == user.id, QuestionBank.is_public == True),
        )
    )).scalar_one_or_none()
    if not bank:
        raise HTTPException(404, "Banco de preguntas no encontrado")

    # Build query for matching items
    query = select(QuestionBankItem).where(QuestionBankItem.bank_id == bank.id)
    if data.difficulty:
        query = query.where(QuestionBankItem.difficulty == data.difficulty)
    if data.question_types:
        query = query.where(QuestionBankItem.question_type.in_(data.question_types))

    available_items = (await db.execute(query)).scalars().all()

    if len(available_items) < data.num_questions:
        raise HTTPException(
            400,
            f"No hay suficientes preguntas. Disponibles: {len(available_items)}, solicitadas: {data.num_questions}",
        )

    # Select random questions
    if data.randomize:
        selected = random.sample(list(available_items), data.num_questions)
    else:
        selected = list(available_items)[:data.num_questions]

    # We need a section_id for the exam - use the first section from the bank's subject
    section_id = None
    if bank.subject_id:
        section = (await db.execute(
            select(Section).where(Section.subject_id == bank.subject_id).limit(1)
        )).scalar_one_or_none()
        if section:
            section_id = section.id

    if not section_id:
        # Fallback: get any section owned by the profesor
        section = (await db.execute(
            select(Section)
            .join(Subject, Subject.id == Section.subject_id)
            .where(Subject.profesor_id == user.id)
            .limit(1)
        )).scalar_one_or_none()
        if not section:
            raise HTTPException(400, "No tienes secciones disponibles para crear el examen")
        section_id = section.id

    # Calculate total points
    total_points = sum(float(item.points or 1) for item in selected)

    # Create exam
    exam = Exam(
        title=f"Examen desde banco: {bank.name}",
        section_id=section_id,
        profesor_id=user.id,
        total_points=Decimal(str(total_points)),
        status="ready",
    )
    db.add(exam)
    await db.flush()

    # Create exam questions from selected items
    for i, item in enumerate(selected):
        eq = ExamQuestion(
            exam_id=exam.id,
            question_number=i + 1,
            question_text=item.question_text,
            question_type=item.question_type,
            correct_answer=item.correct_answer,
            points=item.points or Decimal("1"),
            options=item.options,
            order_index=i + 1,
        )
        db.add(eq)

        # Update times_used
        item.times_used += 1

    await db.commit()
    return {"exam_id": str(exam.id), "questions_selected": len(selected), "total_points": total_points}


# ─── Import from Exam ───

@router.post("/{bank_id}/import-from-exam/{exam_id}")
async def import_from_exam(
    bank_id: str, exam_id: str,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor),
):
    """Import questions from an existing exam into a question bank."""
    bid = parse_uuid(bank_id, "bank_id")
    eid = parse_uuid(exam_id, "exam_id")

    bank = await _get_owned_bank(db, bid, user.id)

    # Verify exam ownership
    exam = (await db.execute(
        select(Exam).where(Exam.id == eid, Exam.profesor_id == user.id)
    )).scalar_one_or_none()
    if not exam:
        raise HTTPException(404, "Examen no encontrado")

    # Get exam questions
    questions = (await db.execute(
        select(ExamQuestion).where(ExamQuestion.exam_id == exam.id).order_by(ExamQuestion.order_index)
    )).scalars().all()

    if not questions:
        raise HTTPException(400, "El examen no tiene preguntas")

    imported = 0
    for q in questions:
        item = QuestionBankItem(
            bank_id=bank.id,
            question_text=q.question_text or "",
            question_type=q.question_type,
            correct_answer=q.correct_answer,
            options=q.options,
            points=q.points or Decimal("1"),
            difficulty="medium",  # Default since exams don't have difficulty per question
        )
        db.add(item)
        imported += 1

    await db.flush()
    await _update_bank_count(db, bank.id)
    await db.commit()

    # Re-query the actual count to avoid returning stale value
    actual_count = (await db.execute(
        select(func.count(QuestionBankItem.id)).where(QuestionBankItem.bank_id == bank.id)
    )).scalar() or 0

    return {"ok": True, "imported": imported, "total_questions": actual_count}
