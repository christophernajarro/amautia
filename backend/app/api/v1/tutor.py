"""Tutor IA: chat, study plans, practice exercises."""
import uuid
import json
from decimal import Decimal
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.core.database import get_db
from app.core.dependencies import get_alumno
from app.core.utils import parse_uuid
from app.models.user import User
from app.models.tutor import TutorChat, TutorMessage, StudyPlan, StudyPlanTopic, PracticeExercise
from app.models.student_exam import StudentExam
from app.services.ai_service import call_ai, stream_ai, get_ai_config, extract_json
from app.ai.prompts import TUTOR_SYSTEM, STUDY_PLAN_PROMPT

router = APIRouter()


# ─── Chat ───

@router.get("/chats")
async def list_chats(skip: int = 0, limit: int = 50,
                     db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    chats = (await db.execute(
        select(TutorChat).where(TutorChat.student_id == user.id).order_by(desc(TutorChat.updated_at))
        .offset(skip).limit(limit)
    )).scalars().all()
    return [{"id": str(c.id), "title": c.title or "Nueva conversación",
             "is_active": c.is_active, "created_at": c.created_at.isoformat()} for c in chats]


@router.post("/chats")
async def create_chat(subject_id: str = Form(None), title: str = Form("Nueva conversación"),
                      db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    chat = TutorChat(student_id=user.id, subject_id=parse_uuid(subject_id, "subject_id") if subject_id else None, title=title)
    db.add(chat)
    await db.commit()
    await db.refresh(chat)
    return {"id": str(chat.id), "title": chat.title}


@router.get("/chats/{chat_id}")
async def chat_messages(chat_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    chat = (await db.execute(select(TutorChat).where(
        TutorChat.id == chat_id, TutorChat.student_id == user.id))).scalar_one_or_none()
    if not chat:
        raise HTTPException(404, "Chat no encontrado")

    messages = (await db.execute(
        select(TutorMessage).where(TutorMessage.chat_id == chat.id).order_by(TutorMessage.created_at)
    )).scalars().all()

    return {
        "id": str(chat.id), "title": chat.title,
        "messages": [{"id": str(m.id), "role": m.role, "content": m.content,
                      "created_at": m.created_at.isoformat()} for m in messages]
    }


@router.post("/chats/{chat_id}/message")
async def send_message(chat_id: str, content: str = Form(...), stream: bool = Form(False),
                       db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    chat = (await db.execute(select(TutorChat).where(
        TutorChat.id == chat_id, TutorChat.student_id == user.id))).scalar_one_or_none()
    if not chat:
        raise HTTPException(404, "Chat no encontrado")

    # Save user message and commit before streaming to prevent message loss
    user_msg = TutorMessage(chat_id=chat.id, role="user", content=content)
    db.add(user_msg)
    await db.commit()

    # Build conversation history as structured messages
    history_rows = (await db.execute(
        select(TutorMessage).where(TutorMessage.chat_id == chat.id).order_by(TutorMessage.created_at).limit(20)
    )).scalars().all()

    # Build a structured prompt with clear message boundaries
    history_parts = []
    for m in history_rows:
        role_label = "Alumno" if m.role == "user" else "Tutor (Amautia)"
        history_parts.append(f"[{role_label}]\n{m.content}")
    history_block = "\n\n".join(history_parts)

    prompt = (
        f"{TUTOR_SYSTEM}\n\n"
        f"=== Historial de conversación ===\n{history_block}\n\n"
        f"[Alumno]\n{content}\n\n"
        f"[Tutor (Amautia)]\n"
    ) if TUTOR_SYSTEM else (
        f"=== Historial de conversación ===\n{history_block}\n\n"
        f"[Alumno]\n{content}\n\n"
        f"[Tutor (Amautia)]\n"
    )

    ai_config = await get_ai_config(db, "tutor")

    if stream:
        async def generate():
            full_response = ""
            async for chunk in stream_ai(prompt, config=ai_config):
                full_response += chunk
                yield f"data: {json.dumps({'text': chunk})}\n\n"

            # Save assistant message using a fresh session
            from app.core.database import async_session
            async with async_session() as session:
                assistant_msg = TutorMessage(chat_id=parse_uuid(chat_id, "chat_id"), role="assistant", content=full_response)
                session.add(assistant_msg)
                await session.commit()

            yield "data: [DONE]\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")
    else:
        response = await call_ai(prompt, config=ai_config)
        assistant_msg = TutorMessage(chat_id=chat.id, role="assistant", content=response)
        db.add(assistant_msg)

        # Update chat title from first message
        if not history_rows:
            chat.title = content[:50]

        await db.commit()
        return {"role": "assistant", "content": response}


# ─── Study Plans ───

@router.get("/study-plans")
async def list_study_plans(db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    plans = (await db.execute(
        select(StudyPlan).where(StudyPlan.student_id == user.id).order_by(desc(StudyPlan.created_at))
    )).scalars().all()
    return [{"id": str(p.id), "title": p.title, "status": p.status,
             "progress": float(p.progress_percentage), "created_at": p.created_at.isoformat()} for p in plans]


@router.post("/study-plans/generate")
async def generate_study_plan(subject_id: str = Form(None),
                              db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    # Get student results
    student_exams = (await db.execute(
        select(StudentExam).where(StudentExam.student_id == user.id, StudentExam.status == "corrected")
        .order_by(desc(StudentExam.corrected_at)).limit(10)
    )).scalars().all()

    results_text = "\n".join([
        f"Examen: nota {se.total_score}/{se.percentage}% - {se.general_feedback or 'Sin feedback'}"
        for se in student_exams
    ]) or "Sin resultados previos"

    ai_config = await get_ai_config(db, "tutor")
    prompt = STUDY_PLAN_PROMPT.format(student_results=results_text)
    response = await call_ai(prompt, config=ai_config)
    data = extract_json(response)

    plan = StudyPlan(student_id=user.id, subject_id=parse_uuid(subject_id, "subject_id") if subject_id else None,
                     title=data.get("title", "Plan de estudio") if data else "Plan de estudio",
                     generated_plan=data, status="active")
    db.add(plan)
    await db.flush()

    if data and "topics" in data:
        for i, t in enumerate(data["topics"]):
            topic = StudyPlanTopic(
                study_plan_id=plan.id, topic_name=t.get("name", f"Tema {i+1}"),
                description=t.get("description", ""), priority=t.get("priority", "medium"),
                exercises_total=t.get("exercises", 5), order_index=i + 1,
                resources={"items": t.get("resources", [])},
            )
            db.add(topic)

    await db.commit()
    await db.refresh(plan)
    return {"id": str(plan.id), "title": plan.title}


@router.get("/study-plans/{plan_id}")
async def study_plan_detail(plan_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    plan = (await db.execute(select(StudyPlan).where(
        StudyPlan.id == plan_id, StudyPlan.student_id == user.id))).scalar_one_or_none()
    if not plan:
        raise HTTPException(404, "Recurso no encontrado")

    topics = (await db.execute(
        select(StudyPlanTopic).where(StudyPlanTopic.study_plan_id == plan.id).order_by(StudyPlanTopic.order_index)
    )).scalars().all()

    return {
        "id": str(plan.id), "title": plan.title, "status": plan.status,
        "progress": float(plan.progress_percentage),
        "topics": [{"id": str(t.id), "name": t.topic_name, "description": t.description,
                    "priority": t.priority, "status": t.status,
                    "exercises_completed": t.exercises_completed, "exercises_total": t.exercises_total,
                    "resources": t.resources} for t in topics]
    }


@router.patch("/study-plans/{plan_id}/topics/{topic_id}")
async def update_topic_progress(plan_id: str, topic_id: str, status: str = Form("completed"),
                                db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    # Verify the study plan belongs to the current student
    plan_check = (await db.execute(select(StudyPlan).where(
        StudyPlan.id == plan_id, StudyPlan.student_id == user.id))).scalar_one_or_none()
    if not plan_check:
        raise HTTPException(404, "Recurso no encontrado")

    topic = (await db.execute(select(StudyPlanTopic).where(
        StudyPlanTopic.id == topic_id, StudyPlanTopic.study_plan_id == parse_uuid(plan_id, "plan_id")))).scalar_one_or_none()
    if not topic:
        raise HTTPException(404, "Recurso no encontrado")
    topic.status = status
    if status == "completed":
        topic.exercises_completed = topic.exercises_total

    # Update plan progress
    all_topics = (await db.execute(
        select(StudyPlanTopic).where(StudyPlanTopic.study_plan_id == parse_uuid(plan_id, "plan_id"))
    )).scalars().all()
    completed = sum(1 for t in all_topics if t.status == "completed")
    plan = (await db.execute(select(StudyPlan).where(StudyPlan.id == plan_id))).scalar_one()
    plan.progress_percentage = Decimal(str(completed / len(all_topics) * 100)) if all_topics else Decimal("0")

    await db.commit()
    return {"ok": True, "progress": float(plan.progress_percentage)}


# ─── Practice Exercises ───

@router.get("/exercises")
async def list_exercises(db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    exercises = (await db.execute(
        select(PracticeExercise).where(PracticeExercise.student_id == user.id)
        .order_by(desc(PracticeExercise.created_at)).limit(20)
    )).scalars().all()
    return [{"id": str(e.id), "question": e.question_text, "type": e.question_type,
             "difficulty": e.difficulty, "is_correct": e.is_correct, "score": float(e.score) if e.score else None,
             "completed": e.completed_at is not None} for e in exercises]


@router.post("/exercises/generate")
async def generate_exercises(topic_id: str = Form(None), topic_name: str = Form("General"),
                             count: int = Form(3), difficulty: str = Form("medium"),
                             db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    ai_config = await get_ai_config(db, "generation")
    prompt = f"""Genera {count} ejercicios de práctica sobre: {topic_name}
Dificultad: {difficulty}

JSON formato:
{{"exercises": [{{"text": "pregunta", "type": "open", "answer": "respuesta", "difficulty": "{difficulty}"}}]}}

Responde SOLO con JSON."""

    response = await call_ai(prompt, config=ai_config)
    data = extract_json(response)
    created = []

    if data and "exercises" in data:
        for ex in data["exercises"]:
            pe = PracticeExercise(
                student_id=user.id,
                topic_id=parse_uuid(topic_id, "topic_id") if topic_id else None,
                question_text=ex.get("text", ""), question_type=ex.get("type", "open"),
                correct_answer=ex.get("answer", ""), difficulty=ex.get("difficulty", difficulty),
            )
            db.add(pe)
            await db.flush()
            created.append({"id": str(pe.id), "question": pe.question_text})

    await db.commit()
    return {"generated": len(created), "exercises": created}


@router.post("/exercises/{exercise_id}/submit")
async def submit_exercise(exercise_id: str, answer: str = Form(...),
                          db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    ex = (await db.execute(select(PracticeExercise).where(
        PracticeExercise.id == exercise_id, PracticeExercise.student_id == user.id))).scalar_one_or_none()
    if not ex:
        raise HTTPException(404, "Recurso no encontrado")

    ai_config = await get_ai_config(db, "correction")
    prompt = f"""Evalúa esta respuesta:
Pregunta: {ex.question_text}
Respuesta correcta: {ex.correct_answer}
Respuesta del alumno: {answer}

JSON: {{"correct": true/false, "score": 0-10, "feedback": "retroalimentación"}}"""

    response = await call_ai(prompt, config=ai_config)
    data = extract_json(response)

    ex.student_answer = answer
    ex.completed_at = datetime.now(timezone.utc)
    if data:
        ex.is_correct = data.get("correct", False)
        ex.score = Decimal(str(data.get("score", 0)))
        ex.feedback = data.get("feedback", "")

    await db.commit()
    return {"correct": ex.is_correct, "score": float(ex.score) if ex.score else 0, "feedback": ex.feedback}


@router.get("/progress")
async def tutor_progress(db: AsyncSession = Depends(get_db), user: User = Depends(get_alumno)):
    total_exercises = (await db.execute(
        select(func.count(PracticeExercise.id)).where(PracticeExercise.student_id == user.id)
    )).scalar() or 0
    completed = (await db.execute(
        select(func.count(PracticeExercise.id)).where(
            PracticeExercise.student_id == user.id, PracticeExercise.completed_at.isnot(None))
    )).scalar() or 0
    correct = (await db.execute(
        select(func.count(PracticeExercise.id)).where(
            PracticeExercise.student_id == user.id, PracticeExercise.is_correct == True)
    )).scalar() or 0
    active_plans = (await db.execute(
        select(func.count(StudyPlan.id)).where(StudyPlan.student_id == user.id, StudyPlan.status == "active")
    )).scalar() or 0
    chats = (await db.execute(
        select(func.count(TutorChat.id)).where(TutorChat.student_id == user.id)
    )).scalar() or 0

    return {
        "total_exercises": total_exercises, "completed_exercises": completed,
        "correct_exercises": correct, "accuracy": (correct / completed * 100) if completed else 0,
        "active_study_plans": active_plans, "total_chats": chats,
    }
