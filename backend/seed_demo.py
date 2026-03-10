"""Seed demo data: profesor with subject, section, exam with questions, and students."""
import asyncio
import uuid
from decimal import Decimal
from app.core.database import async_session, engine, Base
from app.core.security import hash_password
from app.models.user import User
from app.models.subject import Subject
from app.models.section import Section, SectionStudent
from app.models.exam import Exam, ExamQuestion


async def seed():
    async with async_session() as db:
        # Check if demo data exists
        from sqlalchemy import select
        existing = (await db.execute(select(Subject).limit(1))).scalar_one_or_none()
        if existing:
            print("Demo data already exists, skipping.")
            return

        # Get profesor user
        profesor = (await db.execute(select(User).where(User.email == "profesor@amautia.com"))).scalar_one_or_none()
        alumno = (await db.execute(select(User).where(User.email == "alumno@amautia.com"))).scalar_one_or_none()

        if not profesor or not alumno:
            print("Run seed.py first to create users.")
            return

        # Create subject
        subject = Subject(
            name="Matemáticas", description="Matemáticas para 3er grado de secundaria",
            color="#4F46E5", profesor_id=profesor.id,
        )
        db.add(subject)
        await db.flush()

        # Create section
        section = Section(
            subject_id=subject.id, name="Sección A", class_code="MAT3A26",
            academic_period="I Bimestre 2026",
        )
        db.add(section)
        await db.flush()

        # Enroll alumno
        enrollment = SectionStudent(section_id=section.id, student_id=alumno.id)
        db.add(enrollment)

        # Create exam
        exam = Exam(
            title="Examen Parcial - Ecuaciones Lineales",
            description="Resolver ecuaciones de primer grado y sistemas de ecuaciones",
            section_id=section.id, profesor_id=profesor.id,
            total_points=Decimal("20"), grading_scale="0-20", status="ready",
        )
        db.add(exam)
        await db.flush()

        # Add questions
        questions = [
            ("Resuelve: 3x + 5 = 20", "open", "x = 5", 4),
            ("Resuelve el sistema:\n2x + y = 7\nx - y = 2", "problem", "x = 3, y = 1", 5),
            ("¿Cuál es la pendiente de y = 2x + 3?", "multiple_choice", "m = 2", 3),
            ("Si f(x) = x² - 4, ¿cuáles son las raíces?", "problem", "x = 2 y x = -2", 4),
            ("Verdadero o Falso: Toda ecuación lineal tiene exactamente una solución", "true_false", "Falso (puede no tener o tener infinitas)", 4),
        ]

        for i, (text, qtype, answer, points) in enumerate(questions):
            q = ExamQuestion(
                exam_id=exam.id, question_number=i + 1,
                question_text=text, question_type=qtype,
                correct_answer=answer, points=Decimal(str(points)),
                order_index=i + 1,
            )
            db.add(q)

        # Create 2 more students
        for name, email in [("María", "maria@demo.com"), ("Carlos", "carlos@demo.com")]:
            student = User(
                email=email, password_hash=hash_password("demo123"),
                first_name=name, last_name="Demo", role="alumno", is_active=True,
            )
            db.add(student)
            await db.flush()
            db.add(SectionStudent(section_id=section.id, student_id=student.id))

        await db.commit()
        print("✅ Demo data seeded:")
        print(f"   Materia: {subject.name}")
        print(f"   Sección: {section.name} (código: {section.class_code})")
        print(f"   Examen: {exam.title} ({len(questions)} preguntas, {exam.total_points} pts)")
        print(f"   3 alumnos inscritos")


if __name__ == "__main__":
    asyncio.run(seed())
