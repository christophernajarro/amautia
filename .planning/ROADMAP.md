# Amautia - Roadmap de Desarrollo

## Fase 1: Fundación y Setup (Prioridad: CRÍTICA)
**Objetivo**: Proyecto funcional con auth, roles y estructura base.

### Tareas:
1. **Setup del proyecto**
   - Inicializar Next.js 15 con App Router + TypeScript + Tailwind + shadcn/ui
   - Inicializar FastAPI con estructura modular
   - Configurar PostgreSQL con SQLAlchemy 2 + Alembic
   - Docker Compose (postgres, redis, minio, backend, frontend)
   - Configurar variables de entorno (.env.example)

2. **Base de datos - Schema inicial**
   - Modelo User (con campo role: superadmin/profesor/alumno)
   - Modelo Organization (para plan academia)
   - Migraciones con Alembic

3. **Autenticación y Autorización**
   - Registro (profesor se registra solo, alumno con código de clase)
   - Login con JWT (access + refresh tokens)
   - Middleware de roles en FastAPI (decoradores por rol)
   - Middleware de auth en Next.js (middleware.ts + server actions)
   - Protección de rutas por rol

4. **Layout base del frontend**
   - Layout con sidebar responsive (shadcn/ui)
   - Navbar con usuario, notificaciones
   - Rutas base por rol: /admin/*, /profesor/*, /alumno/*
   - Tema/paleta de colores (definir brand de Amautia)
   - Componentes base reutilizables

---

## Fase 2: Landing Page + Precios (Prioridad: ALTA)
**Objetivo**: Página pública que vende el producto.

### Tareas:
1. **Landing Page**
   - Hero section con propuesta de valor
   - Sección de características (corrección, generación, tutor)
   - Sección "Cómo funciona" (pasos visuales)
   - Testimonios (placeholder)
   - CTA de registro

2. **Página de Precios**
   - 4 planes: Gratis, Básico (S/29), Pro (S/79), Enterprise (S/199)
   - Tabla comparativa de features
   - Gratis: 5 correcciones/mes, 2 generaciones, sin tutor
   - Básico: 50 correcciones, 20 generaciones, tutor básico
   - Pro: 300 correcciones, ilimitadas generaciones, tutor completo
   - Enterprise: Ilimitado, multi-profesor, dashboard academia
   - CTA por plan

3. **Páginas legales**
   - Términos de servicio
   - Política de privacidad

---

## Fase 3: Panel Superadmin (Prioridad: ALTA)
**Objetivo**: Panel completo de administración.

### Tareas:
1. **Dashboard principal**
   - Métricas: usuarios totales, exámenes corregidos hoy/semana/mes
   - Gráficos de uso (correcciones por día, registros)
   - Pagos pendientes de verificación
   - Actividad reciente

2. **Gestión de usuarios**
   - Listado con filtros (rol, estado, plan, fecha)
   - CRUD de usuarios (crear profesor/alumno)
   - Activar/desactivar cuentas
   - Cambiar plan manualmente
   - Ver detalle de usuario (uso, pagos, exámenes)

3. **Configuración de modelos IA**
   - CRUD de proveedores (Gemini, OpenAI, Claude)
   - Configurar API keys por proveedor
   - Seleccionar modelo por defecto para cada tarea (corrección, generación, tutor)
   - Seleccionar modelo para visión (imágenes/dibujos)
   - Test de conexión por proveedor

4. **Gestión de planes y precios**
   - CRUD de planes con límites configurables
   - Editar precios, límites de correcciones, generaciones
   - Activar/desactivar planes

5. **Verificación de pagos**
   - Lista de pagos pendientes con comprobante adjunto
   - Ver imagen del comprobante (Yape/Plin)
   - Aprobar/rechazar pago
   - Activar plan automáticamente al aprobar
   - Historial de pagos

6. **Moderación**
   - Registros pendientes de aprobación (si se activa)
   - Reportes de contenido
   - Logs de actividad del sistema

---

## Fase 4: Módulo Profesor - Gestión (Prioridad: CRÍTICA)
**Objetivo**: El profesor puede organizar materias, secciones y alumnos.

### Tareas:
1. **Gestión de materias**
   - CRUD de materias (nombre, descripción, color/ícono)
   - Vista de grid/lista de materias

2. **Gestión de secciones/grupos**
   - CRUD de secciones dentro de una materia
   - Código de clase único por sección (para que alumnos se unan)
   - Asignar alumnos a secciones

3. **Gestión de alumnos**
   - Agregar alumnos manualmente (nombre, email)
   - Importar alumnos desde CSV/Excel
   - Ver lista de alumnos por sección
   - Invitar alumnos por email/código

4. **Dashboard del profesor**
   - Resumen: materias, alumnos, exámenes recientes
   - Exámenes pendientes de corrección
   - Estadísticas de rendimiento por materia/sección

---

## Fase 5: Módulo de Corrección de Exámenes con IA (Prioridad: CRÍTICA)
**Objetivo**: Core del producto - corrección masiva con IA.

### Tareas:
1. **Subida de examen de referencia**
   - Upload de archivo (PDF, imagen, Word)
   - Opción A: Subir examen resuelto como modelo
   - Opción B: Subir examen vacío + respuestas en texto/archivo separado
   - OCR/extracción del contenido con IA (Gemini para imágenes)
   - Preview del examen procesado
   - Identificación automática de preguntas

2. **Configuración de rúbricas**
   - Asignar puntaje por pregunta (automático o manual)
   - Criterios de evaluación por pregunta
   - Escala de calificación configurable (0-20, 0-100, letras, etc.)
   - Templates de rúbricas reutilizables

3. **Subida de exámenes de alumnos**
   - Upload múltiple (batch) de PDFs/imágenes
   - Asignación automática por nombre de archivo o manual
   - Vista de cola de corrección
   - Detección de nombre del alumno en el examen (OCR)

4. **Motor de corrección con IA**
   - Pipeline: OCR → Extracción de respuestas → Comparación → Calificación
   - Soporte multi-tipo: opción múltiple, desarrollo, V/F, completar, matemáticas
   - Procesamiento con Celery (async, en cola)
   - Gemini para exámenes con dibujos/gráficos
   - Proveedor configurable por superadmin
   - Retroalimentación por pregunta (qué estuvo mal, sugerencia de mejora)
   - Nota parcial para respuestas parcialmente correctas
   - Progreso en tiempo real (WebSocket)

5. **Resultados y reportes**
   - Vista de resultados por examen (lista de alumnos + notas)
   - Detalle por alumno (pregunta por pregunta con feedback)
   - Estadísticas del examen (promedio, distribución, pregunta más fallada)
   - Exportar resultados a Excel/PDF
   - El profesor puede editar/ajustar la corrección de la IA

---

## Fase 6: Portal del Alumno (Prioridad: ALTA)
**Objetivo**: Los alumnos ven sus correcciones y progreso.

### Tareas:
1. **Dashboard del alumno**
   - Materias en las que está inscrito
   - Exámenes recientes con notas
   - Promedio general y por materia

2. **Vista de examen corregido**
   - Ver su examen con las correcciones de la IA
   - Feedback por pregunta
   - Nota por pregunta y nota total
   - Comparación con respuesta correcta

3. **Estadísticas y progreso**
   - Gráfico de evolución de notas
   - Fortalezas y debilidades por tema
   - Ranking dentro de la sección (opcional, configurable)

4. **Unirse a clase**
   - Ingresar código de clase para unirse a una sección
   - Ver materias y profesores asignados

---

## Fase 7: Módulo de Generación de Exámenes (Prioridad: ALTA)
**Objetivo**: Generar exámenes similares a partir de fuentes diversas.

### Tareas:
1. **Subida de material fuente**
   - Examen existente (PDF/imagen/Word)
   - Texto libre / temas escritos
   - PDF de libro o presentación
   - Múltiples fuentes combinadas

2. **Configuración de generación**
   - Nivel de dificultad relativo: Más fácil, Igual, Más difícil
   - Número de preguntas
   - Tipos de preguntas a incluir (opción múltiple, desarrollo, V/F, etc.)
   - Incluir/excluir dibujos y gráficos
   - Materia y nivel educativo

3. **Motor de generación con IA**
   - Análisis del material fuente con IA
   - Generación de preguntas nuevas manteniendo el estilo
   - Gemini para generar dibujos/gráficos si el original los tiene
   - Generación de clave de respuestas automática
   - Variantes del mismo examen (para evitar copia)

4. **Editor de examen generado**
   - Preview del examen generado
   - Editar/eliminar/agregar preguntas manualmente
   - Reordenar preguntas (drag & drop)
   - Regenerar preguntas individuales

5. **Exportación**
   - PDF (con y sin clave de respuestas)
   - Word (editable)
   - Guardar como template para futuras generaciones

---

## Fase 8: Módulo Tutor con IA (Prioridad: MEDIA)
**Objetivo**: Tutor inteligente personalizado por alumno.

### Tareas:
1. **Chat con IA**
   - Chat contextualizado a los exámenes corregidos del alumno
   - El tutor conoce las debilidades del alumno
   - Explicaciones paso a paso
   - Historial de conversaciones

2. **Plan de estudio personalizado**
   - Generado automáticamente según debilidades detectadas
   - Temas prioritarios a reforzar
   - Recursos sugeridos
   - Timeline de estudio

3. **Ejercicios prácticos**
   - Generación de ejercicios enfocados en debilidades
   - Corrección inmediata con feedback
   - Progresión de dificultad adaptativa

4. **Seguimiento de progreso**
   - Métricas de mejora por tema
   - Tiempo de estudio
   - Ejercicios completados
   - Comparación antes/después

---

## Fase 9: Módulo de Pagos (Prioridad: ALTA)
**Objetivo**: Sistema de pagos offline con QR (Yape/Plin).

### Tareas:
1. **Flujo de pago para el usuario**
   - Seleccionar plan deseado
   - Generar QR con monto y referencia
   - Mostrar datos de pago (número Yape/Plin del admin)
   - Subir comprobante de pago (foto/screenshot)
   - Estado del pago: pendiente, aprobado, rechazado

2. **Panel de verificación (superadmin)**
   - Ya definido en Fase 3
   - Aprobar → activar plan con fecha de vencimiento
   - Rechazar → notificar al usuario el motivo
   - Recordatorios de renovación

3. **Gestión de suscripciones**
   - Fecha de inicio y vencimiento
   - Renovación manual (nuevo pago)
   - Degradar a plan gratis si vence
   - Período de gracia configurable
   - Historial de suscripciones

---

## Fase 10: Sistema de Notificaciones (Prioridad: MEDIA)
**Objetivo**: Notificar a usuarios por múltiples canales.

### Tareas:
1. **Notificaciones in-app**
   - Campana de notificaciones en navbar
   - Lista de notificaciones con read/unread
   - Tiempo real con WebSocket
   - Tipos: examen corregido, pago aprobado, nuevo examen, etc.

2. **Notificaciones por email**
   - Plantillas HTML para cada tipo de notificación
   - SMTP o servicio como Resend
   - Emails transaccionales: bienvenida, examen corregido, pago, etc.
   - Configuración de preferencias por usuario

3. **Notificaciones por WhatsApp**
   - Integración con Meta Business API (o Twilio)
   - Templates aprobados por Meta
   - Notificaciones clave: examen corregido, pago aprobado
   - Opt-in/opt-out por usuario

---

## Fase 11: Testing, Polish y Deploy (Prioridad: ALTA)
**Objetivo**: Calidad, rendimiento y producción.

### Tareas:
1. **Testing**
   - Tests unitarios backend (pytest)
   - Tests de integración API
   - Tests e2e frontend (Playwright)
   - Tests de corrección IA (accuracy)

2. **Optimización**
   - Caché de resultados frecuentes (Redis)
   - Lazy loading de componentes pesados
   - Optimización de queries SQL
   - Rate limiting por plan

3. **Deploy**
   - Docker Compose de producción
   - Nginx como reverse proxy + SSL (Let's Encrypt)
   - Backups automáticos de PostgreSQL
   - Monitoreo básico (health checks)
   - CI/CD con GitHub Actions

4. **SEO y Analytics**
   - Meta tags para landing page
   - Google Analytics
   - Sitemap

---

## Orden de Ejecución Sugerido

| Orden | Fase | Dependencia |
|-------|------|-------------|
| 1 | Fase 1: Fundación | - |
| 2 | Fase 2: Landing + Precios | Fase 1 |
| 3 | Fase 3: Panel Superadmin | Fase 1 |
| 4 | Fase 4: Profesor - Gestión | Fase 1 |
| 5 | Fase 5: Corrección IA | Fase 4 |
| 6 | Fase 6: Portal Alumno | Fase 5 |
| 7 | Fase 9: Pagos | Fase 3 |
| 8 | Fase 7: Generación Exámenes | Fase 4 |
| 9 | Fase 8: Tutor IA | Fase 6 |
| 10 | Fase 10: Notificaciones | Fase 1 |
| 11 | Fase 11: Deploy | Todas |

Las fases 2, 3, 4 pueden ejecutarse en paralelo después de la Fase 1.
