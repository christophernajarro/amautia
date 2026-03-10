from pydantic import BaseModel, EmailStr, field_validator

class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: str = "profesor"
    phone: str | None = None
    class_code: str | None = None  # For students joining a class

    @field_validator("password")
    @classmethod
    def password_not_empty(cls, v: str) -> str:
        if not v or len(v.strip()) < 6:
            raise ValueError("La contraseña debe tener al menos 6 caracteres")
        return v

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: str) -> str:
        if not v or "@" not in v:
            raise ValueError("Email inválido")
        return v.strip().lower()

    @field_validator("first_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("El nombre es requerido")
        return v.strip()

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    phone: str | None
    avatar_url: str | None
    is_active: bool
    is_verified: bool
    created_at: str

    class Config:
        from_attributes = True
