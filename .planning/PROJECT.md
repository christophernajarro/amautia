# Amautia - Plataforma SaaS de Corrección y Generación de Exámenes con IA

## Visión
Plataforma educativa SaaS que permite a docentes corregir exámenes masivamente con IA, generar exámenes similares con niveles de dificultad ajustables, y ofrecer un módulo tutor inteligente para alumnos. Orientada al mercado peruano con soporte para pagos offline (Yape/Plin).

## Stack Técnico
- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI (Python 3.12) + SQLAlchemy 2 + Alembic
- **Base de datos**: PostgreSQL 16
- **Almacenamiento**: MinIO (S3-compatible, self-hosted) para archivos/exámenes
- **Cola de tareas**: Celery + Redis (para correcciones masivas asíncronas)
- **Auth**: JWT (access + refresh tokens) con roles
- **IA**: Multi-proveedor configurable (Gemini, OpenAI, Claude)
- **Notificaciones**: Email (SMTP/Resend), In-app (WebSocket), WhatsApp (API de Meta Business)
- **Deploy**: Docker Compose en VPS (DigitalOcean/Hetzner)
- **Idioma**: Español (sin i18n por ahora)

## Roles del Sistema

### Superadmin
- Gestión completa de usuarios (CRUD profesores, alumnos)
- Configuración de modelos de IA (proveedor, modelo, API keys)
- Gestión de planes y precios
- Verificación manual de pagos (comprobantes Yape/Plin)
- Estadísticas globales de la plataforma
- Aprobación de registros y moderación de contenido
- Configuración global del sistema

### Profesor
- Se registra solo o lo crea el superadmin/academia
- Crea materias y secciones/grupos
- Sube exámenes de referencia (resueltos o vacío + respuestas)
- Sube exámenes de alumnos para corrección masiva con IA
- Define rúbricas personalizables por examen
- Genera exámenes similares con dificultad ajustable
- Ve resultados y estadísticas de sus alumnos
- Crea y gestiona alumnos

### Alumno
- Se registra solo (con código de clase) o lo crea el profesor
- Ve sus exámenes corregidos con retroalimentación detallada
- Accede al módulo tutor (chat IA, plan de estudio, ejercicios)
- Ve su progreso y estadísticas

### Plan Academia/Universidad
- No es un rol separado, es un tier de suscripción
- Permite múltiples profesores bajo una organización
- Dashboard agregado con estadísticas de todos los profesores
- Límites superiores de uso

## Modelo de Negocio
- **Freemium + Suscripción mensual**
- **4 planes**: Gratis, Básico, Pro, Enterprise
- **Pagos**: Offline con QR (Yape/Plin) - admin verifica manualmente
- **País objetivo**: Perú

## Directorio del Proyecto
```
amautia/
├── frontend/          # Next.js 15
├── backend/           # FastAPI
├── docker-compose.yml
├── .planning/         # Documentos de planificación
└── README.md
```
