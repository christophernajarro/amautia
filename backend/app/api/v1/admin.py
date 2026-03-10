import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.core.database import get_db
from app.core.dependencies import get_admin
from app.core.security import hash_password
from app.models.user import User
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.payment import Payment
from app.models.exam import Exam
from app.models.student_exam import StudentExam
from app.models.ai_provider import AIProvider, AIModel
from app.models.system_config import SystemConfig, ActivityLog
from app.schemas.admin import (
    UserListResponse, UserCreateRequest, UserUpdateRequest, StatusToggle,
    DashboardStats, PlanResponse, PlanCreateRequest, PlanUpdateRequest,
    AIProviderResponse, AIProviderCreateRequest, AIProviderUpdateRequest,
    AIModelResponse, AIModelCreateRequest, AIModelUpdateRequest,
    PaymentResponse, PaymentRejectRequest,
    ConfigResponse, ConfigUpdateRequest, ActivityLogResponse,
)

router = APIRouter()


# ─── Dashboard ───

@router.get("/dashboard/stats", response_model=DashboardStats)
async def dashboard_stats(db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_profesores = (await db.execute(select(func.count(User.id)).where(User.role == "profesor"))).scalar() or 0
    total_alumnos = (await db.execute(select(func.count(User.id)).where(User.role == "alumno"))).scalar() or 0
    total_exams = (await db.execute(select(func.count(Exam.id)))).scalar() or 0
    total_corrections = (await db.execute(select(func.count(StudentExam.id)).where(StudentExam.status == "corrected"))).scalar() or 0
    total_revenue = float((await db.execute(select(func.coalesce(func.sum(Payment.amount), 0)).where(Payment.status == "approved"))).scalar() or 0)
    active_subs = (await db.execute(select(func.count(Subscription.id)).where(Subscription.status == "active"))).scalar() or 0
    pending_payments = (await db.execute(select(func.count(Payment.id)).where(Payment.status == "pending"))).scalar() or 0

    return DashboardStats(
        total_users=total_users, total_profesores=total_profesores, total_alumnos=total_alumnos,
        total_exams=total_exams, total_corrections=total_corrections, total_revenue=total_revenue,
        active_subscriptions=active_subs, pending_payments=pending_payments,
    )


@router.get("/dashboard/activity", response_model=list[ActivityLogResponse])
async def dashboard_activity(limit: int = 20, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(ActivityLog).order_by(desc(ActivityLog.created_at)).limit(limit))
    logs = result.scalars().all()
    return [ActivityLogResponse(id=str(l.id), user_id=str(l.user_id) if l.user_id else None, action=l.action,
            entity_type=l.entity_type, entity_id=str(l.entity_id) if l.entity_id else None,
            details=l.details, ip_address=l.ip_address, created_at=l.created_at.isoformat()) for l in logs]


# ─── Users CRUD ───

@router.get("/users", response_model=list[UserListResponse])
async def list_users(
    role: str | None = None, is_active: bool | None = None,
    search: str | None = None, limit: int = 50, offset: int = 0,
    db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)
):
    q = select(User)
    if role:
        q = q.where(User.role == role)
    if is_active is not None:
        q = q.where(User.is_active == is_active)
    if search:
        q = q.where((User.first_name.ilike(f"%{search}%")) | (User.last_name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%")))
    q = q.order_by(desc(User.created_at)).offset(offset).limit(limit)
    result = await db.execute(q)
    users = result.scalars().all()
    return [UserListResponse(id=str(u.id), email=u.email, first_name=u.first_name, last_name=u.last_name,
            role=u.role, phone=u.phone, is_active=u.is_active, is_verified=u.is_verified,
            created_at=u.created_at.isoformat()) for u in users]


@router.post("/users", response_model=UserListResponse, status_code=201)
async def create_user(data: UserCreateRequest, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email ya registrado")
    user = User(email=data.email, password_hash=hash_password(data.password), first_name=data.first_name,
                last_name=data.last_name, role=data.role, phone=data.phone, is_active=data.is_active, is_verified=True)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserListResponse(id=str(user.id), email=user.email, first_name=user.first_name, last_name=user.last_name,
            role=user.role, phone=user.phone, is_active=user.is_active, is_verified=user.is_verified,
            created_at=user.created_at.isoformat())


@router.get("/users/{user_id}", response_model=UserListResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    return UserListResponse(id=str(user.id), email=user.email, first_name=user.first_name, last_name=user.last_name,
            role=user.role, phone=user.phone, is_active=user.is_active, is_verified=user.is_verified,
            created_at=user.created_at.isoformat())


@router.put("/users/{user_id}", response_model=UserListResponse)
async def update_user(user_id: str, data: UserUpdateRequest, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return UserListResponse(id=str(user.id), email=user.email, first_name=user.first_name, last_name=user.last_name,
            role=user.role, phone=user.phone, is_active=user.is_active, is_verified=user.is_verified,
            created_at=user.created_at.isoformat())


@router.patch("/users/{user_id}/status")
async def toggle_user_status(user_id: str, data: StatusToggle, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    user.is_active = data.is_active
    await db.commit()
    return {"ok": True}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    await db.delete(user)
    await db.commit()
    return {"ok": True}


# ─── Plans CRUD ───

@router.get("/plans", response_model=list[PlanResponse])
async def list_plans(db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(Plan).order_by(Plan.display_order))
    plans = result.scalars().all()
    return [PlanResponse(id=str(p.id), name=p.name, slug=p.slug, description=p.description,
            price_monthly=float(p.price_monthly), max_corrections_month=p.max_corrections_month,
            max_generations_month=p.max_generations_month, max_students=p.max_students,
            max_subjects=p.max_subjects, has_tutor=p.has_tutor, tutor_level=p.tutor_level,
            has_rubrics=p.has_rubrics, has_analytics=p.has_analytics,
            has_whatsapp_notifications=p.has_whatsapp_notifications, is_academy=p.is_academy,
            max_professors=p.max_professors, is_active=p.is_active, display_order=p.display_order,
            created_at=p.created_at.isoformat()) for p in plans]


@router.post("/plans", response_model=PlanResponse, status_code=201)
async def create_plan(data: PlanCreateRequest, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    plan = Plan(**data.model_dump())
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return PlanResponse(id=str(plan.id), name=plan.name, slug=plan.slug, description=plan.description,
            price_monthly=float(plan.price_monthly), max_corrections_month=plan.max_corrections_month,
            max_generations_month=plan.max_generations_month, max_students=plan.max_students,
            max_subjects=plan.max_subjects, has_tutor=plan.has_tutor, tutor_level=plan.tutor_level,
            has_rubrics=plan.has_rubrics, has_analytics=plan.has_analytics,
            has_whatsapp_notifications=plan.has_whatsapp_notifications, is_academy=plan.is_academy,
            max_professors=plan.max_professors, is_active=plan.is_active, display_order=plan.display_order,
            created_at=plan.created_at.isoformat())


@router.put("/plans/{plan_id}", response_model=PlanResponse)
async def update_plan(plan_id: str, data: PlanUpdateRequest, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(404, "Plan no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)
    await db.commit()
    await db.refresh(plan)
    return PlanResponse(id=str(plan.id), name=plan.name, slug=plan.slug, description=plan.description,
            price_monthly=float(plan.price_monthly), max_corrections_month=plan.max_corrections_month,
            max_generations_month=plan.max_generations_month, max_students=plan.max_students,
            max_subjects=plan.max_subjects, has_tutor=plan.has_tutor, tutor_level=plan.tutor_level,
            has_rubrics=plan.has_rubrics, has_analytics=plan.has_analytics,
            has_whatsapp_notifications=plan.has_whatsapp_notifications, is_academy=plan.is_academy,
            max_professors=plan.max_professors, is_active=plan.is_active, display_order=plan.display_order,
            created_at=plan.created_at.isoformat())


@router.patch("/plans/{plan_id}/status")
async def toggle_plan_status(plan_id: str, data: StatusToggle, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(404, "Plan no encontrado")
    plan.is_active = data.is_active
    await db.commit()
    return {"ok": True}


# ─── AI Providers ───

@router.get("/ai/providers", response_model=list[AIProviderResponse])
async def list_providers(db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(AIProvider).order_by(AIProvider.name))
    providers = result.scalars().all()
    return [AIProviderResponse(id=str(p.id), name=p.name, slug=p.slug, is_active=p.is_active,
            config=p.config, created_at=p.created_at.isoformat()) for p in providers]


@router.post("/ai/providers", response_model=AIProviderResponse, status_code=201)
async def create_provider(data: AIProviderCreateRequest, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    provider = AIProvider(name=data.name, slug=data.slug, api_key_encrypted=data.api_key,
                          is_active=data.is_active, config=data.config)
    db.add(provider)
    await db.commit()
    await db.refresh(provider)
    return AIProviderResponse(id=str(provider.id), name=provider.name, slug=provider.slug,
            is_active=provider.is_active, config=provider.config, created_at=provider.created_at.isoformat())


@router.put("/ai/providers/{provider_id}", response_model=AIProviderResponse)
async def update_provider(provider_id: str, data: AIProviderUpdateRequest, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(AIProvider).where(AIProvider.id == provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(404, "Proveedor no encontrado")
    if data.name is not None:
        provider.name = data.name
    if data.api_key is not None:
        provider.api_key_encrypted = data.api_key
    if data.is_active is not None:
        provider.is_active = data.is_active
    if data.config is not None:
        provider.config = data.config
    await db.commit()
    await db.refresh(provider)
    return AIProviderResponse(id=str(provider.id), name=provider.name, slug=provider.slug,
            is_active=provider.is_active, config=provider.config, created_at=provider.created_at.isoformat())


@router.delete("/ai/providers/{provider_id}")
async def delete_provider(provider_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(AIProvider).where(AIProvider.id == provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(404, "Proveedor no encontrado")
    await db.delete(provider)
    await db.commit()
    return {"ok": True}


@router.post("/ai/providers/{provider_id}/test")
async def test_provider(provider_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(AIProvider).where(AIProvider.id == provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(404, "Proveedor no encontrado")
    # TODO: Actually test the provider connection
    return {"status": "ok", "message": f"Conexión con {provider.name} exitosa (stub)"}


# ─── AI Models ───

@router.get("/ai/models", response_model=list[AIModelResponse])
async def list_models(db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(AIModel).order_by(AIModel.name))
    models = result.scalars().all()
    return [AIModelResponse(id=str(m.id), provider_id=str(m.provider_id), name=m.name, model_id=m.model_id,
            supports_vision=m.supports_vision, supports_text=m.supports_text, max_tokens=m.max_tokens,
            is_default_correction=m.is_default_correction, is_default_generation=m.is_default_generation,
            is_default_tutor=m.is_default_tutor, is_default_vision=m.is_default_vision,
            is_active=m.is_active, created_at=m.created_at.isoformat()) for m in models]


@router.post("/ai/models", response_model=AIModelResponse, status_code=201)
async def create_model(data: AIModelCreateRequest, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    model = AIModel(provider_id=uuid.UUID(data.provider_id), name=data.name, model_id=data.model_id,
                    supports_vision=data.supports_vision, supports_text=data.supports_text,
                    max_tokens=data.max_tokens, is_active=data.is_active)
    db.add(model)
    await db.commit()
    await db.refresh(model)
    return AIModelResponse(id=str(model.id), provider_id=str(model.provider_id), name=model.name,
            model_id=model.model_id, supports_vision=model.supports_vision, supports_text=model.supports_text,
            max_tokens=model.max_tokens, is_default_correction=model.is_default_correction,
            is_default_generation=model.is_default_generation, is_default_tutor=model.is_default_tutor,
            is_default_vision=model.is_default_vision, is_active=model.is_active,
            created_at=model.created_at.isoformat())


@router.put("/ai/models/{model_id}", response_model=AIModelResponse)
async def update_model(model_id: str, data: AIModelUpdateRequest, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(AIModel).where(AIModel.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(404, "Modelo no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(model, field, value)
    await db.commit()
    await db.refresh(model)
    return AIModelResponse(id=str(model.id), provider_id=str(model.provider_id), name=model.name,
            model_id=model.model_id, supports_vision=model.supports_vision, supports_text=model.supports_text,
            max_tokens=model.max_tokens, is_default_correction=model.is_default_correction,
            is_default_generation=model.is_default_generation, is_default_tutor=model.is_default_tutor,
            is_default_vision=model.is_default_vision, is_active=model.is_active,
            created_at=model.created_at.isoformat())


@router.patch("/ai/models/{model_id}/default")
async def set_default_model(model_id: str, task: str = Query(..., description="correction|generation|tutor|vision"),
                            db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    field_map = {"correction": "is_default_correction", "generation": "is_default_generation",
                 "tutor": "is_default_tutor", "vision": "is_default_vision"}
    if task not in field_map:
        raise HTTPException(400, f"Task debe ser: {', '.join(field_map.keys())}")
    # Unset current default
    field = field_map[task]
    all_models = (await db.execute(select(AIModel))).scalars().all()
    for m in all_models:
        setattr(m, field, False)
    # Set new default
    result = await db.execute(select(AIModel).where(AIModel.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(404, "Modelo no encontrado")
    setattr(model, field, True)
    await db.commit()
    return {"ok": True}


@router.delete("/ai/models/{model_id}")
async def delete_model(model_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(AIModel).where(AIModel.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(404, "Modelo no encontrado")
    await db.delete(model)
    await db.commit()
    return {"ok": True}


# ─── Payments ───

@router.get("/payments", response_model=list[PaymentResponse])
async def list_payments(status_filter: str | None = None, limit: int = 50, offset: int = 0,
                        db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    q = select(Payment).order_by(desc(Payment.created_at))
    if status_filter:
        q = q.where(Payment.status == status_filter)
    q = q.offset(offset).limit(limit)
    result = await db.execute(q)
    payments = result.scalars().all()
    return [PaymentResponse(id=str(p.id), user_id=str(p.user_id), plan_id=str(p.plan_id),
            amount=float(p.amount), currency=p.currency, method=p.method, receipt_url=p.receipt_url,
            reference_code=p.reference_code, status=p.status, rejection_reason=p.rejection_reason,
            created_at=p.created_at.isoformat()) for p in payments]


@router.get("/payments/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Pago no encontrado")
    return PaymentResponse(id=str(p.id), user_id=str(p.user_id), plan_id=str(p.plan_id),
            amount=float(p.amount), currency=p.currency, method=p.method, receipt_url=p.receipt_url,
            reference_code=p.reference_code, status=p.status, rejection_reason=p.rejection_reason,
            created_at=p.created_at.isoformat())


@router.patch("/payments/{payment_id}/approve")
async def approve_payment(payment_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(404, "Pago no encontrado")
    payment.status = "approved"
    payment.reviewed_by = admin.id
    payment.reviewed_at = datetime.now(timezone.utc)
    # TODO: Activate/extend subscription
    await db.commit()
    return {"ok": True}


@router.patch("/payments/{payment_id}/reject")
async def reject_payment(payment_id: str, data: PaymentRejectRequest, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(404, "Pago no encontrado")
    payment.status = "rejected"
    payment.rejection_reason = data.reason
    payment.reviewed_by = admin.id
    payment.reviewed_at = datetime.now(timezone.utc)
    await db.commit()
    return {"ok": True}


# ─── Config ───

@router.get("/config", response_model=list[ConfigResponse])
async def list_config(db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(SystemConfig))
    configs = result.scalars().all()
    return [ConfigResponse(key=c.key, value=c.value, description=c.description) for c in configs]


@router.put("/config/{key}", response_model=ConfigResponse)
async def update_config(key: str, data: ConfigUpdateRequest, db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    result = await db.execute(select(SystemConfig).where(SystemConfig.key == key))
    config = result.scalar_one_or_none()
    if not config:
        config = SystemConfig(key=key, value=data.value)
        db.add(config)
    else:
        config.value = data.value
    await db.commit()
    return ConfigResponse(key=config.key, value=config.value, description=config.description)


# ─── Logs ───

@router.get("/logs", response_model=list[ActivityLogResponse])
async def list_logs(limit: int = 50, offset: int = 0, action: str | None = None,
                    db: AsyncSession = Depends(get_db), admin: User = Depends(get_admin)):
    q = select(ActivityLog).order_by(desc(ActivityLog.created_at))
    if action:
        q = q.where(ActivityLog.action.ilike(f"%{action}%"))
    q = q.offset(offset).limit(limit)
    result = await db.execute(q)
    logs = result.scalars().all()
    return [ActivityLogResponse(id=str(l.id), user_id=str(l.user_id) if l.user_id else None, action=l.action,
            entity_type=l.entity_type, entity_id=str(l.entity_id) if l.entity_id else None,
            details=l.details, ip_address=l.ip_address, created_at=l.created_at.isoformat()) for l in logs]
