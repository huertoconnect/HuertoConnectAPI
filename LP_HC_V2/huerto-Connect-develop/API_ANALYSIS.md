# 🌿 Huerto Connect — API y Base de Datos (Actualizado)

> Documento maestro para alinear **frontend (login + dashboard)**, **API actual (`D:\huerto-connect-api`)** y el diseño de **base de datos PostgreSQL**.

---

## 📋 Índice

1. [API actual implementada](#1-api-actual-implementada)
2. [Flujos de trabajo reales](#2-flujos-de-trabajo-reales)
3. [Base de datos — 18 tablas](#3-base-de-datos--18-tablas)
4. [Diagrama ER (núcleo)](#4-diagrama-er-nucleo)
5. [Endpoints (implementados y por construir)](#5-endpoints-implementados-y-por-construir)
6. [Modelos y validaciones (login + dashboard)](#6-modelos-y-validaciones-login--dashboard)
7. [Stack, migración y checklist de implementación](#7-stack-migracion-y-checklist-de-implementacion)
8. [Mapeo Frontend → DB → API](#8-mapeo-frontend--db--api)

---

## 1. API actual implementada

La API de autenticación que ya corre en `D:\huerto-connect-api` usa:

- **Express.js 5 (CommonJS)**
- **Crypto nativo**:
  - `scrypt` para contraseñas
  - `HMAC-SHA256` para OTP
  - comparación segura (`timingSafeEqual`)
- **Nodemailer + plantilla HTML CID** para email OTP
- **Almacenamiento en memoria (`Map`)** para usuarios/sesiones/challenges/tokens (temporal)

### 1.1 Endpoints reales hoy

| Método | Ruta | Estado | Qué hace |
|---|---|---|---|
| `POST` | `/api/auth/send-otp` | ✅ | Login fase 1: valida email+password y envía OTP |
| `POST` | `/api/auth/register` | ✅ | Registro fase 1: valida datos y envía OTP |
| `POST` | `/api/auth/verify-otp` | ✅ | Verifica OTP para 3 tipos: `login`, `registro`, `reset-password` |
| `POST` | `/api/auth/resend-otp` | ✅ | Reenvía OTP del challenge activo (máx 3) |
| `POST` | `/api/auth/forgot-password` | ✅ | Inicia recuperación por correo y genera challenge OTP de reset |
| `POST` | `/api/auth/reset-password` | ✅ | Cambia contraseña con `resetToken` (o `token` por compatibilidad) |
| `GET` | `/api/auth/session` | ✅ | Valida token de sesión |
| `POST` | `/api/auth/logout` | ✅ | Revoca sesión |
| `GET` | `/api/health` | ✅ | Health check |

### 1.2 Contratos importantes (alineados al frontend)

#### `POST /api/auth/verify-otp`
Puede responder de 3 formas según tipo:

1. **Login OTP válido**
- `200` `{ message, session, user }`

2. **Registro OTP válido**
- `201` `{ message, session, user }` (crea usuario y sesión)

3. **Reset OTP válido**
- `200` `{ message, resetToken }`

#### `POST /api/auth/reset-password`
- Request: `{ resetToken, newPassword }`
- Compatibilidad: también acepta `{ token, newPassword }`
- Response: `200 { message }`

#### `POST /api/auth/forgot-password`
- Request: `{ email }`
- Response normal: `{ message, challengeId, expiresAt, maskedEmail, devOtpCode? }`
- Si email no existe: **no revela existencia**; responde `200` con mensaje genérico.

---

## 2. Flujos de trabajo reales

### 2.1 Login con OTP (actual)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend (/login)
    participant A as API Auth
    participant M as Mailer

    U->>F: email + password
    F->>A: POST /auth/send-otp
    A->>A: valida credenciales
    A->>A: crea challenge tipo login
    A->>M: envía OTP
    A-->>F: challengeId + expiresAt + maskedEmail

    U->>F: captura OTP (6 dígitos)
    F->>A: POST /auth/verify-otp
    A->>A: valida hash OTP + intentos + expiración
    A->>A: crea sesión (8h)
    A-->>F: session + user
    F->>F: guarda sesión y navega a /admin
```

### 2.2 Registro con OTP (actual)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend (/login registro)
    participant A as API Auth
    participant M as Mailer

    U->>F: nombre + apellidos + email + password
    F->>A: POST /auth/register
    A->>A: valida datos / email duplicado
    A->>A: crea challenge tipo registro (pendingUser)
    A->>M: envía OTP
    A-->>F: challengeId + expiresAt

    U->>F: OTP
    F->>A: POST /auth/verify-otp
    A->>A: crea usuario definitivo
    A->>A: crea sesión
    A-->>F: session + user
```

### 2.3 Recuperación de contraseña (actual, OTP + resetToken)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend (/login forgot)
    participant A as API Auth
    participant M as Mailer

    U->>F: email recuperación
    F->>A: POST /auth/forgot-password
    A->>A: busca usuario (respuesta anti-enumeración)
    A->>A: crea challenge tipo reset-password
    A->>M: envía OTP de recuperación
    A-->>F: challengeId + maskedEmail

    U->>F: OTP de recuperación
    F->>A: POST /auth/verify-otp
    A->>A: valida OTP
    A->>A: genera resetToken de un uso
    A-->>F: { resetToken }

    U->>F: nueva contraseña
    F->>A: POST /auth/reset-password
    A->>A: consume token y actualiza password
    A-->>F: mensaje éxito
```

### 2.4 Reenvío de OTP (actual)

- Endpoint único: `POST /api/auth/resend-otp`
- Funciona para challenges de:
  - login
  - registro
  - recuperación de contraseña
- Límite: `MAX_RESENDS = 3`

### 2.5 Sesión y logout (actual)

- `GET /api/auth/session` valida token Bearer y TTL.
- `POST /api/auth/logout` revoca token actual.

### 2.6 Flujo frontend de login (estado real)

El componente `login` maneja estos pasos:

- `credentials` → login fase 1
- `otp` → login fase 2
- `forgot-email` → solicitar recuperación
- `forgot-otp` → validar OTP recuperación
- `forgot-reset` → definir nueva contraseña
- `register` con su propio OTP (`form` / `otp`)

Notas de UX ya integradas:

- En recuperación, al enviar correo pasa directo a pantalla de OTP (estado pendiente).
- Maneja countdown y reenvío para OTP de recuperación.
- Si `verify-otp` devuelve `resetToken`, habilita paso de nueva contraseña.

### 2.7 Necesidades de dashboard para DB

El dashboard admin calcula KPIs con datos de:

- `usuarios` (activos)
- `huertos`
- `plaga_detecciones`
- `alertas` (críticas)
- `chat_conversaciones`
- `regiones`

Por lo tanto, la base debe soportar consultas agregadas eficientes (`COUNT`, filtros, joins).

---

## 3. Base de datos — 18 tablas

### 3.1 Principios de diseño

- Normalizar referencias (región, huerto, cultivo, responsable) con FK.
- No guardar métricas derivadas (counts) como columnas persistidas.
- Modelar autenticación con TTL y revocación explícita.
- Mantener trazabilidad de acciones críticas en auditoría.
- Diseñar índices para consultas de login, dashboard y filtros admin.

### 3.2 Núcleo mínimo para salir a producción (Auth + Dashboard)

Estas tablas cubren lo que ya existe en frontend y API hoy:

1. `usuarios`
2. `otp_challenges`
3. `password_resets`
4. `sesiones`
5. `regiones`
6. `huertos`
7. `plaga_detecciones`
8. `alertas`
9. `chat_conversaciones`
10. `auditoria_logs`

### 3.3 Matriz completa de tablas (actualizada)

| # | Tabla | Dominio | Campos clave | Relación/FK clave | Alimenta | Estado actual |
|---|---|---|---|---|---|---|
| 1 | `usuarios` | Auth | `nombre`, `apellidos`, `email`, `password_hash`, `password_salt`, `rol`, `estado`, `email_verificado` | `region_id -> regiones.id` | Login, registro, dashboard usuarios, perfil admin | Mock + memoria |
| 2 | `otp_challenges` | Auth | `tipo`, `otp_hash`, `verify_attempts`, `resend_count`, `challenge_context_json`, `expires_at` | `usuario_id -> usuarios.id` | `send-otp`, `register`, `forgot-password`, `verify-otp`, `resend-otp` | Memoria |
| 3 | `password_resets` | Auth | `token_hash`, `expires_at`, `used_at`, `source_challenge_id` | `usuario_id -> usuarios.id` | `reset-password` (cambio final) | Memoria |
| 4 | `sesiones` | Auth | `token_hash`, `activa`, `expires_at`, `ultima_actividad`, `ip`, `user_agent`, `dispositivo` | `usuario_id -> usuarios.id` | `session`, `logout`, guard de `/admin` | Memoria |
| 5 | `regiones` | Agrícola | `nombre`, `actividad`, `priorizada` | — | Dashboard y módulo regiones/mapa | Mock |
| 6 | `huertos` | Agrícola | `nombre`, `municipio`, `estado`, `salud` | `usuario_id -> usuarios.id`, `region_id -> regiones.id` | Dashboard, módulo huertos, base de alertas/plagas | Mock |
| 7 | `cultivos` | Agrícola | `nombre`, `temporada`, `dificultad`, `riego`, `fertilizacion`, `activo` | — | Módulo cultivos y relación de siembras | Mock |
| 8 | `huerto_cultivos` | Agrícola | `huerto_id`, `cultivo_id`, `fecha_siembra`, `estado` | `huerto_id -> huertos.id`, `cultivo_id -> cultivos.id` | Conteo `cultivosActivos`, trazabilidad de siembra | Diseño |
| 9 | `plantios` | Agrícola | `nombre`, `municipio`, `lat`, `lng`, `salud`, `severidad` | `huerto_cultivo_id -> huerto_cultivos.id` | Mapa de plantíos en regiones | Mock |
| 10 | `plaga_detecciones` | Sanidad | `imagen_url`, `plaga`, `confianza`, `severidad`, `estado`, `fecha` | `huerto_id -> huertos.id`, `cultivo_id -> cultivos.id` | Dashboard, módulo plagas IA | Mock |
| 11 | `alertas` | Sanidad | `titulo`, `tipo (Plaga/Riego/Sistema)`, `severidad`, `estado`, `fecha`, `resuelta_en` | `huerto_id -> huertos.id`, `responsable_id -> usuarios.id` | Dashboard, módulo alertas | Mock |
| 12 | `chat_conversaciones` | Chatbot | `usuario_id`, `tema`, `ultimo_mensaje`, `estado`, `fecha` | `usuario_id -> usuarios.id` | Dashboard y módulo chatbot | Mock |
| 13 | `chat_mensajes` | Chatbot | `conversacion_id`, `rol`, `contenido`, `fecha` | `conversacion_id -> chat_conversaciones.id` | Historial detallado por conversación | Diseño |
| 14 | `chat_metricas` | Chatbot | `tema`, `total`, `porcentaje`, `updated_at` | — | KPI y tarjetas de uso del chatbot | Mock |
| 15 | `reportes` | Sistema | `nombre`, `tipo`, `estado`, `archivo_url`, `generado_por`, `fecha` | `generado_por -> usuarios.id` | Módulo reportes | Mock |
| 16 | `auditoria_logs` | Sistema | `actor_id`, `accion`, `modulo`, `ip`, `detalle_json`, `fecha` | `actor_id -> usuarios.id` | Auditoría de eventos críticos | Diseño |
| 17 | `contacto_mensajes` | Público | `nombre`, `email`, `telefono`, `mensaje`, `leido`, `fecha` | — | Formulario de contacto landing | Mock |
| 18 | `testimonios_landing` | Público | `nombre`, `email`, `rol`, `ubicacion`, `comentario`, `calificacion`, `avatar_url`, `cover_url`, `aprobado`, `activo`, `created_at` | `usuario_id -> usuarios.id` (nullable) | Carrusel de testimonios y comentarios de usuarios en landing | Diseño |

> `ALERTAS.tipo` queda en `Plaga`, `Riego`, `Sistema`.  
> `Riego` se conserva para recordatorios/agenda manual; **sin IoT** por ahora.

### 3.4 Diseño detallado de Auth (clave)

#### `usuarios`

- `email` único case-insensitive.
- `password_hash` + `password_salt` (derivado de email + pepper).
- `email_verificado`, `estado`, `rol`.
- `deleted_at` para soft-delete.

#### `otp_challenges`

- `tipo` enum: `login`, `registro`, `reset_password`.
- `otp_hash`, `verify_attempts`, `resend_count`, `expires_at`.
- `challenge_context_json` para guardar datos temporales de registro (`nombre`, `apellidos`, `email`, `password_hash`, `password_salt`) antes de crear usuario.

#### `password_resets`

- `token_hash` único (no guardar token en texto plano).
- `usuario_id`.
- `expires_at`, `used_at`.
- opcional: `source_challenge_id` para trazabilidad.

#### `sesiones`

- `token_hash` único.
- `usuario_id`.
- `activa`, `expires_at`, `ultima_actividad`.
- opcional: `ip`, `user_agent`, `dispositivo`.

### 3.5 Índices recomendados (obligatorios)

- `usuarios(email)` unique
- `usuarios(region_id, estado)`
- `otp_challenges(id)` PK
- `otp_challenges(usuario_id, tipo, expires_at)`
- `otp_challenges(expires_at)`
- `password_resets(token_hash)` unique
- `password_resets(usuario_id, expires_at, used_at)`
- `sesiones(token_hash)` unique
- `sesiones(usuario_id, activa, expires_at)`
- `huertos(region_id, estado)`
- `alertas(huerto_id, severidad, estado, fecha)`
- `plaga_detecciones(huerto_id, fecha, severidad, estado)`
- `chat_conversaciones(usuario_id, fecha)`
- `auditoria_logs(actor_id, fecha)`
- `testimonios_landing(aprobado, activo, created_at)`
- `testimonios_landing(usuario_id, created_at)`

### 3.6 Campos calculados (NO persistir)

No guardar como columnas:

- `usuario.huertos`
- `huerto.cultivosActivos`
- `huerto.alertas`
- `region.usuarios`
- `region.huertos`
- `region.detecciones`
- `kpi.*` del dashboard

Se obtienen con `COUNT()` y `JOIN`.

### 3.7 Normalización de textos que hoy vienen “planos” en frontend

| Campo visual frontend | Fuente relacional recomendada |
|---|---|
| `alerta.region` | `alertas.huerto_id -> huertos.region_id -> regiones.nombre` |
| `plaga.ubicacion` | `plaga_detecciones.huerto_id -> huertos.municipio` |
| `plaga.cultivo` | `plaga_detecciones.cultivo_id -> cultivos.nombre` |
| `chat.region` | `chat_conversaciones.usuario_id -> usuarios.region_id -> regiones.nombre` |

### 3.8 Tabla para comentarios/testimonios de la landing

Basado en el componente `testimonials` del frontend (`name`, `role`, `location`, `text`, `rating`, `image`, `cover`), la tabla propuesta es:

| Campo frontend (`Testimonial`) | Columna DB (`testimonios_landing`) | Regla recomendada |
|---|---|---|
| `name` | `nombre` | requerido, 2..100 |
| `role` | `rol` | opcional, 0..100 |
| `location` | `ubicacion` | opcional, 0..100 |
| `text` | `comentario` | requerido, 20..800 |
| `rating` | `calificacion` | requerido, entero 1..5 |
| `image` | `avatar_url` | opcional, URL válida |
| `cover` | `cover_url` | opcional, URL válida |

Campos operativos adicionales para producción:

- `email` (contacto/moderación del autor; no se muestra en el carrusel).
- `usuario_id` nullable (si el comentario viene de un usuario autenticado).
- `aprobado` y `activo` para flujo de moderación antes de publicar.
- `created_at` y `updated_at` para ordenamiento cronológico y auditoría básica.

---

## 4. Diagrama ER (núcleo)

```mermaid
erDiagram
    USUARIOS {
        uuid id PK
        varchar nombre "NOT NULL"
        varchar apellidos
        varchar email UK "NOT NULL"
        varchar password_hash "scrypt + pepper"
        varchar password_salt
        uuid region_id FK "nullable"
        enum rol "Admin - Productor - Tecnico"
        enum estado "Activo - Inactivo - Suspendido - Pendiente"
        boolean email_verificado "default false"
        timestamp ultima_actividad
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    OTP_CHALLENGES {
        uuid id PK "challengeId"
        uuid usuario_id FK "nullable para registro inicial"
        enum tipo "login - registro - reset_password"
        varchar otp_hash
        int verify_attempts "max 5"
        int resend_count "max 3"
        jsonb challenge_context_json "pending user / metadata"
        timestamp expires_at "5 min TTL"
        timestamp created_at
        timestamp updated_at
    }

    PASSWORD_RESETS {
        uuid id PK
        uuid usuario_id FK
        varchar token_hash UK
        uuid source_challenge_id FK "nullable"
        timestamp expires_at
        timestamp used_at "nullable"
        timestamp created_at
    }

    SESIONES {
        uuid id PK
        uuid usuario_id FK
        varchar token_hash UK
        varchar ip
        varchar user_agent
        varchar dispositivo
        boolean activa "default true"
        timestamp ultima_actividad
        timestamp expires_at "8h TTL"
        timestamp created_at
        timestamp revoked_at "nullable"
    }

    REGIONES {
        uuid id PK
        varchar nombre UK
        enum actividad "Alta - Media - Baja"
        boolean priorizada
        timestamp created_at
        timestamp updated_at
    }

    HUERTOS {
        uuid id PK
        varchar nombre
        uuid usuario_id FK
        varchar municipio
        uuid region_id FK
        enum estado "Optimo - Atencion - Critico"
        int salud "0..100"
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    CULTIVOS {
        uuid id PK
        varchar nombre
        varchar temporada
        enum dificultad "Baja - Media - Alta"
        varchar riego
        varchar fertilizacion
        boolean activo
        timestamp created_at
    }

    HUERTO_CULTIVOS {
        uuid id PK
        uuid huerto_id FK
        uuid cultivo_id FK
        date fecha_siembra
        enum estado "Activo - Cosechado - Perdido"
        timestamp created_at
    }

    PLANTIOS {
        uuid id PK
        varchar nombre
        uuid huerto_cultivo_id FK
        varchar municipio
        decimal lat
        decimal lng
        int salud "0..100"
        enum severidad "Baja - Media - Alta"
        timestamp created_at
    }

    PLAGA_DETECCIONES {
        uuid id PK
        varchar imagen_url
        varchar plaga
        decimal confianza "0..100"
        uuid huerto_id FK
        uuid cultivo_id FK
        enum severidad "Baja - Media - Alta"
        enum estado "Pendiente - Confirmada - Descartada"
        timestamp fecha
        timestamp updated_at
    }

    ALERTAS {
        uuid id PK
        varchar titulo
        enum tipo "Plaga - Riego - Sistema"
        enum severidad "Seguro - Advertencia - Critico"
        enum estado "Abierta - En_progreso - Resuelta"
        uuid huerto_id FK
        uuid responsable_id FK
        timestamp fecha
        timestamp resuelta_en
    }

    CHAT_CONVERSACIONES {
        uuid id PK
        uuid usuario_id FK
        varchar tema
        text ultimo_mensaje
        enum estado "Activa - Cerrada"
        timestamp fecha
        timestamp updated_at
    }

    CHAT_MENSAJES {
        uuid id PK
        uuid conversacion_id FK
        enum rol "user - assistant - system"
        text contenido
        timestamp fecha
    }

    CHAT_METRICAS {
        uuid id PK
        varchar tema UK
        int total
        decimal porcentaje
        timestamp updated_at
    }

    REPORTES {
        uuid id PK
        varchar nombre
        varchar tipo
        enum estado "Generado - En_proceso - Error"
        varchar archivo_url
        uuid generado_por FK
        timestamp fecha
    }

    AUDITORIA_LOGS {
        uuid id PK
        uuid actor_id FK
        varchar accion
        varchar modulo
        varchar ip
        text detalle_json
        timestamp fecha
    }

    CONTACTO_MENSAJES {
        uuid id PK
        varchar nombre
        varchar email
        varchar telefono
        text mensaje
        boolean leido
        timestamp fecha
    }

    TESTIMONIOS_LANDING {
        uuid id PK
        uuid usuario_id FK "nullable"
        varchar nombre
        varchar email "nullable"
        varchar rol "nullable"
        varchar ubicacion "nullable"
        text comentario
        int calificacion "1..5"
        varchar avatar_url "nullable"
        varchar cover_url "nullable"
        boolean aprobado "default false"
        boolean activo "default true"
        timestamp created_at
        timestamp updated_at
    }

    USUARIOS ||--o{ OTP_CHALLENGES : tiene
    USUARIOS ||--o{ PASSWORD_RESETS : tiene
    USUARIOS ||--o{ SESIONES : tiene
    USUARIOS ||--o{ HUERTOS : posee
    USUARIOS ||--o{ ALERTAS : responsable
    USUARIOS ||--o{ CHAT_CONVERSACIONES : inicia
    USUARIOS ||--o{ AUDITORIA_LOGS : genera
    USUARIOS ||--o{ REPORTES : genera
    USUARIOS ||--o{ TESTIMONIOS_LANDING : comenta

    REGIONES ||--o{ USUARIOS : agrupa
    REGIONES ||--o{ HUERTOS : contiene

    HUERTOS ||--o{ HUERTO_CULTIVOS : siembra
    CULTIVOS ||--o{ HUERTO_CULTIVOS : cataloga
    HUERTO_CULTIVOS ||--o{ PLANTIOS : geolocaliza

    HUERTOS ||--o{ PLAGA_DETECCIONES : detecta
    CULTIVOS ||--o{ PLAGA_DETECCIONES : afecta
    HUERTOS ||--o{ ALERTAS : genera

    CHAT_CONVERSACIONES ||--o{ CHAT_MENSAJES : contiene
```

> Diagrama completo, en un solo bloque Mermaid, para modelado de la BD final.

---

## 5. Endpoints (implementados y por construir)

### 5.1 Auth (`/api/auth`) — estado real

| Método | Ruta | Estado |
|---|---|---|
| `POST` | `/send-otp` | ✅ |
| `POST` | `/register` | ✅ |
| `POST` | `/verify-otp` | ✅ |
| `POST` | `/resend-otp` | ✅ |
| `POST` | `/forgot-password` | ✅ |
| `POST` | `/reset-password` | ✅ |
| `GET` | `/session` | ✅ |
| `POST` | `/logout` | ✅ |

### 5.2 Auth por agregar (cuando exista DB)

| Método | Ruta | Estado | Motivo |
|---|---|---|---|
| `GET` | `/sesiones` | 🆕 | Vista de sesiones activas en configuración |
| `DELETE` | `/sesiones/:id` | 🆕 | Cerrar sesión específica |
| `POST` | `/sesiones/revoke-all` | 🆕 | Cerrar todas excepto actual |

### 5.3 Dashboard y módulos admin (por construir)

| Módulo | Rutas mínimas |
|---|---|
| Dashboard | `GET /dashboard/kpis`, `GET /dashboard/tendencias` |
| Usuarios | `GET/PUT/PATCH/DELETE /usuarios` |
| Huertos | `GET/POST/PUT/PATCH/DELETE /huertos` |
| Cultivos | `GET/POST/PUT/PATCH/DELETE /cultivos` |
| Regiones | `GET/POST/PUT/PATCH/DELETE /regiones`, `GET /regiones/:id/plantios` |
| Plagas | `GET/POST/PUT/PATCH/DELETE /plagas` |
| Alertas | `GET/POST/PATCH/DELETE /alertas` |
| Chatbot | `GET /chatbot/metricas`, `GET /chatbot/conversaciones`, `POST /chatbot/...` |
| Reportes | `GET/POST/DELETE /reportes`, `GET /reportes/:id/download` |
| Auditoría | `GET /auditoria` |
| Público | `POST /public/contacto`, `GET /public/testimonios`, `POST /public/testimonios`, `GET /public/faqs` |

---

## 6. Modelos y validaciones (login + dashboard)

### 6.1 Payloads Auth (frontend actual)

#### Login
- Request: `{ email, password }`
- Validación mínima:
  - email válido
  - password >= 6

#### Registro
- Request: `{ nombre, apellidos, email, password }`
- Validación mínima:
  - nombre requerido
  - email válido y único
  - password >= 6

#### Verificar OTP
- Request: `{ challengeId, otpCode }`
- `otpCode`: numérico de 6 dígitos

#### Recuperación
- Request inicial: `{ email }`
- Verify OTP recovery: `POST /verify-otp`
- Cambio final: `{ resetToken, newPassword }`

### 6.2 Modelos dashboard (frontend actual)

Campos principales (según interfaces actuales):

- `Usuario`: nombre, correo, región, rol, estado, huertos, ultimaActividad
- `Huerto`: nombre, usuario, municipio, región, cultivosActivos, estado, salud, alertas
- `Region`: nombre, usuarios, huertos, detecciones, actividad
- `PlagaDeteccion`: imagenUrl, plaga, confianza, cultivo, ubicacion, fecha, severidad, estado
- `Alerta`: titulo, tipo (`Plaga`/`Riego`/`Sistema`), severidad, estado, region, fecha, responsable
- `TestimonioLanding`: nombre, email?, rol?, ubicacion?, comentario, calificacion, avatarUrl?, coverUrl?, aprobado, activo

### 6.3 Validaciones de negocio sugeridas para API con DB

- No permitir `verify-otp` si challenge expirado o superó intentos.
- En `reset-password`, invalidar token después de uso.
- En `public/testimonios`, permitir publicar solo si `calificacion` está entre 1 y 5 y `comentario` cumple longitud mínima.
- Mostrar en landing solo testimonios con `aprobado = true` y `activo = true`.
- Registrar auditoría en eventos críticos:
  - login
  - logout
  - register
  - reset password
  - cambios de estado en usuarios/alertas/plagas

---

## 7. Stack, migración y checklist de implementación

### 7.1 Estado actual vs objetivo

| Componente | Estado actual | Objetivo |
|---|---|---|
| Auth OTP + recuperación | ✅ en memoria | ✅ persistido en PostgreSQL |
| Plantilla email (login/registro/reset) | ✅ | ✅ |
| Dashboard admin | ✅ frontend mock | ✅ backend con DB |
| CRUD módulos admin | 🆕 | ✅ |

### 7.2 Migración recomendada (fases)

1. **Fase Auth DB**
- Crear tablas `usuarios`, `otp_challenges`, `password_resets`, `sesiones`, `auditoria_logs`
- Migrar `Map()` a repositorios SQL
- Mantener contrato API sin romper frontend

2. **Fase Dashboard DB**
- Crear `regiones`, `huertos`, `plaga_detecciones`, `alertas`, `chat_conversaciones`
- Implementar `GET /dashboard/kpis`

3. **Fase CRUD completo**
- Habilitar endpoints admin por módulo
- Paginación, filtros, soft-delete, auditoría
- Añadir moderación de `testimonios_landing` (aprobar/rechazar/ocultar) y alta pública por landing

### 7.3 Checklist técnico para BD

- [ ] Definir migraciones SQL iniciales
- [ ] Seeds para usuarios demo con hashes reales
- [ ] Índices de auth y dashboard (sección 3.4)
- [ ] Transacciones en flujos críticos (`verify-otp`, `reset-password`)
- [ ] `token_hash` y `otp_hash` con comparación segura
- [ ] Cleanup job para expirados (`otp_challenges`, `password_resets`, `sesiones`)
- [ ] Auditoría de eventos críticos

### 7.4 Variables de entorno necesarias

```env
API_PORT=3000
FRONTEND_URL=http://localhost:4200
FRONTEND_ORIGIN=http://localhost:4200

OTP_DELIVERY_MODE=smtp
OTP_EXPOSE_CODE_IN_RESPONSE=false

OTP_EMAIL_HOST=smtp.gmail.com
OTP_EMAIL_PORT=465
OTP_EMAIL_SECURE=true
OTP_EMAIL_USER=huertoconnect@gmail.com
OTP_EMAIL_APP_PASSWORD=***

OTP_HASH_SECRET=***
AUTH_PASSWORD_PEPPER=***

DATABASE_URL=postgresql://user:pass@localhost:5432/huerto_connect
```

---

## 8. Mapeo Frontend → DB → API

| Frontend | DB principal | Endpoint |
|---|---|---|
| Login (`credentials` → `otp`) | `usuarios`, `otp_challenges`, `sesiones` | `POST /auth/send-otp`, `POST /auth/verify-otp` |
| Registro (`form` → `otp`) | `otp_challenges`, `usuarios`, `sesiones` | `POST /auth/register`, `POST /auth/verify-otp` |
| Recuperación (`forgot-email` → `forgot-otp` → `forgot-reset`) | `otp_challenges`, `password_resets`, `usuarios` | `POST /auth/forgot-password`, `POST /auth/verify-otp`, `POST /auth/reset-password` |
| Reenvío OTP | `otp_challenges` | `POST /auth/resend-otp` |
| Sesión activa en admin | `sesiones`, `usuarios` | `GET /auth/session` |
| Logout | `sesiones` | `POST /auth/logout` |
| KPI dashboard | `usuarios`, `huertos`, `plaga_detecciones`, `alertas`, `chat_conversaciones`, `regiones` | `GET /dashboard/kpis` |
| Usuarios admin | `usuarios` | `GET/PUT/PATCH/DELETE /usuarios` |
| Huertos/Cultivos | `huertos`, `cultivos`, `huerto_cultivos` | `GET/POST/PUT/...` |
| Regiones/Mapa | `regiones`, `plantios` | `GET /regiones`, `GET /regiones/:id/plantios` |
| Plagas/Alertas | `plaga_detecciones`, `alertas` | `GET/POST/PATCH/...` |
| Chatbot | `chat_conversaciones`, `chat_mensajes`, `chat_metricas` | `GET/POST /chatbot/...` |
| Reportes | `reportes` | `GET/POST /reportes` |
| Auditoría | `auditoria_logs` | `GET /auditoria` |
| Testimonios landing (lectura) | `testimonios_landing` | `GET /public/testimonios` |
| Comentarios landing (envío usuario) | `testimonios_landing` | `POST /public/testimonios` |
| Contacto landing | `contacto_mensajes` | `POST /public/contacto` |

---

> Actualizado al estado real de código (frontend + API) al **2026-03-08**.
> Este archivo ya refleja el flujo nuevo de login/recuperación, dashboard, módulos admin y la tabla nueva para comentarios/testimonios de landing.
