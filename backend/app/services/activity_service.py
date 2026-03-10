"""Log user activities for auditing — non-blocking, own session."""
import uuid
import logging
from app.models.system_config import ActivityLog


async def log_activity(user_id, action: str, entity_type: str,
                       entity_id: str = "", details: dict | None = None):
    """Fire-and-forget activity log with its own DB session."""
    try:
        from app.core.database import async_session
        async with async_session() as db:
            activity = ActivityLog(
                user_id=uuid.UUID(str(user_id)) if not isinstance(user_id, uuid.UUID) else user_id,
                action=action,
                entity_type=entity_type,
                entity_id=uuid.UUID(entity_id) if entity_id else None,
                details=details or {},
            )
            db.add(activity)
            await db.commit()
    except Exception as e:
        logging.warning(f"Activity log skipped: {e}")


async def log_exam_corrected(user_id, exam_id: str, count: int, db=None):
    await log_activity(user_id, "exam_corrected", "exam", exam_id, {"count": count})

async def log_exam_generated(user_id, exam_id: str, title: str, db=None):
    await log_activity(user_id, "exam_generated", "exam", exam_id, {"title": title})

async def log_payment_received(user_id, payment_id: str, amount: float, db=None):
    await log_activity(user_id, "payment_received", "payment", payment_id, {"amount": amount})

async def log_student_imported(user_id, count: int, db=None):
    await log_activity(user_id, "students_imported", "import", "", {"count": count})
