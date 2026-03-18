"""Gamification: profiles, badges, leaderboard, points."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, update
from datetime import date, datetime, timedelta, timezone
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_alumno
from app.models.user import User
from app.models.gamification import GamificationProfile, Badge, UserBadge, PointTransaction, LeaderboardEntry
from app.schemas.features import (
    GamificationProfileResponse, BadgeResponse, LeaderboardEntryResponse, PointTransactionResponse
)

router = APIRouter()


# ─── Helpers ───

async def _get_or_create_profile(db: AsyncSession, user_id: uuid.UUID) -> GamificationProfile:
    """Get existing gamification profile or create a new one."""
    result = await db.execute(
        select(GamificationProfile).where(GamificationProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        profile = GamificationProfile(user_id=user_id)
        db.add(profile)
        await db.flush()
    return profile


async def award_points(
    db: AsyncSession, user_id: uuid.UUID, points: int, action: str, description: str | None = None
) -> GamificationProfile:
    """Award points to a user, update streaks, check badge requirements.

    1. Get or create GamificationProfile
    2. Update total_points += points, xp += points
    3. Check streak (yesterday = increment, today = skip, else reset to 1)
    4. Update level = total_points // 100 + 1
    5. Check all badges where requirement_type matches action and requirement_value <= count
    6. Create PointTransaction record
    """
    profile = await _get_or_create_profile(db, user_id)

    # Update points and xp
    profile.total_points += points
    profile.xp += points

    # Update streak logic
    today = date.today()
    if profile.last_activity_date is None:
        profile.current_streak = 1
    elif profile.last_activity_date == today:
        pass  # Already active today, skip streak update
    elif profile.last_activity_date == today - timedelta(days=1):
        profile.current_streak += 1
    else:
        profile.current_streak = 1

    profile.last_activity_date = today

    # Update longest streak
    if profile.current_streak > profile.longest_streak:
        profile.longest_streak = profile.current_streak

    # Update level
    profile.level = profile.total_points // 100 + 1

    # Create point transaction
    transaction = PointTransaction(
        user_id=user_id,
        points=points,
        action=action,
        description=description,
    )
    db.add(transaction)

    # Count total actions of this type for badge checking
    action_count = (await db.execute(
        select(func.count(PointTransaction.id)).where(
            PointTransaction.user_id == user_id,
            PointTransaction.action == action,
        )
    )).scalar() or 0
    # Include the one we just added (not yet flushed in count)
    action_count += 1

    # Check badge requirements and award new badges
    eligible_badges = (await db.execute(
        select(Badge).where(
            Badge.requirement_type == action,
            Badge.requirement_value <= action_count,
            Badge.is_active == True,
        )
    )).scalars().all()

    for badge in eligible_badges:
        # Check if already earned
        already_earned = (await db.execute(
            select(UserBadge).where(
                UserBadge.user_id == user_id,
                UserBadge.badge_id == badge.id,
            )
        )).scalar_one_or_none()
        if not already_earned:
            db.add(UserBadge(user_id=user_id, badge_id=badge.id))

    await db.flush()
    return profile


# ─── Endpoints ───

@router.get("/profile", response_model=GamificationProfileResponse)
async def get_profile(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Get current user's gamification profile. Creates one if it doesn't exist."""
    profile = await _get_or_create_profile(db, user.id)
    await db.commit()
    return GamificationProfileResponse(
        total_points=profile.total_points,
        current_streak=profile.current_streak,
        longest_streak=profile.longest_streak,
        level=profile.level,
        xp=profile.xp,
        last_activity_date=profile.last_activity_date.isoformat() if profile.last_activity_date else None,
    )


@router.get("/badges", response_model=list[BadgeResponse])
async def list_badges(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """List all available badges."""
    badges = (await db.execute(
        select(Badge).where(Badge.is_active == True).order_by(Badge.category, Badge.name)
    )).scalars().all()
    return [
        BadgeResponse(
            id=str(b.id), name=b.name, description=b.description,
            icon=b.icon, category=b.category,
        )
        for b in badges
    ]


@router.get("/my-badges", response_model=list[BadgeResponse])
async def my_badges(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """List current user's earned badges."""
    rows = (await db.execute(
        select(Badge, UserBadge.earned_at)
        .join(UserBadge, UserBadge.badge_id == Badge.id)
        .where(UserBadge.user_id == user.id)
        .order_by(desc(UserBadge.earned_at))
    )).all()
    return [
        BadgeResponse(
            id=str(badge.id), name=badge.name, description=badge.description,
            icon=badge.icon, category=badge.category,
            earned_at=earned_at.isoformat() if earned_at else None,
        )
        for badge, earned_at in rows
    ]


@router.get("/leaderboard", response_model=list[LeaderboardEntryResponse])
async def get_leaderboard(
    section_id: str | None = None, period: str = "weekly",
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user),
):
    """Get leaderboard. Optionally filter by section and period."""
    query = (
        select(LeaderboardEntry, User, GamificationProfile)
        .join(User, User.id == LeaderboardEntry.user_id)
        .outerjoin(GamificationProfile, GamificationProfile.user_id == LeaderboardEntry.user_id)
        .where(LeaderboardEntry.period == period)
    )
    if section_id:
        query = query.where(LeaderboardEntry.section_id == section_id)
    query = query.order_by(desc(LeaderboardEntry.points)).limit(50)

    rows = (await db.execute(query)).all()
    return [
        LeaderboardEntryResponse(
            rank=i + 1,
            user_id=str(entry.user_id),
            user_name=f"{u.first_name} {u.last_name}",
            points=entry.points,
            level=gp.level if gp else 1,
            avatar_url=u.avatar_url,
        )
        for i, (entry, u, gp) in enumerate(rows)
    ]


@router.get("/points-history", response_model=list[PointTransactionResponse])
async def points_history(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Get current user's point transactions history."""
    transactions = (await db.execute(
        select(PointTransaction)
        .where(PointTransaction.user_id == user.id)
        .order_by(desc(PointTransaction.created_at))
        .limit(50)
    )).scalars().all()
    return [
        PointTransactionResponse(
            id=str(t.id), points=t.points, action=t.action,
            description=t.description,
            created_at=t.created_at.isoformat(),
        )
        for t in transactions
    ]
