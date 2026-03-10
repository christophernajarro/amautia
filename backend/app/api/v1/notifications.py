from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, update
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.alumno import NotificationResponse

router = APIRouter()


@router.get("/", response_model=list[NotificationResponse])
async def list_notifications(limit: int = 50, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Notification).where(Notification.user_id == user.id)
        .order_by(desc(Notification.created_at)).limit(limit)
    )
    notifs = result.scalars().all()
    return [NotificationResponse(id=str(n.id), type=n.type, title=n.title, message=n.message,
            is_read=n.is_read, created_at=n.created_at.isoformat()) for n in notifs]


@router.get("/unread-count")
async def unread_count(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    count = (await db.execute(
        select(func.count(Notification.id)).where(Notification.user_id == user.id, Notification.is_read == False)
    )).scalar() or 0
    return {"count": count}


@router.patch("/{notification_id}/read")
async def mark_read(notification_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Notification).where(Notification.id == notification_id, Notification.user_id == user.id))
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(404, "Notificación no encontrada")
    notif.is_read = True
    notif.read_at = datetime.now(timezone.utc)
    await db.commit()
    return {"ok": True}


@router.patch("/read-all")
async def mark_all_read(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    await db.execute(
        update(Notification).where(Notification.user_id == user.id, Notification.is_read == False)
        .values(is_read=True, read_at=datetime.now(timezone.utc))
    )
    await db.commit()
    return {"ok": True}
