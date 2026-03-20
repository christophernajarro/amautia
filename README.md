# Amautia

Plataforma educativa SaaS con corrección de exámenes por IA.

## Stack

- **Backend**: FastAPI + SQLAlchemy 2.0 + PostgreSQL
- **Frontend**: Next.js 15 + React 19 + shadcn/ui + TanStack Query
- **IA**: Multi-proveedor (OpenAI, Gemini, Anthropic) con fallback mock

## Inicio rápido

### Requisitos
- Python 3.12+
- Node.js 20+
- PostgreSQL 16+
- Docker (opcional)

### Con Docker

```bash
# Desarrollo
docker compose up -d
cd backend && pip install -r requirements.txt && python -m app.seed && uvicorn app.main:app --reload
cd frontend && npm install && npm run dev
```

### Producción

```bash
# Copia y configura variables de entorno
cp .env.prod.example .env.prod

# Levanta con docker-compose
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Ejecuta migraciones
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## Variables de entorno

### Backend (requeridas)
| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de PostgreSQL |
| `SECRET_KEY` | Clave secreta JWT (genera con `openssl rand -base64 32`) |
| `CORS_ORIGINS` | JSON array de orígenes permitidos |

### Backend (opcionales)
| Variable | Descripción |
|----------|-------------|
| `OPENAI_API_KEY` | Clave de OpenAI para corrección IA |
| `GOOGLE_API_KEY` | Clave de Google Gemini |
| `ANTHROPIC_API_KEY` | Clave de Anthropic Claude |
| `SMTP_HOST` | Host SMTP para emails |
| `SMTP_PORT` | Puerto SMTP (default: 587) |
| `SMTP_USER` | Usuario SMTP |
| `SMTP_PASS` | Contraseña SMTP |

### Frontend
| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL del backend API |

## API Docs

Con el backend corriendo: http://localhost:8000/api/v1/docs

## Tests

```bash
# Backend
cd backend && python -m pytest tests/ -v

# Frontend
cd frontend && npx playwright test
```

## Estructura

```
amautia/
├── backend/          # FastAPI API
│   ├── app/
│   │   ├── api/v1/   # 87 endpoints
│   │   ├── models/   # 18 SQLAlchemy models
│   │   ├── schemas/  # Pydantic validation
│   │   ├── services/ # Business logic + AI
│   │   └── ai/       # AI prompts
│   ├── alembic/      # Database migrations
│   └── tests/
├── frontend/         # Next.js SPA
│   ├── src/app/      # 30 pages
│   ├── src/components/
│   └── src/lib/      # API hooks, auth
└── docker-compose.yml
```
