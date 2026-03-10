from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.plan import Plan
from app.models.payment import Payment
from app.models.subscription import Subscription
from app.schemas.admin import PlanResponse, PaymentResponse
from pydantic import BaseModel


router = APIRouter()


class PaymentRequest(BaseModel):
    plan_id: str
    method: str = "yape"
    reference_code: str | None = None


class SubscriptionResponse(BaseModel):
    id: str | None = None
    plan_name: str | None = None
    status: str | None = None
    starts_at: str | None = None
    expires_at: str | None = None
    corrections_used: int = 0
    generations_used: int = 0


@router.get("/plans", response_model=list[PlanResponse])
async def public_plans(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plan).where(Plan.is_active == True).order_by(Plan.display_order))
    plans = result.scalars().all()
    return [PlanResponse(id=str(p.id), name=p.name, slug=p.slug, description=p.description,
            price_monthly=float(p.price_monthly), max_corrections_month=p.max_corrections_month,
            max_generations_month=p.max_generations_month, max_students=p.max_students,
            max_subjects=p.max_subjects, has_tutor=p.has_tutor, tutor_level=p.tutor_level,
            has_rubrics=p.has_rubrics, has_analytics=p.has_analytics,
            has_whatsapp_notifications=p.has_whatsapp_notifications, is_academy=p.is_academy,
            max_professors=p.max_professors, is_active=p.is_active, display_order=p.display_order,
            created_at=p.created_at.isoformat()) for p in plans]


@router.post("/request", response_model=PaymentResponse, status_code=201)
async def request_payment(data: PaymentRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    plan = (await db.execute(select(Plan).where(Plan.id == data.plan_id))).scalar_one_or_none()
    if not plan:
        raise HTTPException(404, "Plan no encontrado")
    payment = Payment(user_id=user.id, plan_id=plan.id, amount=plan.price_monthly,
                      method=data.method, reference_code=data.reference_code)
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return PaymentResponse(id=str(payment.id), user_id=str(payment.user_id), plan_id=str(payment.plan_id),
            amount=float(payment.amount), currency=payment.currency, method=payment.method,
            receipt_url=payment.receipt_url, reference_code=payment.reference_code,
            status=payment.status, created_at=payment.created_at.isoformat())


@router.get("/my-payments", response_model=list[PaymentResponse])
async def my_payments(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Payment).where(Payment.user_id == user.id).order_by(desc(Payment.created_at)))
    payments = result.scalars().all()
    return [PaymentResponse(id=str(p.id), user_id=str(p.user_id), plan_id=str(p.plan_id),
            amount=float(p.amount), currency=p.currency, method=p.method, receipt_url=p.receipt_url,
            reference_code=p.reference_code, status=p.status, rejection_reason=p.rejection_reason,
            created_at=p.created_at.isoformat()) for p in payments]


@router.get("/my-subscription", response_model=SubscriptionResponse)
async def my_subscription(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Subscription, Plan.name).join(Plan, Plan.id == Subscription.plan_id)
                              .where(Subscription.user_id == user.id, Subscription.status == "active")
                              .order_by(desc(Subscription.created_at)).limit(1))
    row = result.first()
    if not row:
        return SubscriptionResponse()
    sub, plan_name = row
    return SubscriptionResponse(id=str(sub.id), plan_name=plan_name, status=sub.status,
            starts_at=sub.starts_at.isoformat(), expires_at=sub.expires_at.isoformat(),
            corrections_used=sub.corrections_used, generations_used=sub.generations_used)


@router.post("/upload-receipt")
async def upload_receipt(plan_id: str = Form(...), amount: float = Form(...),
                         payment_method: str = Form("yape"),
                         file: UploadFile = File(...),
                         db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Upload payment receipt (Yape/Plin/bank transfer screenshot)."""
    from app.services.storage import save_file
    from decimal import Decimal

    plan = (await db.execute(select(Plan).where(Plan.slug == plan_id))).scalar_one_or_none()
    if not plan:
        # Try by ID
        plan = (await db.execute(select(Plan).where(Plan.id == plan_id))).scalar_one_or_none()
    
    receipt_url = await save_file(file, f"receipts/{str(user.id)}")
    
    payment = Payment(
        user_id=user.id, plan_id=plan.id if plan else None,
        amount=Decimal(str(amount)), method=payment_method,
        receipt_url=receipt_url, status="pending",
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    
    return {"id": str(payment.id), "status": "pending", "receipt_url": receipt_url,
            "message": "Comprobante recibido. Tu suscripción será activada tras verificación."}
