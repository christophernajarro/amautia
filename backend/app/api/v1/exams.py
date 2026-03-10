"""Exam management: upload, correct, results, generate."""
import uuid
import json
from decimal import Decimal
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.core.database import get_db
from app.core.dependencies import get_profesor, get_current_user
from app.models.user import User
from app.models.exam import Exam, ExamQuestion, RubricCriteria
from app.models.student_exam import StudentExam, StudentAnswer
from app.models.generated_exam import GeneratedExam, GeneratedQuestion
from app.models.section import Section, SectionStudent
from app.models.subject import Subject
from app.services.storage import save_file, save_files
from app.services.ai_service import call_ai, get_ai_config, extract_json
from app.ai.prompts import CORRECTION_PROMPT, EXTRACTION_PROMPT, GENERATION_PROMPT

router = APIRouter()


# ─── Reference Upload & Processing ───

@router.post("/exams/{exam_id}/reference")
async def upload_reference(exam_id: str, file: UploadFile = File(...),
                           db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    exam = (await db.execute(select(Exam).where(Exam.id == exam_id, Exam.profesor_id == user.id))).scalar_one_or_none()
    if not exam:
        raise HTTPException(404, "Examen no encontrado")

    url = await save_file(file, f"exams/{exam_id}/reference")
    exam.reference_file_url = url
    exam.reference_file_type = file.content_type
    await db.commit()
    return {"url": url}


@router.post("/exams/{exam_id}/process-reference")
async def process_reference(exam_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    """Use AI to extract questions from reference exam."""
    exam = (await db.execute(select(Exam).where(Exam.id == exam_id, Exam.profesor_id == user.id))).scalar_one_or_none()
    if not exam:
        raise HTTPException(404, "Examen no encontrado")

    ai_config = await get_ai_config(db, "vision" if exam.reference_file_type and "image" in exam.reference_file_type else "correction")
    prompt = EXTRACTION_PROMPT.format(total_points=float(exam.total_points))

    response = await call_ai(prompt, config=ai_config)
    data = extract_json(response)

    if data and isinstance(data, dict) and "questions" in data:
        # Delete existing questions
        existing = (await db.execute(select(ExamQuestion).where(ExamQuestion.exam_id == exam.id))).scalars().all()
        for q in existing:
            await db.delete(q)

        for i, q in enumerate(data["questions"]):
            question = ExamQuestion(
                exam_id=exam.id, question_number=i + 1,
                question_text=q.get("text", ""), question_type=q.get("type", "open"),
                correct_answer=q.get("answer", ""), points=Decimal(str(q.get("points", 4))),
                order_index=i + 1,
            )
            db.add(question)

        exam.status = "ready"
        exam.extracted_content = data
        await db.commit()
        return {"status": "ok", "questions_extracted": len(data["questions"])}
    else:
        return {"status": "ok", "questions_extracted": 0, "raw": response[:500]}


# ─── Questions CRUD ───

@router.get("/exams/{exam_id}/questions")
async def list_questions(exam_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    exam = (await db.execute(select(Exam).where(Exam.id == exam_id, Exam.profesor_id == user.id))).scalar_one_or_none()
    if not exam:
        raise HTTPException(404, "Examen no encontrado")

    questions = (await db.execute(
        select(ExamQuestion).where(ExamQuestion.exam_id == exam.id).order_by(ExamQuestion.order_index)
    )).scalars().all()

    return [{"id": str(q.id), "number": q.question_number, "text": q.question_text,
             "type": q.question_type, "answer": q.correct_answer, "points": float(q.points),
             "has_image": q.has_image, "image_url": q.image_url} for q in questions]


@router.post("/exams/{exam_id}/questions")
async def add_question(exam_id: str, text: str = Form(""), question_type: str = Form("open"),
                       answer: str = Form(""), points: float = Form(4),
                       db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    exam = (await db.execute(select(Exam).where(Exam.id == exam_id, Exam.profesor_id == user.id))).scalar_one_or_none()
    if not exam:
        raise HTTPException(404, "Examen no encontrado")

    max_num = (await db.execute(
        select(func.max(ExamQuestion.question_number)).where(ExamQuestion.exam_id == exam.id)
    )).scalar() or 0

    q = ExamQuestion(exam_id=exam.id, question_number=max_num + 1, question_text=text,
                     question_type=question_type, correct_answer=answer, points=Decimal(str(points)),
                     order_index=max_num + 1)
    db.add(q)
    await db.commit()
    await db.refresh(q)
    return {"id": str(q.id), "number": q.question_number}


@router.put("/exams/{exam_id}/questions/{question_id}")
async def update_question(exam_id: str, question_id: str, text: str = Form(None),
                          answer: str = Form(None), points: float = Form(None),
                          db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    q = (await db.execute(select(ExamQuestion).where(
        ExamQuestion.id == question_id, ExamQuestion.exam_id == exam_id))).scalar_one_or_none()
    if not q:
        raise HTTPException(404, "Pregunta no encontrada")
    if text is not None:
        q.question_text = text
    if answer is not None:
        q.correct_answer = answer
    if points is not None:
        q.points = Decimal(str(points))
    await db.commit()
    return {"ok": True}


@router.delete("/exams/{exam_id}/questions/{question_id}")
async def delete_question(exam_id: str, question_id: str,
                          db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    q = (await db.execute(select(ExamQuestion).where(
        ExamQuestion.id == question_id, ExamQuestion.exam_id == exam_id))).scalar_one_or_none()
    if not q:
        raise HTTPException(404, "Pregunta no encontrada")
    await db.delete(q)
    await db.commit()
    return {"ok": True}


# ─── Rubrics ───

@router.get("/exams/{exam_id}/rubrics")
async def list_rubrics(exam_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    questions = (await db.execute(
        select(ExamQuestion).where(ExamQuestion.exam_id == exam_id).order_by(ExamQuestion.order_index)
    )).scalars().all()

    result = []
    for q in questions:
        rubrics = (await db.execute(
            select(RubricCriteria).where(RubricCriteria.question_id == q.id)
        )).scalars().all()
        result.append({
            "question_id": str(q.id), "question_number": q.question_number,
            "question_text": q.question_text, "points": float(q.points),
            "criteria": [{"id": str(r.id), "description": r.description,
                         "max_points": float(r.max_points), "levels": r.levels} for r in rubrics]
        })
    return result


@router.post("/exams/{exam_id}/questions/{question_id}/rubric")
async def upsert_rubric(exam_id: str, question_id: str, description: str = Form(...),
                        max_points: float = Form(...), levels: str = Form("{}"),
                        db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    rubric = RubricCriteria(question_id=uuid.UUID(question_id), description=description,
                            max_points=Decimal(str(max_points)), levels=json.loads(levels) if levels else None)
    db.add(rubric)
    await db.commit()
    return {"id": str(rubric.id)}


# ─── Student Exams Upload & Correction ───

@router.post("/exams/{exam_id}/student-exams")
async def upload_student_exams(exam_id: str, files: list[UploadFile] = File(...),
                               db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    exam = (await db.execute(select(Exam).where(Exam.id == exam_id, Exam.profesor_id == user.id))).scalar_one_or_none()
    if not exam:
        raise HTTPException(404, "Examen no encontrado")

    created = []
    for file in files:
        url = await save_file(file, f"exams/{exam_id}/students")
        se = StudentExam(exam_id=exam.id, file_url=url, file_type=file.content_type, status="pending")
        db.add(se)
        await db.flush()
        created.append({"id": str(se.id), "file": file.filename, "url": url})

    await db.commit()
    return {"uploaded": len(created), "student_exams": created}


@router.post("/exams/{exam_id}/correct")
async def correct_exam(exam_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    """Start AI correction for all pending student exams."""
    exam = (await db.execute(select(Exam).where(Exam.id == exam_id, Exam.profesor_id == user.id))).scalar_one_or_none()
    if not exam:
        raise HTTPException(404, "Examen no encontrado")

    # Get questions
    questions = (await db.execute(
        select(ExamQuestion).where(ExamQuestion.exam_id == exam.id).order_by(ExamQuestion.order_index)
    )).scalars().all()

    if not questions:
        raise HTTPException(400, "El examen no tiene preguntas definidas")

    # Get pending student exams
    student_exams = (await db.execute(
        select(StudentExam).where(StudentExam.exam_id == exam.id, StudentExam.status == "pending")
    )).scalars().all()

    if not student_exams:
        raise HTTPException(400, "No hay exámenes pendientes de corrección")

    ai_config = await get_ai_config(db, "correction")
    exam.status = "correcting"
    corrected = 0

    questions_data = [{"number": q.question_number, "text": q.question_text,
                       "answer": q.correct_answer, "points": float(q.points)} for q in questions]

    for se in student_exams:
        se.status = "correcting"
        await db.commit()

        prompt = CORRECTION_PROMPT.format(
            questions=json.dumps(questions_data, ensure_ascii=False),
            total_points=float(exam.total_points),
            student_file=se.file_url,
        )

        try:
            response = await call_ai(prompt, config=ai_config)
            data = extract_json(response)

            if data and isinstance(data, dict):
                se.total_score = Decimal(str(data.get("score", 0)))
                se.percentage = Decimal(str(data.get("percentage", 0)))
                se.general_feedback = data.get("feedback", "")
                se.status = "corrected"
                se.corrected_at = datetime.now(timezone.utc)

                # Save individual answers
                for ans in data.get("answers", []):
                    q_num = ans.get("question", 0)
                    matching_q = next((q for q in questions if q.question_number == q_num), None)
                    sa = StudentAnswer(
                        student_exam_id=se.id,
                        question_id=matching_q.id if matching_q else None,
                        score=Decimal(str(ans.get("score", 0))),
                        max_score=Decimal(str(ans.get("max", 4))),
                        is_correct=ans.get("correct", False),
                        feedback=ans.get("feedback", ""),
                    )
                    db.add(sa)
                corrected += 1
            else:
                se.status = "error"
                se.general_feedback = f"Error parsing AI response: {response[:200]}"
        except Exception as e:
            se.status = "error"
            se.general_feedback = str(e)

    if corrected > 0:
        exam.status = "corrected"
    await db.commit()

    # Notify students via email (background)
    import asyncio
    from app.services.email_service import send_exam_corrected
    from app.models.user import User as UserModel
    for se in student_exams:
        if se.status == "corrected" and se.student_id:
            student = (await db.execute(select(UserModel).where(UserModel.id == se.student_id))).scalar_one_or_none()
            if student and se.total_score is not None:
                asyncio.create_task(send_exam_corrected(
                    student.email, f"{student.first_name} {student.last_name}",
                    exam.title, float(se.total_score), float(exam.total_points),
                    se.general_feedback or "Sin observaciones adicionales.",
                ))

    return {"corrected": corrected, "total": len(student_exams)}


@router.get("/exams/{exam_id}/results")
async def exam_results(exam_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    exam = (await db.execute(select(Exam).where(Exam.id == exam_id, Exam.profesor_id == user.id))).scalar_one_or_none()
    if not exam:
        raise HTTPException(404, "Examen no encontrado")

    student_exams = (await db.execute(
        select(StudentExam).where(StudentExam.exam_id == exam.id).order_by(StudentExam.created_at)
    )).scalars().all()

    results = []
    for se in student_exams:
        student = None
        if se.student_id:
            from app.models.user import User as UserModel
            student = (await db.execute(select(UserModel).where(UserModel.id == se.student_id))).scalar_one_or_none()

        answers = (await db.execute(
            select(StudentAnswer).where(StudentAnswer.student_exam_id == se.id)
        )).scalars().all()

        results.append({
            "id": str(se.id),
            "student_name": f"{student.first_name} {student.last_name}" if student else "Sin identificar",
            "student_email": student.email if student else None,
            "total_score": float(se.total_score) if se.total_score else None,
            "percentage": float(se.percentage) if se.percentage else None,
            "status": se.status,
            "feedback": se.general_feedback,
            "corrected_at": se.corrected_at.isoformat() if se.corrected_at else None,
            "answers": [{"question": a.question_id and str(a.question_id), "score": float(a.score) if a.score else None,
                        "max_score": float(a.max_score) if a.max_score else None, "correct": a.is_correct,
                        "feedback": a.feedback} for a in answers],
        })

    # Stats
    scores = [float(se.percentage) for se in student_exams if se.percentage]
    stats = {
        "total_students": len(student_exams),
        "corrected": sum(1 for se in student_exams if se.status == "corrected"),
        "average": sum(scores) / len(scores) if scores else 0,
        "max_score": max(scores) if scores else 0,
        "min_score": min(scores) if scores else 0,
    }

    return {"exam_id": str(exam.id), "title": exam.title, "stats": stats, "results": results}


@router.get("/exams/{exam_id}/correction-status")
async def correction_status(exam_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    total = (await db.execute(select(func.count(StudentExam.id)).where(StudentExam.exam_id == exam_id))).scalar() or 0
    corrected = (await db.execute(select(func.count(StudentExam.id)).where(
        StudentExam.exam_id == exam_id, StudentExam.status == "corrected"))).scalar() or 0
    errors = (await db.execute(select(func.count(StudentExam.id)).where(
        StudentExam.exam_id == exam_id, StudentExam.status == "error"))).scalar() or 0
    return {"total": total, "corrected": corrected, "errors": errors, "pending": total - corrected - errors}


@router.get("/student-exams/{student_exam_id}")
async def student_exam_detail(student_exam_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    se = (await db.execute(select(StudentExam).where(StudentExam.id == student_exam_id))).scalar_one_or_none()
    if not se:
        raise HTTPException(404, "Examen de alumno no encontrado")

    answers = (await db.execute(
        select(StudentAnswer, ExamQuestion)
        .outerjoin(ExamQuestion, ExamQuestion.id == StudentAnswer.question_id)
        .where(StudentAnswer.student_exam_id == se.id)
    )).all()

    return {
        "id": str(se.id), "status": se.status,
        "total_score": float(se.total_score) if se.total_score else None,
        "percentage": float(se.percentage) if se.percentage else None,
        "feedback": se.general_feedback, "strengths": se.strengths,
        "areas_to_improve": se.areas_to_improve,
        "profesor_reviewed": se.profesor_reviewed, "profesor_notes": se.profesor_notes,
        "answers": [{
            "question_number": q.question_number if q else None,
            "question_text": q.question_text if q else None,
            "student_answer": a.answer_text,
            "score": float(a.score) if a.score else None,
            "max_score": float(a.max_score) if a.max_score else None,
            "correct": a.is_correct,
            "feedback": a.feedback, "suggestion": a.suggestion,
        } for a, q in answers],
    }


@router.put("/student-exams/{student_exam_id}/review")
async def review_student_exam(student_exam_id: str, notes: str = Form(""),
                              adjusted_score: float = Form(None),
                              db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    se = (await db.execute(select(StudentExam).where(StudentExam.id == student_exam_id))).scalar_one_or_none()
    if not se:
        raise HTTPException(404)
    se.profesor_reviewed = True
    se.profesor_notes = notes
    if adjusted_score is not None:
        se.adjusted_score = Decimal(str(adjusted_score))
    await db.commit()
    return {"ok": True}


@router.patch("/exams/{exam_id}/publish")
async def publish_results(exam_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    exam = (await db.execute(select(Exam).where(Exam.id == exam_id, Exam.profesor_id == user.id))).scalar_one_or_none()
    if not exam:
        raise HTTPException(404)
    exam.status = "published"
    await db.commit()
    return {"ok": True}


# ─── Exam Generation ───

@router.post("/generate")
async def generate_exam(title: str = Form("Examen generado"), subject_id: str = Form(None),
                        difficulty: str = Form("medium"), num_questions: int = Form(5),
                        source_text: str = Form(""), education_level: str = Form("secundaria"),
                        source_file: UploadFile = File(None),
                        db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    file_url = None
    if source_file:
        file_url = await save_file(source_file, f"generated/{uuid.uuid4().hex}")

    gen = GeneratedExam(
        profesor_id=user.id,
        subject_id=uuid.UUID(subject_id) if subject_id else None,
        title=title, difficulty=difficulty, num_questions=num_questions,
        source_text=source_text, source_files={"file": file_url} if file_url else None,
        education_level=education_level, status="generating",
    )
    db.add(gen)
    await db.flush()

    ai_config = await get_ai_config(db, "generation")
    prompt = GENERATION_PROMPT.format(
        title=title, difficulty=difficulty, num_questions=num_questions,
        education_level=education_level, source_text=source_text or "Tema general",
    )

    try:
        response = await call_ai(prompt, config=ai_config)
        data = extract_json(response)

        if data and isinstance(data, dict) and "questions" in data:
            gen.generated_content = data
            gen.title = data.get("title", title)
            gen.status = "completed"

            for i, q in enumerate(data["questions"]):
                gq = GeneratedQuestion(
                    generated_exam_id=gen.id, question_number=i + 1,
                    question_text=q.get("text", ""), question_type=q.get("type", "open"),
                    correct_answer=q.get("answer", ""), explanation=q.get("explanation", ""),
                    points=Decimal(str(q.get("points", 4))), order_index=i + 1,
                )
                db.add(gq)
        else:
            gen.status = "error"
            gen.generated_content = {"raw": response[:1000]}
    except Exception as e:
        gen.status = "error"
        gen.generated_content = {"error": str(e)}

    await db.commit()
    await db.refresh(gen)
    return {"id": str(gen.id), "status": gen.status, "title": gen.title}


@router.get("/generated")
async def list_generated(db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    result = await db.execute(
        select(GeneratedExam).where(GeneratedExam.profesor_id == user.id).order_by(desc(GeneratedExam.created_at))
    )
    exams = result.scalars().all()
    return [{"id": str(g.id), "title": g.title, "difficulty": g.difficulty,
             "num_questions": g.num_questions, "status": g.status,
             "created_at": g.created_at.isoformat()} for g in exams]


@router.get("/generated/{gen_id}")
async def generated_detail(gen_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    gen = (await db.execute(select(GeneratedExam).where(
        GeneratedExam.id == gen_id, GeneratedExam.profesor_id == user.id))).scalar_one_or_none()
    if not gen:
        raise HTTPException(404)

    questions = (await db.execute(
        select(GeneratedQuestion).where(GeneratedQuestion.generated_exam_id == gen.id)
        .order_by(GeneratedQuestion.order_index)
    )).scalars().all()

    return {
        "id": str(gen.id), "title": gen.title, "difficulty": gen.difficulty,
        "num_questions": gen.num_questions, "status": gen.status,
        "education_level": gen.education_level, "source_text": gen.source_text,
        "created_at": gen.created_at.isoformat(),
        "questions": [{"id": str(q.id), "number": q.question_number, "text": q.question_text,
                       "type": q.question_type, "answer": q.correct_answer,
                       "explanation": q.explanation, "points": float(q.points) if q.points else 4,
                       "is_edited": q.is_edited} for q in questions],
    }


@router.put("/generated/{gen_id}/questions/{question_id}")
async def edit_generated_question(gen_id: str, question_id: str, text: str = Form(None),
                                  answer: str = Form(None), points: float = Form(None),
                                  db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    q = (await db.execute(select(GeneratedQuestion).where(
        GeneratedQuestion.id == question_id, GeneratedQuestion.generated_exam_id == gen_id))).scalar_one_or_none()
    if not q:
        raise HTTPException(404)
    if text is not None:
        if not q.is_edited:
            q.original_text = q.question_text
        q.question_text = text
        q.is_edited = True
    if answer is not None:
        q.correct_answer = answer
    if points is not None:
        q.points = Decimal(str(points))
    await db.commit()
    return {"ok": True}


@router.delete("/generated/{gen_id}/questions/{question_id}")
async def delete_generated_question(gen_id: str, question_id: str,
                                    db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    q = (await db.execute(select(GeneratedQuestion).where(
        GeneratedQuestion.id == question_id, GeneratedQuestion.generated_exam_id == gen_id))).scalar_one_or_none()
    if not q:
        raise HTTPException(404)
    await db.delete(q)
    await db.commit()
    return {"ok": True}


@router.post("/generated/{gen_id}/save-as-exam")
async def save_as_exam(gen_id: str, section_id: str = Form(...),
                       db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    """Convert generated exam into a real exam."""
    gen = (await db.execute(select(GeneratedExam).where(
        GeneratedExam.id == gen_id, GeneratedExam.profesor_id == user.id))).scalar_one_or_none()
    if not gen:
        raise HTTPException(404)

    questions = (await db.execute(
        select(GeneratedQuestion).where(GeneratedQuestion.generated_exam_id == gen.id)
        .order_by(GeneratedQuestion.order_index)
    )).scalars().all()

    total_points = sum(float(q.points or 4) for q in questions)
    exam = Exam(title=gen.title or "Examen", section_id=uuid.UUID(section_id),
                profesor_id=user.id, total_points=Decimal(str(total_points)), status="ready")
    db.add(exam)
    await db.flush()

    for q in questions:
        eq = ExamQuestion(exam_id=exam.id, question_number=q.question_number,
                         question_text=q.question_text, question_type=q.question_type or "open",
                         correct_answer=q.correct_answer, points=q.points or Decimal("4"),
                         order_index=q.order_index)
        db.add(eq)

    await db.commit()
    return {"exam_id": str(exam.id)}


# ─── Export ───

@router.get("/exams/{exam_id}/export/excel")
async def export_excel(exam_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    from fastapi.responses import Response as FastAPIResponse
    from app.services.export_service import export_results_excel

    exam = (await db.execute(select(Exam).where(Exam.id == exam_id, Exam.profesor_id == user.id))).scalar_one_or_none()
    if not exam:
        raise HTTPException(404)

    student_exams = (await db.execute(
        select(StudentExam).where(StudentExam.exam_id == exam.id)
    )).scalars().all()

    results = []
    for se in student_exams:
        from app.models.user import User as UserModel
        student = (await db.execute(select(UserModel).where(UserModel.id == se.student_id))).scalar_one_or_none() if se.student_id else None
        results.append({
            "student_name": f"{student.first_name} {student.last_name}" if student else "Sin identificar",
            "student_email": student.email if student else "",
            "total_score": float(se.total_score) if se.total_score else None,
            "percentage": float(se.percentage) if se.percentage else None,
            "status": se.status,
            "feedback": se.general_feedback,
        })

    stats = {
        "total_students": len(results),
        "corrected": sum(1 for r in results if r["status"] == "corrected"),
        "average": sum(r["percentage"] for r in results if r["percentage"]) / max(1, sum(1 for r in results if r["percentage"])),
        "max_score": max((r["percentage"] for r in results if r["percentage"]), default=0),
        "min_score": min((r["percentage"] for r in results if r["percentage"]), default=0),
    }

    data = export_results_excel(exam.title, results, stats)
    filename = f"resultados_{exam.title[:30].replace(' ', '_')}.xlsx"
    return FastAPIResponse(content=data,
                           media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                           headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/exams/{exam_id}/export/pdf")
async def export_pdf(exam_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_profesor)):
    from fastapi.responses import Response as FastAPIResponse
    from app.services.export_service import export_results_pdf

    exam = (await db.execute(select(Exam).where(Exam.id == exam_id, Exam.profesor_id == user.id))).scalar_one_or_none()
    if not exam:
        raise HTTPException(404)

    student_exams = (await db.execute(
        select(StudentExam).where(StudentExam.exam_id == exam.id)
    )).scalars().all()

    results = []
    for se in student_exams:
        from app.models.user import User as UserModel
        student = (await db.execute(select(UserModel).where(UserModel.id == se.student_id))).scalar_one_or_none() if se.student_id else None
        results.append({
            "student_name": f"{student.first_name} {student.last_name}" if student else "Sin identificar",
            "total_score": float(se.total_score) if se.total_score else None,
            "percentage": float(se.percentage) if se.percentage else None,
            "status": se.status,
        })

    stats = {
        "total_students": len(results),
        "corrected": sum(1 for r in results if r["status"] == "corrected"),
        "average": sum(r["percentage"] for r in results if r["percentage"]) / max(1, sum(1 for r in results if r["percentage"])),
        "max_score": max((r["percentage"] for r in results if r["percentage"]), default=0),
        "min_score": min((r["percentage"] for r in results if r["percentage"]), default=0),
    }

    data = export_results_pdf(exam.title, results, stats)
    filename = f"resultados_{exam.title[:30].replace(' ', '_')}.pdf"
    return FastAPIResponse(content=data, media_type="application/pdf",
                           headers={"Content-Disposition": f'attachment; filename="{filename}"'})
