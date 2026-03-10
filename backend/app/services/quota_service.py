"""Check and enforce plan limits."""
from app.models.user import User
from app.models.subscription import Subscription
from app.models.student_exam import StudentExam
from app.models.generated_exam import GeneratedExam
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone


async def get_user_plan(user_id, db: AsyncSession) -> dict | None:
    """Get active subscription and plan limits."""
    from app.models.plan import Plan

    sub = (await db.execute(
        select(Subscription).where(
            Subscription.user_id == user_id,
            Subscription.status == "active",
            Subscription.expires_at > datetime.now(timezone.utc),
        ).order_by(Subscription.created_at.desc()).limit(1)
    )).scalar_one_or_none()

    if not sub:
        return None

    plan = (await db.execute(select(Plan).where(Plan.id == sub.plan_id))).scalar_one_or_none()
    if not plan:
        return None

    return {
        "plan_id": str(plan.id),
        "name": plan.name,
        "max_corrections_month": plan.max_corrections_month,
        "max_generations_month": plan.max_generations_month,
        "max_subjects": plan.max_subjects,
        "max_students": plan.max_students,
        "corrections_used": sub.corrections_used,
        "generations_used": sub.generations_used,
        "expires_at": sub.expires_at.isoformat(),
    }


async def can_correct_exam(user_id, db: AsyncSession) -> tuple[bool, str]:
    """Check if user can correct another exam."""
    plan = await get_user_plan(user_id, db)
    if not plan:
        return False, "No subscription active"

    if plan["max_corrections_month"] == -1:  # Unlimited
        return True, "OK"

    remaining = plan["max_corrections_month"] - plan["corrections_used"]
    if remaining <= 0:
        return False, f"Plan limit reached. Max: {plan['max_corrections_month']}/month"

    return True, f"{remaining} corrections remaining"


async def can_generate_exam(user_id, db: AsyncSession) -> tuple[bool, str]:
    """Check if user can generate another exam."""
    plan = await get_user_plan(user_id, db)
    if not plan:
        return False, "No subscription active"

    if plan["max_generations_month"] == -1:  # Unlimited
        return True, "OK"

    remaining = plan["max_generations_month"] - plan["generations_used"]
    if remaining <= 0:
        return False, f"Plan limit reached. Max: {plan['max_generations_month']}/month"

    return True, f"{remaining} generations remaining"


async def increment_corrections_count(user_id, count: int = 1, db: AsyncSession = None):
    """Increment correction usage."""
    if not db:
        return

    from app.models.subscription import Subscription

    sub = (await db.execute(
        select(Subscription).where(
            Subscription.user_id == user_id,
            Subscription.status == "active",
        ).order_by(Subscription.created_at.desc()).limit(1)
    )).scalar_one_or_none()

    if sub:
        sub.corrections_used = (sub.corrections_used or 0) + count
        await db.commit()


async def increment_generations_count(user_id, count: int = 1, db: AsyncSession = None):
    """Increment generation usage."""
    if not db:
        return

    from app.models.subscription import Subscription

    sub = (await db.execute(
        select(Subscription).where(
            Subscription.user_id == user_id,
            Subscription.status == "active",
        ).order_by(Subscription.created_at.desc()).limit(1)
    )).scalar_one_or_none()

    if sub:
        sub.generations_used = (sub.generations_used or 0) + count
        await db.commit()


async def user_usage_stats(user_id, db: AsyncSession) -> dict:
    """Get user's current usage stats."""
    plan = await get_user_plan(user_id, db)
    if not plan:
        return {
            "has_subscription": False,
            "message": "No active subscription",
        }

    return {
        "has_subscription": True,
        "plan": plan["name"],
        "corrections": {
            "used": plan["corrections_used"],
            "limit": plan["max_corrections_month"],
            "remaining": -1 if plan["max_corrections_month"] == -1 else max(0, plan["max_corrections_month"] - plan["corrections_used"]),
            "unlimited": plan["max_corrections_month"] == -1,
        },
        "generations": {
            "used": plan["generations_used"],
            "limit": plan["max_generations_month"],
            "remaining": -1 if plan["max_generations_month"] == -1 else max(0, plan["max_generations_month"] - plan["generations_used"]),
            "unlimited": plan["max_generations_month"] == -1,
        },
        "expires_at": plan["expires_at"],
    }
