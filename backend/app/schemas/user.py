from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: str
    phone: str | None = None

class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    is_active: bool | None = None
    role: str | None = None

class UserListResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: str

    class Config:
        from_attributes = True
