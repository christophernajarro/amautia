import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Boolean, ForeignKey, DateTime, func, Text, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base

class StudentExam(Base):
    __tablename__ = "student_exams"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exams.id", ondelete="CASCADE"), index=True)
    student_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str | None] = mapped_column(String(20))
    total_score: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    percentage: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    general_feedback: Mapped[str | None] = mapped_column(Text)
    strengths: Mapped[str | None] = mapped_column(Text)
    areas_to_improve: Mapped[str | None] = mapped_column(Text)
    extracted_content: Mapped[dict | None] = mapped_column(JSONB)
    profesor_reviewed: Mapped[bool] = mapped_column(Boolean, default=False)
    profesor_notes: Mapped[str | None] = mapped_column(Text)
    adjusted_score: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    corrected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class StudentAnswer(Base):
    __tablename__ = "student_answers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("student_exams.id", ondelete="CASCADE"), index=True)
    question_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("exam_questions.id", ondelete="SET NULL"))
    answer_text: Mapped[str | None] = mapped_column(Text)
    answer_image_url: Mapped[str | None] = mapped_column(String(500))
    score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    max_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    is_correct: Mapped[bool | None] = mapped_column(Boolean)
    feedback: Mapped[str | None] = mapped_column(Text)
    suggestion: Mapped[str | None] = mapped_column(Text)
    rubric_scores: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
