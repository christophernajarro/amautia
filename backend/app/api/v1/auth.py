import uuid
import time
import secrets
import logging
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.section import SectionStudent, Section
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, UserResponse, UpdateProfileRequest, ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Email safety wrapper ───

async def safe_send_email(coro):
    """Await an email coroutine, catching and logging any exception."""
    try:
        await coro
    except Exception as e:
        logger.error(f"Email send failed: {e}")


# ─── Forgot-password rate limiting (in-memory, per email) ───

_forgot_pw_tracker: dict[str, list[float]] = defaultdict(list)
_FORGOT_PW_MAX_REQUESTS = 3
_FORGOT_PW_WINDOW = 15 * 60  # 15 minutes in seconds


def _check_forgot_pw_rate_limit(email: str) -> bool:
    """Return True if the email is within rate limits, False if exceeded."""
    now = time.time()
    key = email.lower().strip()
    # Clean old entries for this email
    _forgot_pw_tracker[key] = [t for t in _forgot_pw_tracker[key] if now - t < _FORGOT_PW_WINDOW]
    if len(_forgot_pw_tracker[key]) >= _FORGOT_PW_MAX_REQUESTS:
        return False
    _forgot_pw_tracker[key].append(now)
    # Periodic cleanup: remove emails with no recent entries
    if len(_forgot_pw_tracker) > 500:
        cutoff = now - _FORGOT_PW_WINDOW
        stale = [k for k, times in _forgot_pw_tracker.items() if not any(t > cutoff for t in times)]
        for k in stale:
            del _forgot_pw_tracker[k]
    return True

@router.post("/register", response_model=TokenResponse)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email exists
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    # Validate role
    if data.role not in ("profesor", "alumno"):
        raise HTTPException(status_code=400, detail="Rol inválido")

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        role=data.role,
        phone=data.phone,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    await db.flush()

    # If student provided class_code, join the section
    if data.class_code and data.role == "alumno":
        result = await db.execute(select(Section).where(Section.class_code == data.class_code, Section.is_active == True))
        section = result.scalar_one_or_none()
        if section:
            section_student = SectionStudent(section_id=section.id, student_id=user.id)
            db.add(section_student)

    await db.commit()

    # Send welcome email (background, non-blocking)
    import asyncio
    from app.services.email_service import send_welcome
    asyncio.create_task(safe_send_email(send_welcome(user.email, f"{user.first_name} {user.last_name}", user.role)))

    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Cuenta desactivada")

    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)

@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Refresh token inválido")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)

@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        phone=user.phone,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        is_verified=user.is_verified,
        theme=user.theme or "system",
        created_at=user.created_at.isoformat() if user.created_at else "",
    )


@router.put("/me")
async def update_profile(
    data: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    if data.first_name is not None:
        user.first_name = data.first_name.strip()
    if data.last_name is not None:
        user.last_name = data.last_name.strip()
    if data.phone is not None:
        user.phone = data.phone.strip() if data.phone else None
    if data.theme is not None:
        if data.theme not in ("light", "dark", "system"):
            raise HTTPException(status_code=400, detail="Tema debe ser: light, dark, system")
        user.theme = data.theme
    await db.commit()
    return {"ok": True, "message": "Perfil actualizado"}


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Send password reset token (stored in DB). Always returns success for security."""
    email = data.email
    generic_msg = "Si el email existe, recibirás instrucciones para restablecer tu contraseña"

    # Rate limit by email (max 3 per 15 min) — always return generic message
    if not _check_forgot_pw_rate_limit(email):
        return {"ok": True, "message": generic_msg}

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        # Rate limit: if a reset token was created recently, skip
        if user.reset_token_expires and user.reset_token_expires > datetime.now(timezone.utc) + timedelta(minutes=55):
            return {"ok": True, "message": generic_msg}
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.commit()
        # Send email with reset link (background)
        import asyncio
        from app.services.email_service import send_password_reset
        asyncio.create_task(safe_send_email(send_password_reset(user.email, user.first_name, token)))
    return {"ok": True, "message": generic_msg}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using token from forgot-password."""
    token = data.token
    new_password = data.new_password
    if not new_password or len(new_password.strip()) < 6:
        raise HTTPException(400, "La contraseña debe tener al menos 6 caracteres")
    result = await db.execute(select(User).where(User.reset_token == token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(400, "Token inválido o expirado")
    if user.reset_token_expires and user.reset_token_expires < datetime.now(timezone.utc):
        raise HTTPException(400, "Token expirado. Solicita uno nuevo.")
    user.password_hash = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    await db.commit()
    return {"ok": True, "message": "Contraseña actualizada exitosamente"}


@router.put("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    """Change password (requires current password)."""
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(400, "Contraseña actual incorrecta")
    if not data.new_password or len(data.new_password.strip()) < 6:
        raise HTTPException(400, "La nueva contraseña debe tener al menos 6 caracteres")
    user.password_hash = hash_password(data.new_password)
    await db.commit()
    return {"ok": True, "message": "Contraseña cambiada exitosamente"}
