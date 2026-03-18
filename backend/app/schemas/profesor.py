from pydantic import BaseModel, field_validator


class SubjectResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    color: str
    icon: str | None = None
    profesor_id: str
    sections_count: int = 0
    students_count: int = 0
    created_at: str

    class Config:
        from_attributes = True


class SubjectCreateRequest(BaseModel):
    name: str
    description: str | None = None
    color: str = "#3B82F6"
    icon: str | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("El nombre de la materia es requerido")
        return v.strip()


class SubjectUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None
    icon: str | None = None


class SectionResponse(BaseModel):
    id: str
    name: str
    subject_id: str
    class_code: str
    academic_period: str | None = None
    is_active: bool
    students_count: int = 0
    created_at: str

    class Config:
        from_attributes = True


class SectionCreateRequest(BaseModel):
    name: str
    academic_period: str | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("El nombre de la sección es requerido")
        return v.strip()


class SectionUpdateRequest(BaseModel):
    name: str | None = None
    academic_period: str | None = None
    is_active: bool | None = None


class StudentResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    phone: str | None = None
    joined_at: str

    class Config:
        from_attributes = True


class AddStudentRequest(BaseModel):
    email: str
    first_name: str
    last_name: str
    password: str | None = None


class ExamResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    section_id: str
    profesor_id: str
    total_points: float
    grading_scale: str
    status: str
    created_at: str

    class Config:
        from_attributes = True


class ExamCreateRequest(BaseModel):
    title: str
    description: str | None = None
    section_id: str
    total_points: float = 20
    grading_scale: str = "0-20"

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v or len(v.strip()) < 3:
            raise ValueError("El título del examen debe tener al menos 3 caracteres")
        return v.strip()


class ScoreRange(BaseModel):
    range: str
    count: int


class ProfesorDashboard(BaseModel):
    total_subjects: int
    total_sections: int
    total_students: int
    total_exams: int
    recent_exams: list[ExamResponse] = []
    average_score: float = 0
    pass_rate: float = 0
    score_distribution: list[ScoreRange] = []
