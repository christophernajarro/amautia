from pydantic import BaseModel


class JoinSectionRequest(BaseModel):
    class_code: str


class AlumnoDashboard(BaseModel):
    total_sections: int
    total_exams: int
    average_score: float | None = None
    recent_exams: list = []


class AlumnoSectionResponse(BaseModel):
    id: str
    name: str
    subject_name: str
    subject_color: str
    class_code: str
    profesor_name: str
    joined_at: str

    class Config:
        from_attributes = True


class AlumnoExamResponse(BaseModel):
    id: str
    exam_title: str
    subject_name: str
    total_score: float | None = None
    percentage: float | None = None
    status: str
    corrected_at: str | None = None

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str | None = None
    is_read: bool
    created_at: str

    class Config:
        from_attributes = True
