"""Flashcards: sets, cards, SM-2 spaced repetition, AI generation."""
import uuid
import logging
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.utils import parse_uuid
from app.models.user import User
from app.models.flashcard import FlashcardSet, Flashcard, FlashcardReview
from app.services.ai_service import call_ai, get_ai_config, extract_json

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Request schemas ───

class CardItem(BaseModel):
    front: str
    back: str


class CreateFlashcardSetRequest(BaseModel):
    title: str
    description: str | None = None
    subject_id: str | None = None
    is_public: bool = False
    cards: list[CardItem] = []


class UpdateFlashcardSetRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    is_public: bool | None = None


class AddCardRequest(BaseModel):
    front: str
    back: str


class FlashcardReviewRequest(BaseModel):
    quality: int  # 0-5 SM-2 algorithm


class GenerateFlashcardsRequest(BaseModel):
    topic: str
    num_cards: int = 10
    subject_id: str | None = None
    is_public: bool = False


# ─── Helpers ───

def _set_response(s: FlashcardSet, mastery: float = 0) -> dict:
    return {
        "id": str(s.id),
        "title": s.title,
        "description": s.description,
        "is_public": s.is_public,
        "total_cards": s.total_cards,
        "mastery_percentage": round(mastery, 1),
        "created_at": s.created_at.isoformat(),
    }


def _card_response(c: Flashcard, review: FlashcardReview | None = None) -> dict:
    result = {
        "id": str(c.id),
        "front": c.front,
        "back": c.back,
        "has_image": c.has_image,
        "image_url": c.image_url,
        "order_index": c.order_index,
        "created_at": c.created_at.isoformat(),
    }
    if review:
        result["srs"] = {
            "ease_factor": float(review.ease_factor),
            "interval_days": review.interval_days,
            "repetitions": review.repetitions,
            "next_review": review.next_review.isoformat() if review.next_review else None,
            "last_reviewed": review.last_reviewed.isoformat() if review.last_reviewed else None,
        }
    return result


# ─── Sets CRUD ───

@router.post("/sets")
async def create_flashcard_set(
    data: CreateFlashcardSetRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a flashcard set with optional cards."""
    if not data.title.strip():
        raise HTTPException(400, "El título es requerido")

    subject_uuid = parse_uuid(data.subject_id, "subject_id") if data.subject_id else None

    fs = FlashcardSet(
        title=data.title,
        description=data.description,
        subject_id=subject_uuid,
        is_public=data.is_public,
        total_cards=len(data.cards),
    )
    # Assign ownership based on role
    if user.role in ("profesor", "superadmin"):
        fs.profesor_id = user.id
    else:
        fs.student_id = user.id

    db.add(fs)
    await db.flush()

    for i, card in enumerate(data.cards):
        db.add(Flashcard(
            set_id=fs.id,
            front=card.front,
            back=card.back,
            order_index=i + 1,
        ))

    await db.commit()
    await db.refresh(fs)
    return _set_response(fs)


@router.get("/sets")
async def list_flashcard_sets(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List user's sets + public sets with mastery percentage."""
    # User's own sets or public sets
    if user.role in ("profesor", "superadmin"):
        own_filter = FlashcardSet.profesor_id == user.id
    else:
        own_filter = FlashcardSet.student_id == user.id

    sets = (await db.execute(
        select(FlashcardSet)
        .where(or_(own_filter, FlashcardSet.is_public == True))
        .order_by(desc(FlashcardSet.created_at))
    )).scalars().all()

    results = []
    for s in sets:
        # Calculate mastery: % of cards with successful reviews (quality >= 3)
        mastery = 0
        if s.total_cards > 0:
            mastered = (await db.execute(
                select(func.count(FlashcardReview.id))
                .join(Flashcard, Flashcard.id == FlashcardReview.flashcard_id)
                .where(
                    Flashcard.set_id == s.id,
                    FlashcardReview.user_id == user.id,
                    FlashcardReview.quality >= 3,
                )
            )).scalar() or 0
            mastery = (mastered / s.total_cards) * 100

        results.append(_set_response(s, mastery))

    return results


@router.get("/sets/{set_id}")
async def get_flashcard_set(
    set_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get a set with all cards and SRS data for the current user."""
    sid = parse_uuid(set_id, "set_id")

    fs = (await db.execute(select(FlashcardSet).where(FlashcardSet.id == sid))).scalar_one_or_none()
    if not fs:
        raise HTTPException(404, "Set de flashcards no encontrado")

    # Access check: owner or public
    is_owner = (
        (fs.profesor_id and fs.profesor_id == user.id)
        or (fs.student_id and fs.student_id == user.id)
    )
    if not is_owner and not fs.is_public:
        raise HTTPException(403, "No tienes acceso a este set")

    cards = (await db.execute(
        select(Flashcard).where(Flashcard.set_id == sid).order_by(Flashcard.order_index)
    )).scalars().all()

    # Batch-load reviews for this user
    card_ids = [c.id for c in cards]
    reviews = []
    if card_ids:
        reviews = (await db.execute(
            select(FlashcardReview).where(
                FlashcardReview.flashcard_id.in_(card_ids),
                FlashcardReview.user_id == user.id,
            )
        )).scalars().all()
    review_map = {r.flashcard_id: r for r in reviews}

    # Mastery
    mastery = 0
    if fs.total_cards > 0:
        mastered = sum(1 for r in reviews if r.quality >= 3)
        mastery = (mastered / fs.total_cards) * 100

    return {
        "set": _set_response(fs, mastery),
        "cards": [_card_response(c, review_map.get(c.id)) for c in cards],
    }


@router.put("/sets/{set_id}")
async def update_flashcard_set(
    set_id: str,
    data: UpdateFlashcardSetRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update set metadata."""
    sid = parse_uuid(set_id, "set_id")
    fs = (await db.execute(select(FlashcardSet).where(FlashcardSet.id == sid))).scalar_one_or_none()
    if not fs:
        raise HTTPException(404, "Set no encontrado")

    is_owner = (
        (fs.profesor_id and fs.profesor_id == user.id)
        or (fs.student_id and fs.student_id == user.id)
    )
    if not is_owner:
        raise HTTPException(403, "No tienes permisos para editar este set")

    if data.title is not None:
        fs.title = data.title
    if data.description is not None:
        fs.description = data.description
    if data.is_public is not None:
        fs.is_public = data.is_public

    await db.commit()
    return {"ok": True}


@router.delete("/sets/{set_id}")
async def delete_flashcard_set(
    set_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Delete a flashcard set."""
    sid = parse_uuid(set_id, "set_id")
    fs = (await db.execute(select(FlashcardSet).where(FlashcardSet.id == sid))).scalar_one_or_none()
    if not fs:
        raise HTTPException(404, "Set no encontrado")

    is_owner = (
        (fs.profesor_id and fs.profesor_id == user.id)
        or (fs.student_id and fs.student_id == user.id)
    )
    if not is_owner:
        raise HTTPException(403, "No tienes permisos para eliminar este set")

    await db.delete(fs)
    await db.commit()
    return {"ok": True}


# ─── Cards ───

@router.post("/sets/{set_id}/cards")
async def add_card(
    set_id: str,
    data: AddCardRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Add a card to an existing set."""
    sid = parse_uuid(set_id, "set_id")
    fs = (await db.execute(select(FlashcardSet).where(FlashcardSet.id == sid))).scalar_one_or_none()
    if not fs:
        raise HTTPException(404, "Set no encontrado")

    is_owner = (
        (fs.profesor_id and fs.profesor_id == user.id)
        or (fs.student_id and fs.student_id == user.id)
    )
    if not is_owner:
        raise HTTPException(403, "No tienes permisos para agregar tarjetas")

    if not data.front.strip() or not data.back.strip():
        raise HTTPException(400, "El frente y reverso son requeridos")

    max_order = (await db.execute(
        select(func.max(Flashcard.order_index)).where(Flashcard.set_id == sid)
    )).scalar() or 0

    card = Flashcard(
        set_id=sid,
        front=data.front,
        back=data.back,
        order_index=max_order + 1,
    )
    db.add(card)

    fs.total_cards = (fs.total_cards or 0) + 1

    await db.commit()
    await db.refresh(card)
    return _card_response(card)


# ─── Study / SRS ───

@router.get("/sets/{set_id}/study")
async def get_study_cards(
    set_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get cards due for review using SRS scheduling."""
    sid = parse_uuid(set_id, "set_id")

    fs = (await db.execute(select(FlashcardSet).where(FlashcardSet.id == sid))).scalar_one_or_none()
    if not fs:
        raise HTTPException(404, "Set no encontrado")

    now = datetime.now(timezone.utc)

    # Get all cards in the set
    all_cards = (await db.execute(
        select(Flashcard).where(Flashcard.set_id == sid).order_by(Flashcard.order_index)
    )).scalars().all()

    if not all_cards:
        return []

    card_ids = [c.id for c in all_cards]

    # Get existing reviews for this user
    reviews = (await db.execute(
        select(FlashcardReview).where(
            FlashcardReview.flashcard_id.in_(card_ids),
            FlashcardReview.user_id == user.id,
        )
    )).scalars().all()
    review_map = {r.flashcard_id: r for r in reviews}

    # Filter: cards with no review OR next_review <= now
    due_cards = []
    for card in all_cards:
        review = review_map.get(card.id)
        if not review or not review.next_review or review.next_review <= now:
            due_cards.append(_card_response(card, review))

    return due_cards


@router.post("/cards/{card_id}/review")
async def submit_review(
    card_id: str,
    data: FlashcardReviewRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Submit a review using the SM-2 spaced repetition algorithm."""
    cid = parse_uuid(card_id, "card_id")

    if data.quality < 0 or data.quality > 5:
        raise HTTPException(400, "La calidad debe estar entre 0 y 5")

    card = (await db.execute(select(Flashcard).where(Flashcard.id == cid))).scalar_one_or_none()
    if not card:
        raise HTTPException(404, "Tarjeta no encontrada")

    now = datetime.now(timezone.utc)
    q = data.quality

    # Find or create review
    review = (await db.execute(
        select(FlashcardReview).where(
            FlashcardReview.flashcard_id == cid,
            FlashcardReview.user_id == user.id,
        )
    )).scalar_one_or_none()

    if review:
        # Update existing review with SM-2 algorithm
        ef = float(review.ease_factor)
        reps = review.repetitions
        interval = review.interval_days

        if q >= 3:
            # Successful recall
            if reps == 0:
                interval = 1
            elif reps == 1:
                interval = 6
            else:
                interval = round(interval * ef)
            reps += 1
        else:
            # Failed recall: reset
            interval = 1
            reps = 0

        # Update ease factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
        ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        ef = max(1.3, ef)

        review.ease_factor = Decimal(str(round(ef, 2)))
        review.interval_days = interval
        review.repetitions = reps
        review.quality = q
        review.next_review = now + timedelta(days=interval)
        review.last_reviewed = now
    else:
        # Create new review
        ef = 2.5
        if q >= 3:
            interval = 1
            reps = 1
        else:
            interval = 1
            reps = 0

        ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        ef = max(1.3, ef)

        review = FlashcardReview(
            user_id=user.id,
            flashcard_id=cid,
            ease_factor=Decimal(str(round(ef, 2))),
            interval_days=interval,
            repetitions=reps,
            quality=q,
            next_review=now + timedelta(days=interval),
            last_reviewed=now,
        )
        db.add(review)

    await db.commit()
    await db.refresh(review)
    return _card_response(card, review)


# ─── AI Generation ───

@router.post("/generate")
async def generate_flashcards(
    data: GenerateFlashcardsRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Use AI to generate flashcards on a topic."""
    if not data.topic.strip():
        raise HTTPException(400, "El tema es requerido")
    if data.num_cards < 1 or data.num_cards > 50:
        raise HTTPException(400, "El numero de tarjetas debe ser entre 1 y 50")

    ai_config = await get_ai_config(db, "generation")

    prompt = (
        f"Genera exactamente {data.num_cards} flashcards sobre el tema: {data.topic}.\n"
        "Responde SOLO con un JSON valido con esta estructura:\n"
        '{"cards": [{"front": "pregunta o concepto", "back": "respuesta o definicion"}]}\n'
        "Las tarjetas deben ser claras, concisas y educativas."
    )

    try:
        response = await call_ai(prompt, config=ai_config)
        result = extract_json(response)
    except Exception as e:
        logger.error("AI flashcard generation failed: %s", str(e))
        raise HTTPException(500, "Error al generar flashcards con IA")

    cards_data = []
    if result and isinstance(result, dict) and "cards" in result:
        cards_data = result["cards"]
    elif result and isinstance(result, list):
        cards_data = result
    else:
        raise HTTPException(500, "La IA no devolvio un formato valido")

    if not cards_data:
        raise HTTPException(500, "No se generaron tarjetas")

    subject_uuid = parse_uuid(data.subject_id, "subject_id") if data.subject_id else None

    fs = FlashcardSet(
        title=f"Flashcards: {data.topic[:200]}",
        description=f"Generado por IA sobre: {data.topic}",
        subject_id=subject_uuid,
        is_public=data.is_public,
        total_cards=len(cards_data),
    )
    if user.role in ("profesor", "superadmin"):
        fs.profesor_id = user.id
    else:
        fs.student_id = user.id

    db.add(fs)
    await db.flush()

    for i, card in enumerate(cards_data):
        front = card.get("front", "").strip()
        back = card.get("back", "").strip()
        if front and back:
            db.add(Flashcard(
                set_id=fs.id,
                front=front,
                back=back,
                order_index=i + 1,
            ))

    await db.commit()
    await db.refresh(fs)
    return _set_response(fs)
