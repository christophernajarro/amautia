import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Boolean, Integer, ForeignKey, DateTime, func, Text, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base

class GeneratedExam(Base):
    __tablename__ = "generated_exams"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profesor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    subject_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="SET NULL"))
    title: Mapped[str | None] = mapped_column(String(300))
    source_type: Mapped[str | None] = mapped_column(String(30))
    source_files: Mapped[dict | None] = mapped_column(JSONB)
    source_text: Mapped[str | None] = mapped_column(Text)
    difficulty: Mapped[str | None] = mapped_column(String(20))
    num_questions: Mapped[int | None] = mapped_column(Integer)
    question_types: Mapped[dict | None] = mapped_column(JSONB)
    include_images: Mapped[bool] = mapped_column(Boolean, default=False)
    education_level: Mapped[str | None] = mapped_column(String(50))
    generated_content: Mapped[dict | None] = mapped_column(JSONB)
    answer_key: Mapped[dict | None] = mapped_column(JSONB)
    pdf_url: Mapped[str | None] = mapped_column(String(500))
    pdf_with_answers_url: Mapped[str | None] = mapped_column(String(500))
    word_url: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), default="generating")
    ai_provider: Mapped[str | None] = mapped_column(String(50))
    ai_model: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class GeneratedQuestion(Base):
    __tablename__ = "generated_questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    generated_exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("generated_exams.id", ondelete="CASCADE"))
    question_number: Mapped[int | None] = mapped_column(Integer)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str | None] = mapped_column(String(30))
    correct_answer: Mapped[str | None] = mapped_column(Text)
    explanation: Mapped[str | None] = mapped_column(Text)
    points: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    has_image: Mapped[bool] = mapped_column(Boolean, default=False)
    image_url: Mapped[str | None] = mapped_column(String(500))
    options: Mapped[dict | None] = mapped_column(JSONB)
    order_index: Mapped[int | None] = mapped_column(Integer)
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False)
    original_text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
