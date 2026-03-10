import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Boolean, Integer, DateTime, func, Text, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    price_monthly: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    max_corrections_month: Mapped[int | None] = mapped_column(Integer)
    max_generations_month: Mapped[int | None] = mapped_column(Integer)
    max_students: Mapped[int | None] = mapped_column(Integer)
    max_subjects: Mapped[int | None] = mapped_column(Integer)
    has_tutor: Mapped[bool] = mapped_column(Boolean, default=False)
    tutor_level: Mapped[str | None] = mapped_column(String(20))
    has_whatsapp_notifications: Mapped[bool] = mapped_column(Boolean, default=False)
    has_export: Mapped[bool] = mapped_column(Boolean, default=True)
    has_rubrics: Mapped[bool] = mapped_column(Boolean, default=False)
    has_analytics: Mapped[bool] = mapped_column(Boolean, default=False)
    is_academy: Mapped[bool] = mapped_column(Boolean, default=False)
    max_professors: Mapped[int] = mapped_column(Integer, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
