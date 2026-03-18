from pydantic import BaseModel, field_validator


# =============================================================================
# Gamification
# =============================================================================

class GamificationProfileResponse(BaseModel):
    total_points: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    level: int = 1
    xp: int = 0
    last_activity_date: str | None = None

    class Config:
        from_attributes = True


class BadgeResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    icon: str | None = None
    category: str | None = None
    earned_at: str | None = None  # Only when showing user's badges

    class Config:
        from_attributes = True


class LeaderboardEntryResponse(BaseModel):
    rank: int
    user_id: str
    user_name: str
    points: int
    level: int = 1
    avatar_url: str | None = None


class PointTransactionResponse(BaseModel):
    id: str
    points: int
    action: str
    description: str | None = None
    created_at: str

    class Config:
        from_attributes = True


# =============================================================================
# Live Quiz
# =============================================================================

class LiveQuizCreateRequest(BaseModel):
    title: str
    section_id: str
    exam_id: str | None = None
    mode: str = "individual"
    time_per_question: int | None = 30
    show_leaderboard: bool = True

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("El titulo es requerido")
        return v.strip()


class LiveQuizResponse(BaseModel):
    id: str
    title: str
    status: str
    mode: str
    pin_code: str
    section_id: str
    current_question_index: int = 0
    participant_count: int = 0
    started_at: str | None = None
    created_at: str

    class Config:
        from_attributes = True


class LiveQuizJoinRequest(BaseModel):
    pin_code: str
    team_name: str | None = None


class LiveQuizAnswerRequest(BaseModel):
    question_index: int
    answer: str


class LiveQuizParticipantResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    team_name: str | None = None
    score: int = 0
    correct_answers: int = 0
    total_answers: int = 0

    class Config:
        from_attributes = True


class LiveQuizLeaderboardResponse(BaseModel):
    participants: list[LiveQuizParticipantResponse] = []
    current_question: int = 0
    total_questions: int = 0
    status: str = "waiting"


# =============================================================================
# Plagiarism Detection
# =============================================================================

class PlagiarismCheckResponse(BaseModel):
    id: str
    exam_id: str
    student_exam_id: str | None = None
    status: str
    similarity_score: float | None = None
    ai_generated_score: float | None = None
    matches: list[dict] = []
    created_at: str

    class Config:
        from_attributes = True


class PlagiarismRunRequest(BaseModel):
    exam_id: str


# =============================================================================
# Parent Portal
# =============================================================================

class ParentLinkRequest(BaseModel):
    student_email: str
    relationship: str = "padre"

    @field_validator("relationship")
    @classmethod
    def valid_relationship(cls, v: str) -> str:
        valid = ["padre", "madre", "tutor_legal", "otro"]
        if v not in valid:
            raise ValueError(f"Relacion debe ser: {', '.join(valid)}")
        return v


class ParentLinkResponse(BaseModel):
    id: str
    student_id: str
    student_name: str
    student_email: str
    relationship: str
    status: str
    created_at: str

    class Config:
        from_attributes = True


class ParentDashboardResponse(BaseModel):
    children: list[dict] = []
    # Each child: {student_id, name, average_score, recent_exams, subjects}


class ParentChildProgressResponse(BaseModel):
    student_id: str
    student_name: str
    subjects: list[dict] = []
    recent_exams: list[dict] = []
    average_score: float | None = None
    attendance_rate: float | None = None


# =============================================================================
# Question Bank
# =============================================================================

class QuestionBankCreateRequest(BaseModel):
    name: str
    description: str | None = None
    subject_id: str | None = None
    is_public: bool = False
    tags: list[str] = []

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("El nombre del banco es requerido")
        return v.strip()


class QuestionBankResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    subject_id: str | None = None
    is_public: bool = False
    tags: list[str] = []
    total_questions: int = 0
    created_at: str

    class Config:
        from_attributes = True


class QuestionBankItemCreateRequest(BaseModel):
    question_text: str
    question_type: str
    correct_answer: str | None = None
    options: dict | None = None
    points: float = 1.0
    difficulty: str = "medium"
    tags: list[str] = []
    explanation: str | None = None


class QuestionBankItemResponse(BaseModel):
    id: str
    question_text: str
    question_type: str
    correct_answer: str | None = None
    options: dict | None = None
    points: float = 1.0
    difficulty: str = "medium"
    tags: list[str] = []
    explanation: str | None = None
    times_used: int = 0
    created_at: str

    class Config:
        from_attributes = True


class GenerateFromBankRequest(BaseModel):
    bank_id: str
    num_questions: int = 10
    difficulty: str | None = None
    question_types: list[str] | None = None
    randomize: bool = True


# =============================================================================
# Messaging / Communication
# =============================================================================

class ConversationCreateRequest(BaseModel):
    type: str = "direct"
    title: str | None = None
    member_ids: list[str] = []


class ConversationResponse(BaseModel):
    id: str
    type: str
    title: str | None = None
    last_message: str | None = None
    last_message_at: str | None = None
    unread_count: int = 0
    members: list[dict] = []
    created_at: str

    class Config:
        from_attributes = True


class MessageCreateRequest(BaseModel):
    content: str
    message_type: str = "text"

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("El mensaje no puede estar vacio")
        return v.strip()


class MessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    content: str
    message_type: str = "text"
    file_url: str | None = None
    is_edited: bool = False
    created_at: str

    class Config:
        from_attributes = True


class AnnouncementCreateRequest(BaseModel):
    section_id: str
    title: str
    content: str
    is_pinned: bool = False


class AnnouncementResponse(BaseModel):
    id: str
    profesor_id: str
    profesor_name: str
    section_id: str
    title: str
    content: str
    is_pinned: bool
    created_at: str

    class Config:
        from_attributes = True


class ForumCreateRequest(BaseModel):
    section_id: str
    title: str
    description: str | None = None


class ForumResponse(BaseModel):
    id: str
    section_id: str
    title: str
    description: str | None = None
    is_locked: bool
    post_count: int = 0
    created_at: str

    class Config:
        from_attributes = True


class ForumPostCreateRequest(BaseModel):
    content: str
    parent_id: str | None = None


class ForumPostResponse(BaseModel):
    id: str
    author_id: str
    author_name: str
    content: str
    parent_id: str | None = None
    is_pinned: bool
    upvotes: int = 0
    replies: list["ForumPostResponse"] = []
    created_at: str

    class Config:
        from_attributes = True


# =============================================================================
# Flashcards
# =============================================================================

class FlashcardSetCreateRequest(BaseModel):
    title: str
    description: str | None = None
    subject_id: str | None = None
    is_public: bool = False
    cards: list[dict] = []  # [{front, back}]


class FlashcardSetResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    subject_id: str | None = None
    is_public: bool
    total_cards: int = 0
    mastery_percentage: float = 0
    created_at: str

    class Config:
        from_attributes = True


class FlashcardResponse(BaseModel):
    id: str
    front: str
    back: str
    has_image: bool = False
    image_url: str | None = None
    order_index: int = 0
    # SRS fields for the current user
    ease_factor: float = 2.5
    interval_days: int = 1
    next_review: str | None = None

    class Config:
        from_attributes = True


class FlashcardReviewRequest(BaseModel):
    quality: int  # 0-5 (SM-2 algorithm)

    @field_validator("quality")
    @classmethod
    def valid_quality(cls, v: int) -> int:
        if v < 0 or v > 5:
            raise ValueError("Calidad debe ser entre 0 y 5")
        return v


class GenerateFlashcardsRequest(BaseModel):
    subject: str
    topic: str
    num_cards: int = 10
    difficulty: str = "medium"


# =============================================================================
# Gradebook
# =============================================================================

class GradingPeriodCreateRequest(BaseModel):
    section_id: str
    name: str
    weight: float = 1.0
    start_date: str | None = None
    end_date: str | None = None


class GradingPeriodResponse(BaseModel):
    id: str
    section_id: str
    name: str
    weight: float
    start_date: str | None = None
    end_date: str | None = None
    is_active: bool
    order_index: int
    created_at: str

    class Config:
        from_attributes = True


class GradebookEntryCreateRequest(BaseModel):
    student_id: str
    section_id: str
    grading_period_id: str | None = None
    category: str = "exam"
    title: str
    score: float
    max_score: float = 20
    weight: float = 1.0
    notes: str | None = None


class GradebookEntryResponse(BaseModel):
    id: str
    student_id: str
    student_name: str
    section_id: str
    grading_period_id: str | None = None
    category: str
    title: str
    score: float
    max_score: float
    weight: float
    percentage: float = 0
    notes: str | None = None
    created_at: str

    class Config:
        from_attributes = True


class GradebookStudentSummary(BaseModel):
    student_id: str
    student_name: str
    entries: list[GradebookEntryResponse] = []
    weighted_average: float = 0
    final_grade: float = 0
    passing: bool = False


class GradebookConfigRequest(BaseModel):
    grading_scale: str = "0-20"
    passing_score: float = 10.5
    categories_weights: dict | None = None
    round_to: int = 1


class GradebookConfigResponse(BaseModel):
    id: str
    section_id: str
    grading_scale: str
    passing_score: float
    categories_weights: dict | None = None
    round_to: int

    class Config:
        from_attributes = True


# =============================================================================
# Peer Review
# =============================================================================

class PeerReviewAssignmentCreateRequest(BaseModel):
    exam_id: str
    reviews_per_student: int = 2
    is_anonymous: bool = True
    deadline: str | None = None


class PeerReviewAssignmentResponse(BaseModel):
    id: str
    exam_id: str
    status: str
    reviews_per_student: int
    is_anonymous: bool
    deadline: str | None = None
    total_reviews: int = 0
    completed_reviews: int = 0
    created_at: str

    class Config:
        from_attributes = True


class PeerReviewSubmitRequest(BaseModel):
    score: float
    feedback: str
    rubric_scores: dict | None = None


class PeerReviewResponse(BaseModel):
    id: str
    reviewer_name: str | None = None  # None if anonymous
    reviewee_name: str
    score: float | None = None
    feedback: str | None = None
    status: str
    submitted_at: str | None = None
    created_at: str

    class Config:
        from_attributes = True


# =============================================================================
# Certificates
# =============================================================================

class CertificateTemplateCreateRequest(BaseModel):
    name: str
    description: str | None = None
    html_template: str
    css_styles: str | None = None
    variables: list[str] = []


class CertificateTemplateResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    variables: list[str] = []
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True


class CertificateIssueRequest(BaseModel):
    template_id: str
    user_id: str
    title: str
    data: dict = {}


class CertificateResponse(BaseModel):
    id: str
    title: str
    user_id: str
    user_name: str
    template_name: str
    verification_code: str
    pdf_url: str | None = None
    issued_at: str

    class Config:
        from_attributes = True


class CertificateVerifyResponse(BaseModel):
    valid: bool
    certificate: CertificateResponse | None = None


# =============================================================================
# LTI Integration
# =============================================================================

class LTIRegistrationCreateRequest(BaseModel):
    name: str
    client_id: str
    platform_url: str
    auth_url: str
    token_url: str
    jwks_url: str
    deployment_id: str | None = None


class LTIRegistrationResponse(BaseModel):
    id: str
    name: str
    client_id: str
    platform_url: str
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True


# =============================================================================
# Analytics (Psychometric)
# =============================================================================

class QuestionAnalyticsResponse(BaseModel):
    question_id: str
    question_text: str
    difficulty_index: float = 0  # percentage who answered correctly
    discrimination_index: float = 0  # how well it discriminates
    average_score: float = 0
    total_attempts: int = 0
    option_distribution: dict | None = None  # For multiple-choice questions


class ExamAnalyticsResponse(BaseModel):
    exam_id: str
    exam_title: str
    total_students: int = 0
    average_score: float = 0
    median_score: float = 0
    std_deviation: float = 0
    pass_rate: float = 0
    score_distribution: list[dict] = []
    question_analytics: list[QuestionAnalyticsResponse] = []
    at_risk_students: list[dict] = []


class StudentRiskResponse(BaseModel):
    student_id: str
    student_name: str
    risk_level: str  # low, medium, high
    average_score: float
    trend: str  # improving, declining, stable
    factors: list[str] = []


# =============================================================================
# Multi-language
# =============================================================================

class LanguageUpdateRequest(BaseModel):
    language: str = "es"

    @field_validator("language")
    @classmethod
    def valid_language(cls, v: str) -> str:
        valid = ["es", "en", "pt", "fr"]
        if v not in valid:
            raise ValueError(f"Idioma debe ser: {', '.join(valid)}")
        return v


# Rebuild ForumPostResponse to resolve self-referential type
ForumPostResponse.model_rebuild()
