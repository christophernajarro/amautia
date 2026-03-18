from pydantic import BaseModel


class JoinSectionRequest(BaseModel):
    class_code: str


class RecentExamItem(BaseModel):
    id: str
    title: str
    date: str
    score: float | None = None
    status: str


class AlumnoDashboard(BaseModel):
    total_sections: int
    total_subjects: int = 0
    total_exams: int
    average_score: float | None = None
    exercises_completed: int = 0
    accuracy: float = 0
    active_plans: int = 0
    recent_exams: list[RecentExamItem] = []


class AlumnoSectionResponse(BaseModel):
    id: str
    name: str
    subject_id: str
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
