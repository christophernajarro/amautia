# Amautia - Estructura de Archivos

## Frontend (Next.js 15)

```
frontend/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local.example
├── middleware.ts                    # Auth middleware
│
├── public/
│   ├── logo.svg
│   ├── favicon.ico
│   └── images/
│       ├── hero.webp
│       └── features/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css
│   │   │
│   │   ├── (public)/
│   │   │   ├── layout.tsx           # Public layout (navbar simple)
│   │   │   ├── page.tsx             # Landing page
│   │   │   ├── precios/page.tsx
│   │   │   ├── terminos/page.tsx
│   │   │   └── privacidad/page.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── layout.tsx           # Auth layout (centrado)
│   │   │   ├── login/page.tsx
│   │   │   ├── registro/page.tsx
│   │   │   ├── recuperar/page.tsx
│   │   │   └── reset/page.tsx
│   │   │
│   │   └── (dashboard)/
│   │       ├── layout.tsx           # Dashboard layout (sidebar + navbar)
│   │       │
│   │       ├── admin/
│   │       │   ├── page.tsx
│   │       │   ├── usuarios/
│   │       │   │   ├── page.tsx
│   │       │   │   └── [id]/page.tsx
│   │       │   ├── pagos/page.tsx
│   │       │   ├── planes/page.tsx
│   │       │   ├── ia/page.tsx
│   │       │   ├── config/page.tsx
│   │       │   └── logs/page.tsx
│   │       │
│   │       ├── profesor/
│   │       │   ├── page.tsx
│   │       │   ├── materias/
│   │       │   │   ├── page.tsx
│   │       │   │   └── [id]/
│   │       │   │       ├── page.tsx
│   │       │   │       └── secciones/[sid]/page.tsx
│   │       │   ├── alumnos/page.tsx
│   │       │   ├── examenes/
│   │       │   │   ├── page.tsx
│   │       │   │   ├── nuevo/page.tsx
│   │       │   │   └── [id]/
│   │       │   │       ├── page.tsx
│   │       │   │       ├── corregir/page.tsx
│   │       │   │       ├── resultados/page.tsx
│   │       │   │       └── alumno/[sid]/page.tsx
│   │       │   ├── generar/
│   │       │   │   ├── page.tsx
│   │       │   │   └── [id]/page.tsx
│   │       │   └── estadisticas/page.tsx
│   │       │
│   │       ├── alumno/
│   │       │   ├── page.tsx
│   │       │   ├── materias/page.tsx
│   │       │   ├── examenes/
│   │       │   │   ├── page.tsx
│   │       │   │   └── [id]/page.tsx
│   │       │   ├── tutor/
│   │       │   │   ├── page.tsx
│   │       │   │   ├── chat/[id]/page.tsx
│   │       │   │   ├── plan/page.tsx
│   │       │   │   └── ejercicios/page.tsx
│   │       │   ├── progreso/page.tsx
│   │       │   └── unirse/page.tsx
│   │       │
│   │       ├── perfil/page.tsx
│   │       ├── suscripcion/page.tsx
│   │       └── notificaciones/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── navbar.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   └── footer.tsx
│   │   │
│   │   ├── landing/
│   │   │   ├── hero.tsx
│   │   │   ├── features.tsx
│   │   │   ├── how-it-works.tsx
│   │   │   ├── pricing.tsx
│   │   │   ├── testimonials.tsx
│   │   │   └── cta.tsx
│   │   │
│   │   ├── exams/
│   │   │   ├── exam-upload.tsx
│   │   │   ├── exam-preview.tsx
│   │   │   ├── question-editor.tsx
│   │   │   ├── rubric-editor.tsx
│   │   │   ├── correction-progress.tsx
│   │   │   ├── results-table.tsx
│   │   │   ├── student-correction-detail.tsx
│   │   │   └── batch-upload.tsx
│   │   │
│   │   ├── generate/
│   │   │   ├── source-upload.tsx
│   │   │   ├── generation-config.tsx
│   │   │   ├── generated-exam-editor.tsx
│   │   │   └── export-options.tsx
│   │   │
│   │   ├── tutor/
│   │   │   ├── chat-interface.tsx
│   │   │   ├── study-plan-view.tsx
│   │   │   ├── exercise-card.tsx
│   │   │   └── progress-chart.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── stats-cards.tsx
│   │   │   ├── user-table.tsx
│   │   │   ├── payment-review.tsx
│   │   │   ├── ai-provider-card.tsx
│   │   │   └── plan-editor.tsx
│   │   │
│   │   └── shared/
│   │       ├── file-upload.tsx
│   │       ├── data-table.tsx
│   │       ├── stats-card.tsx
│   │       ├── notification-bell.tsx
│   │       ├── empty-state.tsx
│   │       ├── loading-skeleton.tsx
│   │       └── confirm-dialog.tsx
│   │
│   ├── lib/
│   │   ├── api.ts                   # API client (fetch wrapper)
│   │   ├── auth.ts                  # Auth utilities
│   │   ├── utils.ts                 # Utilidades generales
│   │   └── constants.ts             # Constantes
│   │
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-websocket.ts
│   │   ├── use-notifications.ts
│   │   └── use-upload.ts
│   │
│   ├── stores/                      # Zustand stores
│   │   ├── auth-store.ts
│   │   └── notification-store.ts
│   │
│   └── types/
│       ├── user.ts
│       ├── exam.ts
│       ├── subject.ts
│       ├── payment.ts
│       ├── tutor.ts
│       └── api.ts
│
└── Dockerfile
```

## Backend (FastAPI)

```
backend/
├── pyproject.toml                   # Dependencies (uv/poetry)
├── alembic.ini
├── Dockerfile
├── .env.example
│
├── alembic/
│   ├── env.py
│   └── versions/
│
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI app entry
│   ├── config.py                    # Settings (pydantic-settings)
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── database.py              # SQLAlchemy engine + session
│   │   ├── security.py              # JWT, password hashing
│   │   ├── dependencies.py          # Dependency injection
│   │   └── exceptions.py            # Custom exceptions
│   │
│   ├── models/                      # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── organization.py
│   │   ├── subject.py
│   │   ├── section.py
│   │   ├── exam.py
│   │   ├── student_exam.py
│   │   ├── plan.py
│   │   ├── subscription.py
│   │   ├── payment.py
│   │   ├── ai_provider.py
│   │   ├── notification.py
│   │   ├── generated_exam.py
│   │   ├── tutor.py
│   │   └── system_config.py
│   │
│   ├── schemas/                     # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── subject.py
│   │   ├── section.py
│   │   ├── exam.py
│   │   ├── correction.py
│   │   ├── generation.py
│   │   ├── payment.py
│   │   ├── tutor.py
│   │   ├── notification.py
│   │   └── admin.py
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py                  # Route dependencies
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py            # Main router (includes all)
│   │       ├── auth.py
│   │       ├── admin/
│   │       │   ├── __init__.py
│   │       │   ├── dashboard.py
│   │       │   ├── users.py
│   │       │   ├── payments.py
│   │       │   ├── plans.py
│   │       │   ├── ai_config.py
│   │       │   └── system.py
│   │       ├── profesor/
│   │       │   ├── __init__.py
│   │       │   ├── dashboard.py
│   │       │   ├── subjects.py
│   │       │   ├── sections.py
│   │       │   ├── students.py
│   │       │   ├── exams.py
│   │       │   ├── correction.py
│   │       │   └── generation.py
│   │       ├── alumno/
│   │       │   ├── __init__.py
│   │       │   ├── dashboard.py
│   │       │   ├── exams.py
│   │       │   ├── tutor.py
│   │       │   └── progress.py
│   │       ├── payments.py
│   │       ├── notifications.py
│   │       └── upload.py
│   │
│   ├── services/                    # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── exam_service.py
│   │   ├── correction_service.py    # Motor de corrección
│   │   ├── generation_service.py    # Motor de generación
│   │   ├── tutor_service.py         # Servicio del tutor
│   │   ├── payment_service.py
│   │   ├── notification_service.py
│   │   ├── subscription_service.py
│   │   ├── upload_service.py        # MinIO upload
│   │   └── export_service.py        # PDF/Excel export
│   │
│   ├── ai/                          # Integración con IA
│   │   ├── __init__.py
│   │   ├── base.py                  # Interfaz base AIProvider
│   │   ├── factory.py               # Factory para crear provider
│   │   ├── gemini.py                # Google Gemini
│   │   ├── openai_provider.py       # OpenAI
│   │   ├── claude.py                # Anthropic Claude
│   │   └── prompts/
│   │       ├── __init__.py
│   │       ├── correction.py        # Prompts de corrección
│   │       ├── generation.py        # Prompts de generación
│   │       ├── tutor.py             # Prompts del tutor
│   │       └── extraction.py        # Prompts de extracción OCR
│   │
│   ├── tasks/                       # Celery tasks
│   │   ├── __init__.py
│   │   ├── celery_app.py
│   │   ├── correction_tasks.py      # Tareas de corrección masiva
│   │   ├── generation_tasks.py      # Tareas de generación
│   │   ├── notification_tasks.py    # Envío de notificaciones
│   │   └── export_tasks.py          # Generación de PDFs
│   │
│   ├── websocket/                   # WebSocket handlers
│   │   ├── __init__.py
│   │   ├── manager.py
│   │   ├── notifications.py
│   │   └── correction_progress.py
│   │
│   └── utils/
│       ├── __init__.py
│       ├── qr_generator.py          # Generar QR de pago
│       ├── file_processor.py        # Procesar PDF/Word/imagen
│       └── email.py                 # Envío de emails
│
└── tests/
    ├── conftest.py
    ├── test_auth.py
    ├── test_exams.py
    ├── test_correction.py
    └── test_generation.py
```

## Docker

```
amautia/
├── docker-compose.yml
├── docker-compose.prod.yml
├── nginx/
│   └── nginx.conf
├── .env.example
├── frontend/
│   └── Dockerfile
├── backend/
│   └── Dockerfile
└── .planning/
    ├── PROJECT.md
    ├── ROADMAP.md
    ├── DATABASE.md
    ├── API.md
    ├── UI-FLOWS.md
    └── STRUCTURE.md
```

## docker-compose.yml (dev)
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: amautia
      POSTGRES_USER: amautia
      POSTGRES_PASSWORD: amautia_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: amautia
      MINIO_ROOT_PASSWORD: amautia_dev
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  backend:
    build: ./backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    environment:
      DATABASE_URL: postgresql+asyncpg://amautia:amautia_dev@db:5432/amautia
      REDIS_URL: redis://redis:6379/0
      MINIO_ENDPOINT: minio:9000
      MINIO_ACCESS_KEY: amautia
      MINIO_SECRET_KEY: amautia_dev
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    depends_on:
      - db
      - redis
      - minio

  celery:
    build: ./backend
    command: celery -A app.tasks.celery_app worker --loglevel=info
    environment:
      DATABASE_URL: postgresql+asyncpg://amautia:amautia_dev@db:5432/amautia
      REDIS_URL: redis://redis:6379/0
      MINIO_ENDPOINT: minio:9000
    volumes:
      - ./backend:/app
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    command: npm run dev
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000/api/v1
      NEXT_PUBLIC_WS_URL: ws://localhost:8000
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
  minio_data:
```
