import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Boolean, ForeignKey, DateTime, func, Text, Numeric, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base

class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    section_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sections.id", ondelete="CASCADE"), index=True)
    profesor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    reference_file_url: Mapped[str | None] = mapped_column(String(500))
    reference_file_type: Mapped[str | None] = mapped_column(String(100))
    answers_file_url: Mapped[str | None] = mapped_column(String(500))
    answers_text: Mapped[str | None] = mapped_column(Text)
    total_points: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=20)
    grading_scale: Mapped[str] = mapped_column(String(20), default="0-20")
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    ai_provider: Mapped[str | None] = mapped_column(String(50))
    ai_model: Mapped[str | None] = mapped_column(String(100))
    extracted_content: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exams.id", ondelete="CASCADE"))
    question_number: Mapped[int] = mapped_column(Integer, nullable=False)
    question_text: Mapped[str | None] = mapped_column(Text)
    question_type: Mapped[str] = mapped_column(String(30), nullable=False)
    correct_answer: Mapped[str | None] = mapped_column(Text)
    points: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    has_image: Mapped[bool] = mapped_column(Boolean, default=False)
    image_url: Mapped[str | None] = mapped_column(String(500))
    options: Mapped[dict | None] = mapped_column(JSONB)
    order_index: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class RubricCriteria(Base):
    __tablename__ = "rubric_criteria"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exam_questions.id", ondelete="CASCADE"))
    description: Mapped[str] = mapped_column(Text, nullable=False)
    max_points: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    levels: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
