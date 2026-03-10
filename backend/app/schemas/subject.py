from pydantic import BaseModel

class SubjectCreate(BaseModel):
    name: str
    description: str | None = None
    color: str = "#3B82F6"
    icon: str | None = None

class SubjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None
    icon: str | None = None

class SubjectResponse(BaseModel):
    id: str
    name: str
    description: str | None
    color: str
    icon: str | None
    profesor_id: str
    created_at: str

    class Config:
        from_attributes = True
