import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of, switchMap, map } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import {
  ChallengeResponse,
  AuthTokenResponse,
  SessionUser,
  SessionInfo,
  MessageResponse,
} from '../../models/api.models';

// ---- Tipos exportados (compatibilidad con componentes existentes) ----

/**
 * Rol del usuario en formato usado por el frontend existente.
 * El backend devuelve 'Admin', 'Usuario', 'Tecnico'.
 * Los componentes usan 'admin', 'manager', 'user'.
 */
export type UserRole = 'admin' | 'manager' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profile_picture: string | null;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  userId?: string;  // opcional para compatibilidad con código existente
  user: AuthUser;
}

// ---- Payloads de entrada ----

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyOtpPayload {
  challengeId: string;
  otpCode: string;
}

export interface ResendOtpPayload {
  challengeId: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
}

export interface GoogleAuthPayload {
  credential: string;
}

// Re-export para compatibilidad
export type { ChallengeResponse as SendOtpResponse };

export interface MeResponse {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  role: string;
  profile_picture: string | null;
  auth_provider: string;
}

export interface VerifyOtpResponse {
  message: string;
  token: string;
  expiresAt: string;
  userId: string;
  session?: AuthSession;
  resetToken?: string;
}

export interface ResendOtpResponse {
  message: string;
  challengeId: string;
  expiresAt: string;
  maskedEmail: string;
  devOtpCode?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  challengeId: string;
  expiresAt: string;
  maskedEmail: string;
  devOtpCode?: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export type LoginRedirectReason = 'session_expired' | 'access_denied';

// ---- Constants ----
const SESSION_KEY = 'huerto-auth-session';

// ---- Mapeo de roles backend → frontend ----
function mapRole(apiRole: string): UserRole {
  switch (apiRole?.toLowerCase()) {
    case 'admin': return 'admin';
    case 'tecnico': return 'manager';
    default: return 'user';
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = `${environment.apiUrl}/api/auth`;

  private readonly _user$ = new BehaviorSubject<AuthUser | null>(
    this._loadUser()
  );

  /** Observable con el usuario actual (reactivo). */
  readonly currentUser$ = this._user$.asObservable();
  readonly user$ = this._user$.asObservable();

  // ----------------------------------------------------------------
  // Flujo OTP — Login
  // POST /api/auth/login → ChallengeResponse (challengeId + maskedEmail)
  // ----------------------------------------------------------------

  /**
   * Paso 1 Login: valida credenciales y envía OTP al correo.
   * Responde ChallengeResponse con challengeId para el paso 2.
   */
  login(payload: LoginPayload): Observable<ChallengeResponse> {
    return this.http.post<ChallengeResponse>(`${this.base}/login`, payload);
  }

  /**
   * @deprecated Alias de login() para compatibilidad con componentes existentes.
   * El método correcto en la nueva API es login().
   */
  requestOtp(payload: LoginPayload): Observable<ChallengeResponse> {
    return this.login(payload);
  }

  // ----------------------------------------------------------------
  // Flujo OTP — Registro
  // POST /api/auth/register → ChallengeResponse
  // ----------------------------------------------------------------

  register(payload: Omit<RegisterPayload, 'confirmPassword'> & { confirmPassword?: string }): Observable<ChallengeResponse> {
    const body = {
      nombre: payload.nombre,
      apellidos: payload.apellidos ?? '',
      email: payload.email,
      password: payload.password,
      confirmPassword: payload.confirmPassword ?? payload.password,
    };
    return this.http.post<ChallengeResponse>(`${this.base}/register`, body);
  }

  // ----------------------------------------------------------------
  // Verificar OTP — paso 2 común
  // POST /api/auth/verify-otp → AuthTokenResponse (token + userId)
  // ----------------------------------------------------------------

  verifyOtp(payload: VerifyOtpPayload): Observable<VerifyOtpResponse> {
    return this.http
      .post<AuthTokenResponse>(`${this.base}/verify-otp`, payload)
      .pipe(
        tap((res) => {
          if (res.token) {
            this._persistToken(res);
          }
        }),
        switchMap((tokenRes) => {
          if (tokenRes.resetToken || !tokenRes.token) {
            return of(tokenRes as unknown as VerifyOtpResponse);
          }
          return this.getSession().pipe(
            map((sessionUser) => {
              const authUser = this._sessionUserToAuthUser(sessionUser);
              return {
                message: tokenRes.message,
                token: tokenRes.token,
                expiresAt: tokenRes.expiresAt,
                userId: tokenRes.userId,
                session: {
                  token: tokenRes.token,
                  expiresAt: tokenRes.expiresAt,
                  user: authUser,
                },
              } as VerifyOtpResponse;
            })
          );
        })
      );
  }

  /** Reenvía el OTP (máx. 3 veces por challenge). */
  resendOtp(payload: ResendOtpPayload): Observable<ResendOtpResponse> {
    return this.http.post<ResendOtpResponse>(`${this.base}/resend-otp`, payload);
  }

  // ----------------------------------------------------------------
  // Google SSO
  // POST /api/auth/google → AuthTokenResponse (sin OTP)
  // El campo que acepta la API es 'credential', NO 'idToken'
  // ----------------------------------------------------------------

  googleAuth(credential: string): Observable<VerifyOtpResponse> {
    return this.http
      .post<AuthTokenResponse>(`${this.base}/google`, { credential })
      .pipe(
        tap((res) => this._persistToken(res)),
        switchMap((tokenRes) =>
          this.getSession().pipe(
            map((sessionUser) => {
              const authUser = this._sessionUserToAuthUser(sessionUser);
              return {
                message: tokenRes.message,
                token: tokenRes.token,
                expiresAt: tokenRes.expiresAt,
                userId: tokenRes.userId,
                session: {
                  token: tokenRes.token,
                  expiresAt: tokenRes.expiresAt,
                  user: authUser,
                },
              } as VerifyOtpResponse;
            })
          )
        )
      );
  }

  // ----------------------------------------------------------------
  // Recuperación de contraseña
  // ----------------------------------------------------------------

  forgotPassword(payload: ForgotPasswordPayload): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(
      `${this.base}/forgot-password`,
      payload
    );
  }

  resetPassword(payload: ResetPasswordPayload): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(
      `${this.base}/reset-password`,
      payload
    );
  }

  // ----------------------------------------------------------------
  // Perfil e info del usuario actual
  // GET /api/auth/session → SessionUser
  // ----------------------------------------------------------------

  /**
   * Valida el JWT activo y retorna los datos del usuario en sesión.
   * Úsalo en los guards y layouts para hidratar el usuario.
   */
  getSession(): Observable<SessionUser> {
    return this.http.get<SessionUser>(`${this.base}/session`).pipe(
      tap((u) => {
        const authUser = this._sessionUserToAuthUser(u);
        this._user$.next(authUser);
        this._updateStoredUser(authUser);
      })
    );
  }

  /**
   * @deprecated Renombrado a getSession(). Mantenido por compatibilidad.
   * Con la nueva API, GET /auth/me → /auth/session.
   */
  getMe(): Observable<SessionUser> {
    return this.getSession();
  }

  listSessions(): Observable<SessionInfo[]> {
    return this.http.get<SessionInfo[]>(`${this.base}/sesiones`);
  }

  revokeSession(sessionId: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.base}/sesiones/${sessionId}`);
  }

  revokeAllSessions(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/sesiones/revoke-all`, {});
  }

  logout(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/logout`, {}).pipe(
      tap(() => this._clearSession())
    );
  }

  logoutLocal(reason?: LoginRedirectReason): void {
    this._clearSession();
    void this.router.navigate(['/login'], {
      queryParams: reason ? { reason } : {},
      replaceUrl: true,
    });
  }

  // ----------------------------------------------------------------
  // Estado local
  // ----------------------------------------------------------------

  isAuthenticated(): boolean {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    try {
      const s: AuthSession = JSON.parse(raw);
      return !!s.token && Date.now() < Date.parse(s.expiresAt);
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return (JSON.parse(raw) as AuthSession).token ?? null;
    } catch {
      return null;
    }
  }

  /** Retorna el rol del usuario actual mapeado al formato del frontend. */
  getUserRole(): UserRole | null {
    return this._user$.value?.role ?? null;
  }

  get currentUser(): AuthUser | null {
    return this._user$.value;
  }

  getCurrentUser(): AuthUser | null {
    return this._user$.value;
  }

  /** Permite establecer la sesión manualmente (compatibilidad con Google SSO). */
  setSession(session: AuthSession): void {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this._user$.next(session.user);
  }

  // ----------------------------------------------------------------
  // Helpers privados
  // ----------------------------------------------------------------

  private _sessionUserToAuthUser(u: SessionUser): AuthUser {
    return {
      id: u.id,
      email: u.email,
      name: `${u.nombre} ${u.apellidos}`.trim(),
      role: mapRole(u.role),
      profile_picture: u.profile_picture ?? null,
    };
  }

  private _persistToken(res: AuthTokenResponse): void {
    const existing = this._loadSession();
    const session: AuthSession = {
      token: res.token!,
      expiresAt: res.expiresAt!,
      userId: res.userId,
      user: existing?.user ?? { id: res.userId!, email: '', name: '', role: 'user', profile_picture: null },
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  private _updateStoredUser(user: AuthUser): void {
    const session = this._loadSession();
    if (session) {
      session.user = user;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  }

  private _loadSession(): AuthSession | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  private _clearSession(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this._user$.next(null);
  }

  private _loadUser(): AuthUser | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s: AuthSession = JSON.parse(raw);
      if (!s.token || Date.now() >= Date.parse(s.expiresAt)) return null;
      return s.user ?? null;
    } catch {
      return null;
    }
  }
}
