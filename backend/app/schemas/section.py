from pydantic import BaseModel

class SectionCreate(BaseModel):
    name: str
    academic_period: str | None = None

class SectionUpdate(BaseModel):
    name: str | None = None
    academic_period: str | None = None
    is_active: bool | None = None

class SectionResponse(BaseModel):
    id: str
    name: str
    subject_id: str
    class_code: str
    academic_period: str | None
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True
