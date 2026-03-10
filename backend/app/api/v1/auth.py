import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.section import SectionStudent, Section
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, UserResponse

router = APIRouter()

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
        result = await db.execute(select(Section).where(Section.class_code == data.class_code))
        section = result.scalar_one_or_none()
        if section:
            section_student = SectionStudent(section_id=section.id, student_id=user.id)
            db.add(section_student)

    await db.commit()

    # Send welcome email (background, non-blocking)
    import asyncio
    from app.services.email_service import send_welcome
    asyncio.create_task(send_welcome(user.email, f"{user.first_name} {user.last_name}", user.role))

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
        created_at=user.created_at.isoformat() if user.created_at else "",
    )


@router.put("/me")
async def update_profile(
    first_name: str = None, last_name: str = None, phone: str = None,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    if first_name is not None:
        user.first_name = first_name.strip()
    if last_name is not None:
        user.last_name = last_name.strip()
    if phone is not None:
        user.phone = phone.strip() if phone else None
    await db.commit()
    return {"ok": True, "message": "Perfil actualizado"}


@router.post("/forgot-password")
async def forgot_password(email: str, db: AsyncSession = Depends(get_db)):
    """Send password reset token (stored in DB). Always returns success for security."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        token = str(uuid.uuid4())
        user.reset_token = token
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.commit()
        # Send email with reset link (background)
        import asyncio
        from app.services.email_service import send_password_reset
        asyncio.create_task(send_password_reset(user.email, user.first_name, token))
    return {"ok": True, "message": "Si el email existe, recibirás instrucciones para restablecer tu contraseña"}


@router.post("/reset-password")
async def reset_password(token: str, new_password: str, db: AsyncSession = Depends(get_db)):
    """Reset password using token from forgot-password."""
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
    current_password: str, new_password: str,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    """Change password (requires current password)."""
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(400, "Contraseña actual incorrecta")
    if not new_password or len(new_password.strip()) < 6:
        raise HTTPException(400, "La nueva contraseña debe tener al menos 6 caracteres")
    user.password_hash = hash_password(new_password)
    await db.commit()
    return {"ok": True, "message": "Contraseña cambiada exitosamente"}
