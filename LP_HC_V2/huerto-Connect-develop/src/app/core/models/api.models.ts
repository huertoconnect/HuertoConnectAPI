// ============================================================
// MODELOS - Auth Service
// Basado en el código fuente de HuertoConnect_API/auth-service
// ============================================================

// ---- Roles ----
export type UserRole = 'Admin' | 'Usuario' | 'Tecnico';
export type AuthProvider = 'email' | 'google';
export type UserEstado = 'Activo' | 'Inactivo' | 'Suspendido';

// ---- Responses de Challenge (Login paso 1 / Register paso 1) ----
export interface ChallengeResponse {
  message: string;
  challengeId: string;
  expiresAt: string;
  maskedEmail: string;
  devOtpCode?: string; // Solo en modo desarrollo
}

// ---- Response de Autenticación exitosa ----
export interface AuthTokenResponse {
  message: string;
  token?: string;
  expiresAt?: string;
  userId?: string;
  isNewUser?: boolean; // Solo en Google Auth
  resetToken?: string; // Para flujo de recuperación de contraseña
}

// ---- Usuario en sesión (GET /auth/session) ----
export interface SessionUser {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  role: UserRole;
  estado: UserEstado;
  email_verificado: boolean;
  profile_picture: string | null;
  auth_provider: AuthProvider;
}

// ---- Sesión activa individual ----
export interface SessionInfo {
  id: string;
  ip: string | null;
  user_agent: string | null;
  dispositivo: string;
  createdAt: string | null;
  ultimaActividad: string | null;
  isCurrent: boolean;
}

// ============================================================
// MODELOS - Huertos Service
// ============================================================

// ---- Huerto ----
export interface Huerto {
  id: string;
  nombre: string;
  usuario_id: string;
  municipio: string;
  region_id: string | null;
  estado: 'Optimo' | 'Alerta' | 'Critico';
  salud: number; // 0-100
  created_at: string | null;
}

export interface HuertoCreate {
  nombre: string;
  municipio: string;
  region_id?: string | null;
  estado?: string;
  salud?: number;
}

export interface HuertoUpdate {
  nombre?: string;
  municipio?: string;
  region_id?: string | null;
  estado?: string;
  salud?: number;
}

// ---- Cultivo ----
export interface Cultivo {
  id: string;
  nombre: string;
  tipo?: string;
  descripcion?: string;
  temporada?: string;
  imagen_url?: string | null;
  created_at?: string | null;
}

export interface CultivoCreate {
  nombre: string;
  tipo?: string;
  descripcion?: string;
  temporada?: string;
}

// ---- Siembra (Cultivo en Huerto) ----
export interface Siembra {
  id: string;
  huerto_id: string;
  cultivo_id: string;
  fecha_siembra?: string;
  estado?: string;
  notas?: string;
}

export interface SiembraCreate {
  huerto_id: string;
  cultivo_id: string;
  fecha_siembra?: string;
  notas?: string;
}

// ---- Región ----
export interface Region {
  id: string;
  nombre: string;
  descripcion?: string;
  clima?: string;
  departamento?: string;
  created_at?: string | null;
}

export interface RegionCreate {
  nombre: string;
  descripcion?: string;
  clima?: string;
  departamento?: string;
}

// ---- Usuario (Admin view) ----
export interface UsuarioAdmin {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  rol: UserRole;
  estado: UserEstado;
  email_verificado: boolean;
  region_id: string | null;
  ultima_actividad: string | null;
  created_at: string | null;
}

// ---- Notificación ----
export interface Notificacion {
  id: string;
  usuario_id: string;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'alerta' | 'error' | 'exito' | 'warning';
  leida: boolean;
  referencia_id?: string | null;
  referencia_tipo?: string | null;
  fecha: string | null;
}

export interface NotificacionesResumen {
  total: number;
  no_leidas: number;
  leidas: number;
  por_tipo: Record<string, number>;
}

// ============================================================
// MODELOS - Plagas / IA Service
// ============================================================

export interface Plaga {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo?: string;
  cultivos_afectados?: string[];
  tratamiento?: string;
  imagen_url?: string | null;
  created_at?: string | null;
}

export interface PlagaCreate {
  nombre: string;
  descripcion?: string;
  tipo?: string;
  cultivos_afectados?: string[];
  tratamiento?: string;
}

export interface Alerta {
  id: string;
  huerto_id: string;
  tipo: string;
  mensaje: string;
  severidad: 'baja' | 'media' | 'alta' | 'critica';
  resuelta: boolean;
  created_at: string | null;
}

export interface Prediccion {
  id: string;
  huerto_id?: string;
  cultivo_id?: string;
  plaga_id?: string;
  probabilidad: number;
  recomendacion?: string;
  fecha: string | null;
}

export interface ModeloIA {
  id: string;
  nombre: string;
  version?: string;
  precision?: number;
  estado: 'activo' | 'entrenando' | 'deprecado';
  created_at?: string | null;
}

// ============================================================
// MODELOS - Chatbot Service
// ============================================================

export interface ChatMensaje {
  id?: string;
  rol: 'user' | 'assistant';
  contenido: string;
  timestamp?: string;
}

export interface ChatConversacion {
  id: string;
  usuario_id: string;
  mensajes?: ChatMensaje[];
  creada_at?: string;
  actualizada_at?: string;
}

export interface ChatbotSendRequest {
  mensaje: string;
  chat_id?: string;
}

export interface ChatbotSendResponse {
  respuesta: string;
  chat_id: string;
  timestamp?: string;
}

// ============================================================
// MODELOS - Reportes / Auditoría
// ============================================================

export interface Reporte {
  id: string;
  tipo: string;
  descripcion?: string;
  datos?: Record<string, unknown>;
  generado_por?: string;
  created_at: string | null;
}

export interface AuditoriaLog {
  id: string;
  usuario_id?: string;
  accion: string;
  recurso: string;
  detalles?: Record<string, unknown>;
  ip?: string;
  timestamp: string | null;
}

// ============================================================
// MODELOS - Utilidades Comunes
// ============================================================

export interface MessageResponse {
  message: string;
}

export interface ApiError {
  detail: string;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}
