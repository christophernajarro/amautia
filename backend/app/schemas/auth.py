from pydantic import BaseModel, EmailStr, field_validator

class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: str = "profesor"
    phone: str | None = None
    class_code: str | None = None  # For students joining a class

    @field_validator("role")
    @classmethod
    def role_valid(cls, v: str) -> str:
        valid_roles = ["profesor", "alumno", "padre"]
        if v not in valid_roles:
            raise ValueError(f"Rol debe ser: {', '.join(valid_roles)}")
        return v

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

    @field_validator("last_name")
    @classmethod
    def last_name_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("El apellido es requerido")
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
    theme: str = "system"
    created_at: str

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    theme: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: str) -> str:
        if not v or "@" not in v:
            raise ValueError("Email invalido")
        return v.strip().lower()


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
