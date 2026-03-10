# Amautia - Orden de Implementación para Ejecución Overnight

## Instrucciones de Ejecución
Ejecutar cada fase en orden. Cada fase debe estar funcional antes de pasar a la siguiente.
Testear con Playwright al final de cada grupo de fases.

## GRUPO 1: Fundación (Fases 1-2) ✅

### Fase 1: Setup del Proyecto ✅
1. ✅ Crear `frontend/` con Next.js 16 + TypeScript + Tailwind + shadcn/ui
2. ✅ Crear `backend/` con FastAPI + SQLAlchemy 2 (sin Alembic aún, tablas via create_all)
3. ✅ Crear `docker-compose.yml` con postgres, redis, minio
4. ✅ Configurar variables de entorno
5. ✅ Verificar que todo levanta (local con Homebrew: PostgreSQL 16 + Redis)

### Fase 2: Auth + Roles + Layout ✅
1. ✅ Modelos: User, Plan, Subscription (+ 11 modelos más: 14 total)
2. ⬜ Migraciones con Alembic (usando create_all por ahora)
3. ✅ Endpoints de auth: register, login, refresh, me
4. ✅ JWT con roles (superadmin, profesor, alumno)
5. ✅ Middleware de auth en Next.js (useAuth hook + protected routes)
6. ✅ Layout dashboard: sidebar responsive + navbar
7. ✅ Rutas protegidas por rol
8. ✅ Página de login y registro
9. ✅ Usuarios de prueba para autocompletado en login:
   - admin@amautia.com / admin123 (superadmin)
   - profesor@amautia.com / profesor123 (profesor)
   - alumno@amautia.com / alumno123 (alumno)
10. ✅ Seed de planes iniciales (4 planes) + system config

**TEST**: ✅ Login con 3 roles, redirección correcta, protección de rutas

## GRUPO 2: Landing + Admin (Fases 3-4) ✅

### Fase 3: Landing Page ✅
1. ✅ Hero section
2. ✅ Features section (6 features)
3. ✅ Cómo funciona (4 pasos)
4. ✅ Pricing (4 planes)
5. ✅ CTA + Footer
6. ✅ Responsive

### Fase 4: Panel Superadmin ✅
1. ✅ Dashboard con stats (8 cards: usuarios, profesores, alumnos, exámenes, correcciones, ingresos, suscripciones, pagos pendientes)
2. ✅ CRUD usuarios con tabla filtrable (search, filter por rol, crear, activar/desactivar, eliminar)
3. ✅ Configuración de proveedores IA (CRUD) — backend + frontend
4. ✅ Configuración de modelos IA (CRUD + set default por tarea) — backend
5. ✅ CRUD de planes (vista cards con features) — backend + frontend
6. ✅ Verificación de pagos (listar, aprobar, rechazar) — backend + frontend
7. ✅ Configuración global (key-value editor) — backend + frontend
8. ✅ Logs de actividad (tabla con filtros) — backend + frontend
   - ⬜ Gráficos con Recharts en dashboard (pendiente)

**TEST**: ✅ Landing carga OK, admin dashboard funcional, CRUD de usuarios (49 endpoints backend)

## GRUPO 3: Profesor Core (Fases 5-6) 🟡 Parcial

### Fase 5: Gestión del Profesor ✅
1. ✅ CRUD materias (con color picker, cards grid)
2. ✅ CRUD secciones con código de clase (auto-generado, regenerable)
3. ✅ Gestión de alumnos (manual: agregar/quitar de sección)
   - ⬜ Importar desde CSV/Excel
4. ✅ Dashboard profesor (stats + exámenes recientes)

### Fase 6: Corrección con IA ⬜
1. ⬜ Subir examen de referencia (archivo) — requiere MinIO
2. ⬜ Procesamiento con IA (extracción OCR)
3. ⬜ Editor de preguntas extraídas
4. ⬜ Rúbricas por pregunta
5. ⬜ Upload masivo de exámenes de alumnos
6. ⬜ Motor de corrección (Celery + IA)
7. ⬜ Progreso en tiempo real (WebSocket)
8. ⬜ Vista de resultados (tabla + estadísticas)
9. ⬜ Detalle por alumno (pregunta x pregunta)
10. ⬜ Exportar resultados

**TEST**: ⬜ Crear materia → sección → subir examen → corregir → ver resultados

## GRUPO 4: Alumno + Generación (Fases 7-8) 🟡 Parcial

### Fase 7: Portal del Alumno 🟡
1. ✅ Dashboard alumno (stats + acciones rápidas)
2. ✅ Unirse a clase con código (formulario + validación)
3. ✅ Ver exámenes corregidos (lista con notas)
4. ⬜ Detalle de corrección (feedback por pregunta)
5. ✅ Estadísticas y progreso (página stub, endpoint backend listo)

### Fase 8: Generación de Exámenes ⬜
1. ⬜ Subida de fuentes (examen, texto, documento)
2. ⬜ Configuración de generación
3. ⬜ Motor de generación con IA
4. ⬜ Editor de examen generado
5. ⬜ Exportación (PDF, Word)

**TEST**: ⬜ Alumno ve correcciones, profesor genera examen

## GRUPO 5: Tutor + Pagos + Notificaciones (Fases 9-11) 🟡 Parcial

### Fase 9: Tutor IA ⬜
1. ⬜ Chat con IA (streaming) — UI stub creada, falta backend IA
2. ⬜ Plan de estudio auto-generado
3. ⬜ Ejercicios prácticos
4. ⬜ Seguimiento de progreso

### Fase 10: Pagos 🟡
1. ✅ Vista de planes para usuario (página suscripción con cards)
2. ⬜ Generar QR con datos de pago
3. ⬜ Upload de comprobante
4. ✅ Panel admin de verificación (aprobar/rechazar pagos)
5. ⬜ Activación automática de plan
6. ⬜ Control de límites por plan

### Fase 11: Notificaciones 🟡
1. ✅ Notificaciones in-app (listar, marcar leídas, contador) — sin WebSocket aún
2. ⬜ Email (templates + envío)
3. ⬜ WhatsApp (API Meta Business)
4. ⬜ Preferencias por usuario

**TEST**: ⬜ Flujo completo end-to-end

## Usuarios de Prueba (Seed) ✅
```
Superadmin:
  email: admin@amautia.com
  password: admin123

Profesor:
  email: profesor@amautia.com
  password: profesor123

Alumno:
  email: alumno@amautia.com
  password: alumno123
```

✅ En el formulario de login, mostrar botones de acceso rápido:
"Entrar como Admin" | "Entrar como Profesor" | "Entrar como Alumno"
Que autocompleten email y password.

---

## Resumen de Progreso

| Grupo | Fase | Estado |
|-------|------|--------|
| 1 | Fase 1: Setup | ✅ Completo |
| 1 | Fase 2: Auth + Layout | ✅ Completo (falta Alembic) |
| 2 | Fase 3: Landing | ✅ Completo |
| 2 | Fase 4: Admin Panel | ✅ Completo (falta gráficos Recharts) |
| 3 | Fase 5: Profesor Core | ✅ Completo (falta CSV import) |
| 3 | Fase 6: Corrección IA | ⬜ No iniciado |
| 4 | Fase 7: Portal Alumno | 🟡 70% (falta detalle corrección) |
| 4 | Fase 8: Generación | ⬜ No iniciado |
| 5 | Fase 9: Tutor IA | ⬜ UI stub, falta backend |
| 5 | Fase 10: Pagos | 🟡 30% (vista + admin, falta QR/comprobante) |
| 5 | Fase 11: Notificaciones | 🟡 40% (in-app OK, falta email/WhatsApp) |

**Backend:** 49 endpoints implementados de ~72 planeados (~68%)
**Frontend:** 16 páginas funcionales con datos reales
**Siguiente paso:** Fase 6 (Corrección con IA) — el core del producto
