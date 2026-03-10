from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: str = "profesor"
    phone: str | None = None
    class_code: str | None = None  # For students joining a class

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
