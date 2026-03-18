import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Boolean, Integer, ForeignKey, DateTime, func, Text, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class PeerReviewAssignment(Base):
    __tablename__ = "peer_review_assignments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exams.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, assigned, in_progress, completed
    reviews_per_student: Mapped[int] = mapped_column(Integer, default=2)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=True)
    rubric: Mapped[dict | None] = mapped_column(JSONB)
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PeerReview(Base):
    __tablename__ = "peer_reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("peer_review_assignments.id", ondelete="CASCADE"), index=True)
    reviewer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    reviewee_exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("student_exams.id", ondelete="CASCADE"))
    score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    feedback: Mapped[str | None] = mapped_column(Text)
    rubric_scores: Mapped[dict | None] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, submitted, reviewed_by_teacher
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
