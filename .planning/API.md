# Amautia - API Endpoints (FastAPI)

Base URL: `/api/v1`

## Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registro (profesor o alumno) |
| POST | `/auth/login` | Login, devuelve access + refresh token |
| POST | `/auth/refresh` | Renovar access token |
| POST | `/auth/forgot-password` | Solicitar reset de contraseña |
| POST | `/auth/reset-password` | Cambiar contraseña con token |
| GET | `/auth/me` | Datos del usuario autenticado |
| PUT | `/auth/me` | Actualizar perfil |
| PUT | `/auth/me/password` | Cambiar contraseña |
| PUT | `/auth/me/avatar` | Subir/cambiar avatar |

## Superadmin - Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/users` | Listar usuarios (filtros: role, status, plan) |
| POST | `/admin/users` | Crear usuario |
| GET | `/admin/users/{id}` | Detalle de usuario |
| PUT | `/admin/users/{id}` | Editar usuario |
| PATCH | `/admin/users/{id}/status` | Activar/desactivar |
| PATCH | `/admin/users/{id}/plan` | Cambiar plan manualmente |
| DELETE | `/admin/users/{id}` | Eliminar usuario |

## Superadmin - Dashboard

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/dashboard/stats` | Métricas globales |
| GET | `/admin/dashboard/activity` | Actividad reciente |
| GET | `/admin/dashboard/charts` | Datos para gráficos |

## Superadmin - IA

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/ai/providers` | Listar proveedores IA |
| POST | `/admin/ai/providers` | Crear proveedor |
| PUT | `/admin/ai/providers/{id}` | Editar proveedor (API key, etc.) |
| DELETE | `/admin/ai/providers/{id}` | Eliminar proveedor |
| POST | `/admin/ai/providers/{id}/test` | Test de conexión |
| GET | `/admin/ai/models` | Listar modelos |
| POST | `/admin/ai/models` | Crear modelo |
| PUT | `/admin/ai/models/{id}` | Editar modelo |
| PATCH | `/admin/ai/models/{id}/default` | Establecer como default para tarea |
| DELETE | `/admin/ai/models/{id}` | Eliminar modelo |

## Superadmin - Planes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/plans` | Listar planes |
| POST | `/admin/plans` | Crear plan |
| PUT | `/admin/plans/{id}` | Editar plan |
| PATCH | `/admin/plans/{id}/status` | Activar/desactivar plan |

## Superadmin - Pagos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/payments` | Listar pagos (filtros: status, fecha) |
| GET | `/admin/payments/{id}` | Detalle de pago con comprobante |
| PATCH | `/admin/payments/{id}/approve` | Aprobar pago |
| PATCH | `/admin/payments/{id}/reject` | Rechazar pago (con motivo) |

## Superadmin - Configuración

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/config` | Obtener toda la configuración |
| PUT | `/admin/config/{key}` | Actualizar configuración |
| GET | `/admin/logs` | Logs de actividad |

## Profesor - Materias

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/profesor/subjects` | Mis materias |
| POST | `/profesor/subjects` | Crear materia |
| PUT | `/profesor/subjects/{id}` | Editar materia |
| DELETE | `/profesor/subjects/{id}` | Eliminar materia |

## Profesor - Secciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/profesor/subjects/{id}/sections` | Secciones de una materia |
| POST | `/profesor/subjects/{id}/sections` | Crear sección |
| PUT | `/profesor/sections/{id}` | Editar sección |
| DELETE | `/profesor/sections/{id}` | Eliminar sección |
| POST | `/profesor/sections/{id}/regenerate-code` | Regenerar código de clase |
| GET | `/profesor/sections/{id}/students` | Alumnos de la sección |

## Profesor - Alumnos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/profesor/sections/{id}/students` | Agregar alumno manual |
| POST | `/profesor/sections/{id}/students/import` | Importar desde CSV/Excel |
| DELETE | `/profesor/sections/{sid}/students/{uid}` | Quitar alumno de sección |
| POST | `/profesor/sections/{id}/students/invite` | Enviar invitación por email |

## Profesor - Exámenes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/profesor/exams` | Mis exámenes (filtros: section, status) |
| POST | `/profesor/exams` | Crear examen (subir referencia) |
| GET | `/profesor/exams/{id}` | Detalle del examen |
| PUT | `/profesor/exams/{id}` | Editar examen |
| DELETE | `/profesor/exams/{id}` | Eliminar examen |

## Profesor - Referencia y Rúbricas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/profesor/exams/{id}/reference` | Subir/cambiar archivo de referencia |
| POST | `/profesor/exams/{id}/process-reference` | Procesar referencia con IA (OCR + extracción) |
| GET | `/profesor/exams/{id}/questions` | Preguntas extraídas |
| PUT | `/profesor/exams/{id}/questions/{qid}` | Editar pregunta extraída |
| POST | `/profesor/exams/{id}/questions` | Agregar pregunta manual |
| DELETE | `/profesor/exams/{id}/questions/{qid}` | Eliminar pregunta |
| GET | `/profesor/exams/{id}/rubrics` | Rúbricas del examen |
| POST | `/profesor/exams/{id}/questions/{qid}/rubric` | Crear/editar rúbrica |

## Profesor - Corrección

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/profesor/exams/{id}/student-exams` | Subir exámenes de alumnos (batch) |
| POST | `/profesor/exams/{id}/correct` | Iniciar corrección masiva con IA |
| GET | `/profesor/exams/{id}/correction-status` | Estado del proceso de corrección |
| GET | `/profesor/exams/{id}/results` | Resultados de todos los alumnos |
| GET | `/profesor/student-exams/{id}` | Detalle de corrección de un alumno |
| PUT | `/profesor/student-exams/{id}/review` | Profesor revisa/ajusta corrección |
| GET | `/profesor/exams/{id}/stats` | Estadísticas del examen |
| GET | `/profesor/exams/{id}/export` | Exportar resultados (Excel/PDF) |
| PATCH | `/profesor/exams/{id}/publish` | Publicar resultados (visible para alumnos) |

## Profesor - Generación de Exámenes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/profesor/generate` | Generar examen nuevo |
| GET | `/profesor/generated` | Mis exámenes generados |
| GET | `/profesor/generated/{id}` | Detalle de examen generado |
| PUT | `/profesor/generated/{id}/questions/{qid}` | Editar pregunta generada |
| DELETE | `/profesor/generated/{id}/questions/{qid}` | Eliminar pregunta |
| POST | `/profesor/generated/{id}/questions/{qid}/regenerate` | Regenerar una pregunta |
| POST | `/profesor/generated/{id}/add-question` | Agregar pregunta |
| GET | `/profesor/generated/{id}/export/pdf` | Exportar a PDF |
| GET | `/profesor/generated/{id}/export/pdf-answers` | PDF con respuestas |
| GET | `/profesor/generated/{id}/export/word` | Exportar a Word |
| POST | `/profesor/generated/{id}/save-as-exam` | Guardar como examen real |

## Profesor - Dashboard

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/profesor/dashboard` | Resumen general |
| GET | `/profesor/stats/subject/{id}` | Estadísticas por materia |
| GET | `/profesor/stats/section/{id}` | Estadísticas por sección |

## Alumno

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/alumno/dashboard` | Dashboard del alumno |
| POST | `/alumno/join` | Unirse a sección con código |
| GET | `/alumno/sections` | Mis secciones/materias |
| GET | `/alumno/exams` | Mis exámenes corregidos |
| GET | `/alumno/exams/{id}` | Detalle de examen corregido |
| GET | `/alumno/stats` | Mi progreso general |
| GET | `/alumno/stats/subject/{id}` | Progreso por materia |

## Alumno - Tutor

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/alumno/tutor/chats` | Mis conversaciones con tutor |
| POST | `/alumno/tutor/chats` | Iniciar nueva conversación |
| GET | `/alumno/tutor/chats/{id}` | Mensajes de una conversación |
| POST | `/alumno/tutor/chats/{id}/message` | Enviar mensaje (streaming response) |
| GET | `/alumno/tutor/study-plans` | Mis planes de estudio |
| POST | `/alumno/tutor/study-plans/generate` | Generar plan de estudio |
| GET | `/alumno/tutor/study-plans/{id}` | Detalle del plan |
| PATCH | `/alumno/tutor/study-plans/{id}/topics/{tid}` | Actualizar progreso de tema |
| GET | `/alumno/tutor/exercises` | Ejercicios disponibles |
| POST | `/alumno/tutor/exercises/generate` | Generar ejercicios para tema |
| POST | `/alumno/tutor/exercises/{id}/submit` | Enviar respuesta de ejercicio |
| GET | `/alumno/tutor/progress` | Progreso del tutor |

## Pagos (Usuario)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/payments/plans` | Ver planes disponibles |
| POST | `/payments/request` | Solicitar pago (genera QR/datos) |
| POST | `/payments/upload-receipt` | Subir comprobante |
| GET | `/payments/my-payments` | Historial de mis pagos |
| GET | `/payments/my-subscription` | Mi suscripción actual |

## Notificaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/notifications` | Mis notificaciones |
| GET | `/notifications/unread-count` | Cantidad no leídas |
| PATCH | `/notifications/{id}/read` | Marcar como leída |
| PATCH | `/notifications/read-all` | Marcar todas como leídas |
| PUT | `/notifications/preferences` | Configurar preferencias |

## Upload de Archivos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/upload` | Subir archivo genérico (retorna URL) |
| POST | `/upload/batch` | Subir múltiples archivos |

## WebSocket

| Endpoint | Descripción |
|----------|-------------|
| `ws://api/ws/notifications` | Notificaciones en tiempo real |
| `ws://api/ws/correction/{exam_id}` | Progreso de corrección en vivo |
| `ws://api/ws/tutor/{chat_id}` | Streaming de respuesta del tutor |

## Público

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/public/plans` | Planes y precios (para landing) |
