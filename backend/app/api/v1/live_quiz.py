"""Live quiz: real-time quiz sessions with pin codes, scoring, and leaderboards."""
import uuid
import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, update
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_profesor, get_alumno
from app.core.utils import parse_uuid
from app.models.user import User
from app.models.live_quiz import LiveQuiz, LiveQuizParticipant, LiveQuizResponse as LQResponse
from app.models.exam import Exam, ExamQuestion
from app.schemas.features import (
    LiveQuizCreateRequest, LiveQuizResponse, LiveQuizJoinRequest,
    LiveQuizAnswerRequest, LiveQuizParticipantResponse, LiveQuizLeaderboardResponse
)
from app.api.v1.gamification import award_points

router = APIRouter()


def _generate_pin() -> str:
    """Generate a 6-digit pin code."""
    return str(secrets.randbelow(900000) + 100000)


def _quiz_response(quiz: LiveQuiz, participant_count: int = 0) -> LiveQuizResponse:
    return LiveQuizResponse(
        id=str(quiz.id),
        title=quiz.title,
        status=quiz.status,
        mode=quiz.mode,
        pin_code=quiz.pin_code,
        section_id=str(quiz.section_id),
        current_question_index=quiz.current_question_index,
        participant_count=participant_count,
        started_at=quiz.started_at.isoformat() if quiz.started_at else None,
        created_at=quiz.created_at.isoformat(),
    )


# ─── Quiz Management (Profesor) ───

@router.post("/", response_model=LiveQuizResponse, status_code=201)
async def create_live_quiz(
    data: LiveQuizCreateRequest,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor),
):
    """Create a new live quiz. Generates a 6-digit pin code."""
    # Ensure unique pin
    pin_code = _generate_pin()
    existing = (await db.execute(
        select(LiveQuiz).where(LiveQuiz.pin_code == pin_code, LiveQuiz.status.in_(["waiting", "active"]))
    )).scalar_one_or_none()
    while existing:
        pin_code = _generate_pin()
        existing = (await db.execute(
            select(LiveQuiz).where(LiveQuiz.pin_code == pin_code, LiveQuiz.status.in_(["waiting", "active"]))
        )).scalar_one_or_none()

    quiz = LiveQuiz(
        profesor_id=user.id,
        section_id=parse_uuid(data.section_id, "section_id"),
        exam_id=parse_uuid(data.exam_id, "exam_id") if data.exam_id else None,
        title=data.title,
        mode=data.mode,
        time_per_question=data.time_per_question,
        show_leaderboard=data.show_leaderboard,
        pin_code=pin_code,
        status="waiting",
    )
    db.add(quiz)
    await db.commit()
    await db.refresh(quiz)
    return _quiz_response(quiz, 0)


@router.get("/", response_model=list[LiveQuizResponse])
async def list_live_quizzes(db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    """List profesor's live quizzes with participant counts."""
    participant_count_sub = (
        select(func.count(LiveQuizParticipant.id))
        .where(LiveQuizParticipant.quiz_id == LiveQuiz.id)
        .correlate(LiveQuiz)
        .scalar_subquery()
    )
    rows = (await db.execute(
        select(LiveQuiz, participant_count_sub.label("p_count"))
        .where(LiveQuiz.profesor_id == user.id)
        .order_by(desc(LiveQuiz.created_at))
    )).all()
    return [_quiz_response(quiz, p_count) for quiz, p_count in rows]


@router.get("/{quiz_id}", response_model=LiveQuizResponse)
async def get_live_quiz(quiz_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Get quiz details."""
    qid = parse_uuid(quiz_id, "quiz_id")
    quiz = (await db.execute(select(LiveQuiz).where(LiveQuiz.id == qid))).scalar_one_or_none()
    if not quiz:
        raise HTTPException(404, "Quiz no encontrado")

    p_count = (await db.execute(
        select(func.count(LiveQuizParticipant.id)).where(LiveQuizParticipant.quiz_id == quiz.id)
    )).scalar() or 0
    return _quiz_response(quiz, p_count)


# ─── Join ───

@router.post("/join", response_model=LiveQuizParticipantResponse)
async def join_quiz(
    data: LiveQuizJoinRequest,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user),
):
    """Join a quiz by pin code."""
    quiz = (await db.execute(
        select(LiveQuiz).where(
            LiveQuiz.pin_code == data.pin_code,
            LiveQuiz.status.in_(["waiting", "active"]),
        )
    )).scalar_one_or_none()
    if not quiz:
        raise HTTPException(404, "Quiz no encontrado o ya finalizado")

    # Check if already joined
    existing = (await db.execute(
        select(LiveQuizParticipant).where(
            LiveQuizParticipant.quiz_id == quiz.id,
            LiveQuizParticipant.user_id == user.id,
        )
    )).scalar_one_or_none()
    if existing:
        return LiveQuizParticipantResponse(
            id=str(existing.id), user_id=str(user.id),
            user_name=f"{user.first_name} {user.last_name}",
            team_name=existing.team_name, score=existing.score,
            correct_answers=existing.correct_answers, total_answers=existing.total_answers,
        )

    participant = LiveQuizParticipant(
        quiz_id=quiz.id,
        user_id=user.id,
        team_name=data.team_name,
    )
    db.add(participant)
    await db.commit()
    await db.refresh(participant)
    return LiveQuizParticipantResponse(
        id=str(participant.id), user_id=str(user.id),
        user_name=f"{user.first_name} {user.last_name}",
        team_name=participant.team_name, score=0, correct_answers=0, total_answers=0,
    )


# ─── Quiz Flow Control (Profesor) ───

@router.post("/{quiz_id}/start", response_model=LiveQuizResponse)
async def start_quiz(quiz_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    """Start the quiz."""
    qid = parse_uuid(quiz_id, "quiz_id")
    quiz = (await db.execute(
        select(LiveQuiz).where(LiveQuiz.id == qid, LiveQuiz.profesor_id == user.id)
    )).scalar_one_or_none()
    if not quiz:
        raise HTTPException(404, "Quiz no encontrado")
    if quiz.status not in ("waiting", "paused"):
        raise HTTPException(400, "El quiz no puede iniciarse en su estado actual")

    quiz.status = "active"
    quiz.started_at = datetime.now(timezone.utc)
    quiz.current_question_index = 0
    await db.commit()

    p_count = (await db.execute(
        select(func.count(LiveQuizParticipant.id)).where(LiveQuizParticipant.quiz_id == quiz.id)
    )).scalar() or 0
    return _quiz_response(quiz, p_count)


@router.post("/{quiz_id}/next-question")
async def next_question(quiz_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    """Advance to the next question."""
    qid = parse_uuid(quiz_id, "quiz_id")
    quiz = (await db.execute(
        select(LiveQuiz).where(LiveQuiz.id == qid, LiveQuiz.profesor_id == user.id)
    )).scalar_one_or_none()
    if not quiz:
        raise HTTPException(404, "Quiz no encontrado")
    if quiz.status != "active":
        raise HTTPException(400, "El quiz no está activo")

    # Count total questions from the linked exam
    total_questions = 0
    if quiz.exam_id:
        total_questions = (await db.execute(
            select(func.count(ExamQuestion.id)).where(ExamQuestion.exam_id == quiz.exam_id)
        )).scalar() or 0

    next_idx = quiz.current_question_index + 1
    if total_questions > 0 and next_idx >= total_questions:
        raise HTTPException(400, "No hay más preguntas")

    quiz.current_question_index = next_idx
    await db.commit()
    return {"question_index": next_idx, "total": total_questions}


@router.post("/{quiz_id}/pause", response_model=LiveQuizResponse)
async def pause_quiz(quiz_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    """Pause the quiz."""
    qid = parse_uuid(quiz_id, "quiz_id")
    quiz = (await db.execute(
        select(LiveQuiz).where(LiveQuiz.id == qid, LiveQuiz.profesor_id == user.id)
    )).scalar_one_or_none()
    if not quiz:
        raise HTTPException(404, "Quiz no encontrado")
    if quiz.status != "active":
        raise HTTPException(400, "El quiz no está activo")

    quiz.status = "paused"
    await db.commit()

    p_count = (await db.execute(
        select(func.count(LiveQuizParticipant.id)).where(LiveQuizParticipant.quiz_id == quiz.id)
    )).scalar() or 0
    return _quiz_response(quiz, p_count)


@router.post("/{quiz_id}/finish", response_model=LiveQuizResponse)
async def finish_quiz(quiz_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    """End the quiz."""
    qid = parse_uuid(quiz_id, "quiz_id")
    quiz = (await db.execute(
        select(LiveQuiz).where(LiveQuiz.id == qid, LiveQuiz.profesor_id == user.id)
    )).scalar_one_or_none()
    if not quiz:
        raise HTTPException(404, "Quiz no encontrado")
    if quiz.status == "finished":
        raise HTTPException(400, "El quiz ya finalizó")

    quiz.status = "finished"
    quiz.finished_at = datetime.now(timezone.utc)
    await db.commit()

    # Award participation points to all participants
    participants = (await db.execute(
        select(LiveQuizParticipant).where(LiveQuizParticipant.quiz_id == quiz.id)
    )).scalars().all()
    for p in participants:
        await award_points(db, p.user_id, 10, "exam_completed", f"Participó en quiz: {quiz.title}")

    p_count = len(participants)
    return _quiz_response(quiz, p_count)


# ─── Participant Answer ───

@router.post("/{quiz_id}/answer")
async def submit_answer(
    quiz_id: str, data: LiveQuizAnswerRequest,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user),
):
    """Submit an answer to the current question."""
    qid = parse_uuid(quiz_id, "quiz_id")
    quiz = (await db.execute(select(LiveQuiz).where(LiveQuiz.id == qid))).scalar_one_or_none()
    if not quiz:
        raise HTTPException(404, "Quiz no encontrado")
    if quiz.status != "active":
        raise HTTPException(400, "El quiz no está activo")

    # Find participant
    participant = (await db.execute(
        select(LiveQuizParticipant).where(
            LiveQuizParticipant.quiz_id == quiz.id,
            LiveQuizParticipant.user_id == user.id,
        )
    )).scalar_one_or_none()
    if not participant:
        raise HTTPException(403, "No estás participando en este quiz")

    # Check if already answered this question
    already_answered = (await db.execute(
        select(LQResponse).where(
            LQResponse.quiz_id == quiz.id,
            LQResponse.participant_id == participant.id,
            LQResponse.question_index == data.question_index,
        )
    )).scalar_one_or_none()
    if already_answered:
        raise HTTPException(400, "Ya respondiste esta pregunta")

    # Get the correct answer from the exam question
    is_correct = False
    correct_answer = None
    if quiz.exam_id:
        question = (await db.execute(
            select(ExamQuestion).where(
                ExamQuestion.exam_id == quiz.exam_id,
                ExamQuestion.order_index == data.question_index + 1,
            )
        )).scalar_one_or_none()
        if question:
            correct_answer = question.correct_answer
            # Normalize comparison
            if correct_answer:
                is_correct = data.answer.strip().lower() == correct_answer.strip().lower()

    # Calculate points: base 100 + speed bonus (max 50 for fast answers)
    points_earned = 0
    if is_correct:
        points_earned = 100
        # Speed bonus: responses within first few seconds of question get bonus points
        # Since we don't have exact question start time, give a flat bonus for correct
        points_earned += 50  # Speed bonus placeholder

    # Calculate response time in ms (approximate from creation timestamp)
    response_time_ms = 5000  # Default placeholder

    # Create response record
    lq_response = LQResponse(
        quiz_id=quiz.id,
        participant_id=participant.id,
        question_index=data.question_index,
        answer=data.answer,
        is_correct=is_correct,
        points_earned=points_earned,
        response_time_ms=response_time_ms,
    )
    db.add(lq_response)

    # Update participant stats
    participant.score += points_earned
    participant.total_answers += 1
    if is_correct:
        participant.correct_answers += 1

    await db.commit()

    # Award gamification points for correct answers
    if is_correct:
        await award_points(db, user.id, points_earned, "quiz_won", f"Respuesta correcta en quiz: {quiz.title}")

    return {
        "is_correct": is_correct,
        "points_earned": points_earned,
        "correct_answer": correct_answer,
    }


# ─── Leaderboard ───

@router.get("/{quiz_id}/leaderboard", response_model=LiveQuizLeaderboardResponse)
async def quiz_leaderboard(quiz_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Get current quiz standings."""
    qid = parse_uuid(quiz_id, "quiz_id")
    quiz = (await db.execute(select(LiveQuiz).where(LiveQuiz.id == qid))).scalar_one_or_none()
    if not quiz:
        raise HTTPException(404, "Quiz no encontrado")

    rows = (await db.execute(
        select(LiveQuizParticipant, User)
        .join(User, User.id == LiveQuizParticipant.user_id)
        .where(LiveQuizParticipant.quiz_id == quiz.id)
        .order_by(desc(LiveQuizParticipant.score))
    )).all()

    total_questions = 0
    if quiz.exam_id:
        total_questions = (await db.execute(
            select(func.count(ExamQuestion.id)).where(ExamQuestion.exam_id == quiz.exam_id)
        )).scalar() or 0

    participants = [
        LiveQuizParticipantResponse(
            id=str(p.id), user_id=str(u.id),
            user_name=f"{u.first_name} {u.last_name}",
            team_name=p.team_name, score=p.score,
            correct_answers=p.correct_answers, total_answers=p.total_answers,
        )
        for p, u in rows
    ]

    return LiveQuizLeaderboardResponse(
        participants=participants,
        current_question=quiz.current_question_index,
        total_questions=total_questions,
        status=quiz.status,
    )
