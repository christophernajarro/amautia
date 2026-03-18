from pydantic import BaseModel, EmailStr
from decimal import Decimal


class UserListResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    phone: str | None = None
    is_active: bool
    is_verified: bool
    created_at: str

    class Config:
        from_attributes = True


class UserCreateRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: str
    phone: str | None = None
    is_active: bool = True


class UserUpdateRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    role: str | None = None
    phone: str | None = None
    is_active: bool | None = None
    is_verified: bool | None = None


class StatusToggle(BaseModel):
    is_active: bool


class DashboardStats(BaseModel):
    total_users: int
    total_profesores: int
    total_alumnos: int
    total_exams: int
    total_corrections: int
    total_revenue: float
    active_subscriptions: int
    pending_payments: int


class PlanResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None = None
    price_monthly: float
    max_corrections_month: int | None = None
    max_generations_month: int | None = None
    max_students: int | None = None
    max_subjects: int | None = None
    has_tutor: bool
    tutor_level: str | None = None
    has_rubrics: bool
    has_analytics: bool
    has_whatsapp_notifications: bool
    is_academy: bool
    max_professors: int
    is_active: bool
    display_order: int
    created_at: str

    class Config:
        from_attributes = True


class PlanCreateRequest(BaseModel):
    name: str
    slug: str
    description: str | None = None
    price_monthly: float
    max_corrections_month: int | None = None
    max_generations_month: int | None = None
    max_students: int | None = None
    max_subjects: int | None = None
    has_tutor: bool = False
    tutor_level: str | None = None
    has_rubrics: bool = False
    has_analytics: bool = False
    has_whatsapp_notifications: bool = False
    is_academy: bool = False
    max_professors: int = 1
    display_order: int = 0


class PlanUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    price_monthly: float | None = None
    max_corrections_month: int | None = None
    max_generations_month: int | None = None
    max_students: int | None = None
    max_subjects: int | None = None
    has_tutor: bool | None = None
    tutor_level: str | None = None
    has_rubrics: bool | None = None
    has_analytics: bool | None = None
    has_whatsapp_notifications: bool | None = None
    is_academy: bool | None = None
    max_professors: int | None = None
    display_order: int | None = None


class AIProviderResponse(BaseModel):
    id: str
    name: str
    slug: str
    is_active: bool
    config: dict | None = None
    created_at: str

    class Config:
        from_attributes = True


class AIProviderCreateRequest(BaseModel):
    name: str
    slug: str
    api_key: str | None = None
    is_active: bool = True
    config: dict | None = None


class AIProviderUpdateRequest(BaseModel):
    name: str | None = None
    api_key: str | None = None
    is_active: bool | None = None
    config: dict | None = None


class AIModelResponse(BaseModel):
    id: str
    provider_id: str
    name: str
    model_id: str
    supports_vision: bool
    supports_text: bool
    max_tokens: int | None = None
    is_default_correction: bool
    is_default_generation: bool
    is_default_tutor: bool
    is_default_vision: bool
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True


class AIModelCreateRequest(BaseModel):
    provider_id: str
    name: str
    model_id: str
    supports_vision: bool = False
    supports_text: bool = True
    max_tokens: int | None = None
    is_active: bool = True


class AIModelUpdateRequest(BaseModel):
    name: str | None = None
    model_id: str | None = None
    supports_vision: bool | None = None
    supports_text: bool | None = None
    max_tokens: int | None = None
    is_active: bool | None = None


class PaymentResponse(BaseModel):
    id: str
    user_id: str
    plan_id: str
    user_email: str | None = None
    plan_name: str | None = None
    amount: float
    currency: str
    method: str
    receipt_url: str | None = None
    reference_code: str | None = None
    status: str
    rejection_reason: str | None = None
    created_at: str

    class Config:
        from_attributes = True


class PaymentRejectRequest(BaseModel):
    reason: str


class ConfigResponse(BaseModel):
    key: str
    value: dict
    description: str | None = None

    class Config:
        from_attributes = True


class ConfigUpdateRequest(BaseModel):
    value: dict


class ActivityLogResponse(BaseModel):
    id: str
    user_id: str | None = None
    action: str
    entity_type: str | None = None
    entity_id: str | None = None
    details: dict | None = None
    ip_address: str | None = None
    created_at: str

    class Config:
        from_attributes = True
