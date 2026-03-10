"""Log user activities for auditing."""
from datetime import datetime, timezone
from app.models.activity_log import ActivityLog
from sqlalchemy.ext.asyncio import AsyncSession
import uuid


async def log_activity(user_id: uuid.UUID | str, action: str, resource_type: str,
                       resource_id: str = "", details: dict | None = None,
                       db: AsyncSession = None):
    """Log an activity (non-blocking)."""
    if not db:
        return

    try:
        activity = ActivityLog(
            user_id=uuid.UUID(str(user_id)) if not isinstance(user_id, uuid.UUID) else user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            timestamp=datetime.now(timezone.utc),
        )
        db.add(activity)
        await db.commit()
    except Exception as e:
        import logging
        logging.error(f"Activity logging error: {e}")


# Convenience functions
async def log_exam_created(user_id, exam_id: str, title: str, db: AsyncSession = None):
    await log_activity(user_id, "exam_created", "exam", exam_id, {"title": title}, db)


async def log_exam_corrected(user_id, exam_id: str, count: int, db: AsyncSession = None):
    await log_activity(user_id, "exam_corrected", "exam", exam_id, {"count": count}, db)


async def log_exam_generated(user_id, exam_id: str, title: str, db: AsyncSession = None):
    await log_activity(user_id, "exam_generated", "exam", exam_id, {"title": title}, db)


async def log_payment_received(user_id, payment_id: str, amount: float, db: AsyncSession = None):
    await log_activity(user_id, "payment_received", "payment", payment_id, {"amount": amount}, db)


async def log_payment_approved(user_id, payment_id: str, db: AsyncSession = None):
    await log_activity(user_id, "payment_approved", "payment", payment_id, {}, db)


async def log_student_imported(user_id, count: int, db: AsyncSession = None):
    await log_activity(user_id, "students_imported", "import", "", {"count": count}, db)
