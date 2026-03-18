import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, ForeignKey, DateTime, func, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class PlagiarismCheck(Base):
    __tablename__ = "plagiarism_checks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_exam_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("student_exams.id", ondelete="SET NULL"))
    exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exams.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)  # pending, processing, completed, failed
    similarity_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    ai_generated_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    checked_by: Mapped[str] = mapped_column(String(20), default="system")  # system, manual
    report: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PlagiarismMatch(Base):
    __tablename__ = "plagiarism_matches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    check_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("plagiarism_checks.id", ondelete="CASCADE"), index=True)
    matched_student_exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("student_exams.id", ondelete="CASCADE"))
    similarity_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    matched_segments: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
