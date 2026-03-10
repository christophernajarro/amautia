# Amautia - Esquema de Base de Datos

## Diagrama de Relaciones

```
User ──< OrganizationMember >── Organization
User ──< Subject (profesor)
User ──< SectionStudent >── Section
Subject ──< Section
Section ──< Exam
Exam ──< ExamQuestion
Exam ──< StudentExam
StudentExam ──< StudentAnswer
ExamQuestion ──< StudentAnswer
ExamQuestion ──< RubricCriteria
User ──< Subscription
User ──< Payment
User ──< Notification
User ──< TutorChat ──< TutorMessage
User ──< StudyPlan ──< StudyPlanTopic
AIProvider ──< AIModel
Plan ──< Subscription
GeneratedExam ──< GeneratedQuestion
```

## Tablas

### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'profesor', 'alumno')),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### organizations
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('academia', 'universidad', 'instituto')),
    logo_url VARCHAR(500),
    owner_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### organization_members
```sql
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);
```

### subjects (materias)
```sql
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    profesor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### sections (secciones/grupos)
```sql
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    class_code VARCHAR(8) UNIQUE NOT NULL,
    academic_period VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### section_students
```sql
CREATE TABLE section_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(section_id, student_id)
);
```

### exams
```sql
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(300) NOT NULL,
    description TEXT,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    profesor_id UUID REFERENCES users(id),

    -- Archivo de referencia
    reference_file_url VARCHAR(500),
    reference_file_type VARCHAR(20), -- 'solved_exam', 'empty_exam'
    answers_file_url VARCHAR(500),   -- Si sube respuestas aparte
    answers_text TEXT,               -- Si escribe respuestas en texto

    -- Configuración
    total_points DECIMAL(6,2) DEFAULT 20,
    grading_scale VARCHAR(20) DEFAULT '0-20', -- '0-20', '0-100', 'letters'
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'processing', 'corrected', 'published'

    -- IA
    ai_provider VARCHAR(50),
    ai_model VARCHAR(100),

    -- Metadata extraída por IA
    extracted_content JSONB,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### exam_questions
```sql
CREATE TABLE exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT,
    question_type VARCHAR(30) NOT NULL, -- 'multiple_choice', 'development', 'true_false', 'fill_blank', 'math', 'drawing'
    correct_answer TEXT,
    points DECIMAL(5,2) NOT NULL,
    has_image BOOLEAN DEFAULT false,
    image_url VARCHAR(500),
    options JSONB, -- Para opción múltiple: [{"key": "a", "text": "...", "is_correct": true}]
    order_index INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### rubric_criteria
```sql
CREATE TABLE rubric_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES exam_questions(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    max_points DECIMAL(5,2) NOT NULL,
    levels JSONB, -- [{"label": "Excelente", "points": 5, "description": "..."}, ...]
    created_at TIMESTAMP DEFAULT NOW()
);
```

### student_exams
```sql
CREATE TABLE student_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id),

    -- Archivo subido
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(20), -- 'pdf', 'image', 'word'

    -- Resultados
    total_score DECIMAL(6,2),
    percentage DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'corrected', 'reviewed'

    -- Feedback general de la IA
    general_feedback TEXT,
    strengths TEXT,
    areas_to_improve TEXT,

    -- Contenido extraído
    extracted_content JSONB,

    -- Revisión del profesor
    profesor_reviewed BOOLEAN DEFAULT false,
    profesor_notes TEXT,
    adjusted_score DECIMAL(6,2),

    corrected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### student_answers
```sql
CREATE TABLE student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_exam_id UUID REFERENCES student_exams(id) ON DELETE CASCADE,
    question_id UUID REFERENCES exam_questions(id),

    -- Respuesta del alumno
    answer_text TEXT,
    answer_image_url VARCHAR(500),

    -- Corrección IA
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    is_correct BOOLEAN,
    feedback TEXT,
    suggestion TEXT,

    -- Detalle de rúbrica
    rubric_scores JSONB, -- [{"criteria_id": "...", "score": 3, "comment": "..."}]

    created_at TIMESTAMP DEFAULT NOW()
);
```

### plans
```sql
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(8,2) NOT NULL, -- en soles

    -- Límites
    max_corrections_month INTEGER, -- NULL = ilimitado
    max_generations_month INTEGER,
    max_students INTEGER,
    max_subjects INTEGER,
    has_tutor BOOLEAN DEFAULT false,
    tutor_level VARCHAR(20), -- 'none', 'basic', 'full'
    has_whatsapp_notifications BOOLEAN DEFAULT false,
    has_export BOOLEAN DEFAULT true,
    has_rubrics BOOLEAN DEFAULT false,
    has_analytics BOOLEAN DEFAULT false,
    is_academy BOOLEAN DEFAULT false,
    max_professors INTEGER DEFAULT 1,

    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### subscriptions
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id),

    status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'cancelled', 'grace_period'
    starts_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,

    -- Uso actual del período
    corrections_used INTEGER DEFAULT 0,
    generations_used INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### payments
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id),
    subscription_id UUID REFERENCES subscriptions(id),

    amount DECIMAL(8,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PEN',
    method VARCHAR(20) DEFAULT 'yape', -- 'yape', 'plin', 'transferencia'

    -- Comprobante
    receipt_url VARCHAR(500),
    reference_code VARCHAR(100),

    -- Estado
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);
```

### ai_providers
```sql
CREATE TABLE ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- 'Google Gemini', 'OpenAI', 'Anthropic Claude'
    slug VARCHAR(50) UNIQUE NOT NULL,
    api_key_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    config JSONB, -- configuraciones adicionales
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### ai_models
```sql
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES ai_providers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    model_id VARCHAR(100) NOT NULL, -- 'gemini-2.5-flash', 'gpt-4o', 'claude-sonnet-4-6'

    -- Capacidades
    supports_vision BOOLEAN DEFAULT false,
    supports_text BOOLEAN DEFAULT true,
    supports_image_generation BOOLEAN DEFAULT false,
    max_tokens INTEGER,

    -- Asignación por tarea
    is_default_correction BOOLEAN DEFAULT false,
    is_default_generation BOOLEAN DEFAULT false,
    is_default_tutor BOOLEAN DEFAULT false,
    is_default_vision BOOLEAN DEFAULT false,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### notifications
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    type VARCHAR(50) NOT NULL, -- 'exam_corrected', 'payment_approved', 'payment_rejected', 'new_exam', 'welcome', etc.
    title VARCHAR(300) NOT NULL,
    message TEXT,
    data JSONB, -- datos adicionales (exam_id, payment_id, etc.)

    channel VARCHAR(20) DEFAULT 'in_app', -- 'in_app', 'email', 'whatsapp'
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    sent_at TIMESTAMP DEFAULT NOW(),

    created_at TIMESTAMP DEFAULT NOW()
);
```

### generated_exams
```sql
CREATE TABLE generated_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profesor_id UUID REFERENCES users(id),
    subject_id UUID REFERENCES subjects(id),

    title VARCHAR(300),

    -- Fuente
    source_type VARCHAR(30), -- 'exam', 'text', 'document', 'mixed'
    source_files JSONB, -- [{"url": "...", "type": "pdf", "name": "..."}]
    source_text TEXT,

    -- Configuración
    difficulty VARCHAR(20), -- 'easier', 'same', 'harder'
    num_questions INTEGER,
    question_types JSONB, -- ['multiple_choice', 'development', ...]
    include_images BOOLEAN DEFAULT false,
    education_level VARCHAR(50),

    -- Resultado
    generated_content JSONB,
    answer_key JSONB,

    -- Exportaciones
    pdf_url VARCHAR(500),
    pdf_with_answers_url VARCHAR(500),
    word_url VARCHAR(500),

    status VARCHAR(20) DEFAULT 'generating', -- 'generating', 'ready', 'edited', 'failed'

    ai_provider VARCHAR(50),
    ai_model VARCHAR(100),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### generated_questions
```sql
CREATE TABLE generated_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generated_exam_id UUID REFERENCES generated_exams(id) ON DELETE CASCADE,

    question_number INTEGER,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30),
    correct_answer TEXT,
    explanation TEXT,
    points DECIMAL(5,2),
    has_image BOOLEAN DEFAULT false,
    image_url VARCHAR(500),
    options JSONB,
    order_index INTEGER,

    -- Para edición manual
    is_edited BOOLEAN DEFAULT false,
    original_text TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);
```

### tutor_chats
```sql
CREATE TABLE tutor_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id),
    title VARCHAR(300),
    context JSONB, -- exámenes relevantes, debilidades, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### tutor_messages
```sql
CREATE TABLE tutor_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES tutor_chats(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL, -- 'user', 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### study_plans
```sql
CREATE TABLE study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id),

    title VARCHAR(300),
    generated_plan JSONB, -- plan estructurado
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'paused'
    progress_percentage DECIMAL(5,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### study_plan_topics
```sql
CREATE TABLE study_plan_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE,

    topic_name VARCHAR(300) NOT NULL,
    description TEXT,
    priority VARCHAR(10), -- 'high', 'medium', 'low'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'

    resources JSONB, -- recursos sugeridos
    exercises_completed INTEGER DEFAULT 0,
    exercises_total INTEGER DEFAULT 0,

    order_index INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### practice_exercises
```sql
CREATE TABLE practice_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES study_plan_topics(id),

    question_text TEXT NOT NULL,
    question_type VARCHAR(30),
    correct_answer TEXT,
    student_answer TEXT,

    is_correct BOOLEAN,
    score DECIMAL(5,2),
    feedback TEXT,

    difficulty VARCHAR(20),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### system_config
```sql
CREATE TABLE system_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);
-- Ejemplo de configs:
-- 'yape_number' -> '"999999999"'
-- 'plin_number' -> '"888888888"'
-- 'grace_period_days' -> '3'
-- 'require_registration_approval' -> 'false'
-- 'default_grading_scale' -> '"0-20"'
```

### activity_logs
```sql
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Índices Principales
```sql
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_sections_class_code ON sections(class_code);
CREATE INDEX idx_exams_section ON exams(section_id);
CREATE INDEX idx_exams_profesor ON exams(profesor_id);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_student_exams_exam ON student_exams(exam_id);
CREATE INDEX idx_student_exams_student ON student_exams(student_id);
CREATE INDEX idx_student_exams_status ON student_exams(status);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);
```

## Seeds Iniciales

### Planes
```sql
INSERT INTO plans (name, slug, price_monthly, max_corrections_month, max_generations_month, max_students, max_subjects, has_tutor, tutor_level, has_rubrics, has_analytics, has_whatsapp_notifications, is_academy, max_professors, display_order) VALUES
('Gratis', 'gratis', 0, 5, 2, 20, 2, false, 'none', false, false, false, false, 1, 1),
('Básico', 'basico', 29.00, 50, 20, 100, 5, true, 'basic', false, false, false, false, 1, 2),
('Pro', 'pro', 79.00, 300, NULL, 500, NULL, true, 'full', true, true, true, false, 1, 3),
('Enterprise', 'enterprise', 199.00, NULL, NULL, NULL, NULL, true, 'full', true, true, true, true, NULL, 4);
```

### Superadmin
```sql
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, is_verified) VALUES
('admin@amautia.com', '<bcrypt_hash>', 'Admin', 'Amautia', 'superadmin', true, true);
```
