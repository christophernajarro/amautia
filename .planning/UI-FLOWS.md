# Amautia - Flujos de Usuario y Pantallas

## Estructura de Rutas (Next.js App Router)

```
app/
├── (public)/                    # Rutas públicas
│   ├── page.tsx                 # Landing page
│   ├── precios/page.tsx         # Planes y precios
│   ├── terminos/page.tsx        # Términos de servicio
│   └── privacidad/page.tsx      # Política de privacidad
│
├── (auth)/                      # Rutas de autenticación
│   ├── login/page.tsx
│   ├── registro/page.tsx
│   ├── recuperar/page.tsx       # Forgot password
│   └── reset/page.tsx           # Reset password
│
├── (dashboard)/                 # Rutas protegidas con layout
│   ├── layout.tsx               # Sidebar + Navbar + Auth guard
│   │
│   ├── admin/                   # Superadmin
│   │   ├── page.tsx             # Dashboard
│   │   ├── usuarios/page.tsx    # Gestión de usuarios
│   │   ├── usuarios/[id]/page.tsx
│   │   ├── pagos/page.tsx       # Verificación de pagos
│   │   ├── planes/page.tsx      # Gestión de planes
│   │   ├── ia/page.tsx          # Configuración IA
│   │   ├── config/page.tsx      # Configuración global
│   │   └── logs/page.tsx        # Logs de actividad
│   │
│   ├── profesor/                # Profesor
│   │   ├── page.tsx             # Dashboard
│   │   ├── materias/page.tsx    # Mis materias
│   │   ├── materias/[id]/page.tsx        # Detalle materia + secciones
│   │   ├── materias/[id]/secciones/[sid]/page.tsx  # Detalle sección
│   │   ├── alumnos/page.tsx     # Mis alumnos
│   │   ├── examenes/page.tsx    # Mis exámenes
│   │   ├── examenes/nuevo/page.tsx       # Crear examen
│   │   ├── examenes/[id]/page.tsx        # Detalle examen
│   │   ├── examenes/[id]/corregir/page.tsx  # Subir y corregir
│   │   ├── examenes/[id]/resultados/page.tsx  # Resultados
│   │   ├── examenes/[id]/alumno/[sid]/page.tsx  # Corrección individual
│   │   ├── generar/page.tsx     # Generar examen
│   │   ├── generar/[id]/page.tsx  # Editor de examen generado
│   │   └── estadisticas/page.tsx  # Estadísticas
│   │
│   ├── alumno/                  # Alumno
│   │   ├── page.tsx             # Dashboard
│   │   ├── materias/page.tsx    # Mis materias
│   │   ├── examenes/page.tsx    # Mis exámenes corregidos
│   │   ├── examenes/[id]/page.tsx  # Detalle corrección
│   │   ├── tutor/page.tsx       # Tutor IA
│   │   ├── tutor/chat/[id]/page.tsx  # Chat con tutor
│   │   ├── tutor/plan/page.tsx  # Plan de estudio
│   │   ├── tutor/ejercicios/page.tsx  # Ejercicios
│   │   ├── progreso/page.tsx    # Mi progreso
│   │   └── unirse/page.tsx      # Unirse a clase
│   │
│   ├── perfil/page.tsx          # Perfil (compartido)
│   ├── suscripcion/page.tsx     # Mi suscripción
│   └── notificaciones/page.tsx  # Centro de notificaciones
```

---

## Flujo 1: Registro e Inicio

### Profesor se registra
1. Landing → Click "Empieza gratis"
2. Formulario: nombre, email, contraseña, teléfono (opcional)
3. Verificación email (o aprobación admin si está activada)
4. Login → Dashboard profesor (plan gratis activo)

### Alumno se registra
1. Landing → Click "Soy alumno"
2. Formulario: nombre, email, contraseña
3. Opción: ingresar código de clase ahora o después
4. Login → Dashboard alumno

### Alumno creado por profesor
1. Profesor → Alumnos → Agregar alumno
2. Ingresa nombre y email
3. Alumno recibe email con link + contraseña temporal
4. Alumno entra, cambia contraseña

---

## Flujo 2: Corrección de Exámenes (Core)

### Paso 1: Crear examen
```
Profesor → Exámenes → Nuevo Examen
├── Seleccionar materia y sección
├── Título del examen
├── Subir referencia:
│   ├── Opción A: Examen resuelto (PDF/imagen/Word)
│   └── Opción B: Examen vacío + respuestas (texto o archivo)
└── Click "Procesar con IA"
```

### Paso 2: Revisión de extracción
```
IA procesa el archivo → extrae preguntas
├── Preview: lista de preguntas detectadas
├── Editar preguntas (corregir OCR si necesario)
├── Configurar puntaje por pregunta
├── Crear/editar rúbricas (opcional)
│   └── Por cada pregunta: criterios + niveles + puntaje
└── Confirmar: "Examen listo para corrección"
```

### Paso 3: Subir exámenes de alumnos
```
Profesor → Examen → Corregir
├── Upload masivo (drag & drop múltiples archivos)
├── Asignación:
│   ├── Automática (detecta nombre en el examen)
│   └── Manual (asignar cada archivo a un alumno)
├── Preview de archivos subidos
└── Click "Iniciar corrección"
```

### Paso 4: Corrección en proceso
```
Vista de progreso:
├── Barra de progreso general
├── Lista de alumnos con estado:
│   ├── ⏳ En cola
│   ├── 🔄 Procesando
│   ├── ✅ Corregido
│   └── ❌ Error
├── Actualización en tiempo real (WebSocket)
└── Nota parcial visible al completar cada uno
```

### Paso 5: Resultados
```
Vista de resultados:
├── Tabla: alumno | nota | % | estado
├── Estadísticas: promedio, distribución, pregunta más fallada
├── Filtros: por nota, por estado
├── Acciones:
│   ├── Ver detalle por alumno
│   ├── Editar/ajustar nota
│   ├── Exportar (Excel/PDF)
│   └── Publicar resultados (alumnos los ven)
```

### Paso 6: Detalle por alumno
```
Vista detallada:
├── Examen del alumno (imagen/PDF) a la izquierda
├── Corrección por pregunta a la derecha:
│   ├── Pregunta N
│   ├── Respuesta del alumno
│   ├── Respuesta correcta
│   ├── Nota: X/Y
│   ├── Feedback de la IA
│   ├── Sugerencia de mejora
│   └── [Editar nota] [Editar feedback]
├── Nota total
├── Feedback general
└── [Aprobar corrección]
```

---

## Flujo 3: Generación de Exámenes

```
Profesor → Generar Examen
├── 1. Fuente:
│   ├── Subir examen existente (PDF/imagen/Word)
│   ├── Escribir temas/contenido
│   ├── Subir documento (libro, presentación)
│   └── Combinar múltiples fuentes
│
├── 2. Configuración:
│   ├── Dificultad: Más fácil | Igual | Más difícil
│   ├── Número de preguntas
│   ├── Tipos: [✓] Opción múltiple [✓] Desarrollo [✓] V/F ...
│   ├── ¿Incluir imágenes/dibujos? Sí/No
│   ├── Materia y nivel educativo
│   └── Instrucciones adicionales (opcional)
│
├── 3. Generación: (loading con progreso)
│
├── 4. Editor:
│   ├── Preview del examen generado
│   ├── Editar cada pregunta
│   ├── Eliminar / agregar preguntas
│   ├── Reordenar (drag & drop)
│   ├── Regenerar pregunta individual
│   └── Preview de clave de respuestas
│
└── 5. Exportar:
    ├── PDF (examen)
    ├── PDF (examen + respuestas)
    ├── Word (editable)
    └── Guardar como examen para corrección futura
```

---

## Flujo 4: Tutor IA (Alumno)

```
Alumno → Tutor
├── Dashboard tutor:
│   ├── Resumen de debilidades detectadas
│   ├── Plan de estudio activo
│   ├── Ejercicios pendientes
│   └── Conversaciones recientes
│
├── Chat:
│   ├── Seleccionar materia
│   ├── Chat tipo ChatGPT
│   ├── Contexto: conoce los exámenes del alumno
│   ├── Puede explicar errores de exámenes
│   ├── Sugiere ejercicios
│   └── Streaming de respuesta
│
├── Plan de estudio:
│   ├── Generado por IA según debilidades
│   ├── Lista de temas prioritarios
│   ├── Recursos por tema
│   ├── Progreso por tema (checkbox/barra)
│   └── Regenerar plan
│
└── Ejercicios:
    ├── Generados por tema
    ├── Resolver ejercicio
    ├── Corrección inmediata
    ├── Feedback
    ├── Dificultad adaptativa
    └── Historial de ejercicios
```

---

## Flujo 5: Pagos Offline

```
Usuario → Suscripción → Mejorar plan
├── Ver planes disponibles
├── Seleccionar plan
├── Pantalla de pago:
│   ├── QR de Yape con monto
│   ├── Número de Yape/Plin
│   ├── Monto exacto: S/XX.00
│   ├── Referencia: AMT-XXXXX
│   └── Instrucciones paso a paso
├── Subir comprobante (foto/screenshot)
├── Estado: "Pago pendiente de verificación"
├── Notificación al admin
│
Admin:
├── Ve pago pendiente en dashboard
├── Revisa comprobante
├── Aprueba → plan activado automáticamente
├── Rechaza → notifica al usuario con motivo
└── Usuario recibe notificación (in-app + email + WhatsApp)
```

---

## Flujo 6: Panel Superadmin

```
Admin → Dashboard:
├── Cards: usuarios totales, exámenes hoy, pagos pendientes
├── Gráfico: correcciones por día (últimos 30 días)
├── Gráfico: registros por semana
├── Lista: pagos pendientes (acceso rápido)
└── Actividad reciente

Admin → Usuarios:
├── Tabla con filtros (rol, plan, estado, fecha)
├── Búsqueda por nombre/email
├── Acciones: ver, editar, activar/desactivar
└── Click → detalle: info + uso + pagos + exámenes

Admin → IA:
├── Proveedores: cards (Gemini, OpenAI, Claude)
│   ├── Estado: activo/inactivo
│   ├── API Key (enmascarada)
│   ├── [Probar conexión]
│   └── [Editar]
├── Modelos por proveedor
│   ├── Modelo, capacidades, default para tarea
│   └── Toggle: corrección / generación / tutor / visión
```

---

## Componentes Compartidos

### Sidebar (responsive)
```
Logo Amautia
─────────────
📊 Dashboard
📚 [Rol-específico items]
🔔 Notificaciones (badge)
─────────────
👤 Mi perfil
💳 Suscripción
🚪 Cerrar sesión
```

### Navbar
```
[☰ Toggle sidebar] [Breadcrumb]          [🔔] [Avatar ▾]
```

---

## Paleta de Colores Sugerida

```
Primary:    #6366F1 (Indigo) - Profesional y educativo
Secondary:  #8B5CF6 (Violet) - Acentos
Success:    #10B981 (Emerald)
Warning:    #F59E0B (Amber)
Error:      #EF4444 (Red)
Background: #F8FAFC (Slate-50)
Sidebar:    #1E1B4B (Indigo-950) - Dark sidebar
Text:       #1E293B (Slate-800)
```

Nombre "Amautia" viene de "Amauta" (sabio/maestro en quechua) - la identidad visual debe reflejar sabiduría, educación y tecnología moderna.
