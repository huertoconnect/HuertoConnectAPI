import {
  HttpRequest,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';

const AUTH_SESSION_STORAGE_KEY = 'huerto-auth-session';

function toPathname(url: string): string {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url;
  }
}

function isPublicAuthFlowRequest(url: string): boolean {
  const pathname = toPathname(url);
  return (
    pathname.endsWith('/api/auth/login') ||
    pathname.endsWith('/api/auth/register') ||
    pathname.endsWith('/api/auth/verify-otp') ||
    pathname.endsWith('/api/auth/resend-otp') ||
    pathname.endsWith('/api/auth/forgot-password') ||
    pathname.endsWith('/api/auth/reset-password') ||
    pathname.endsWith('/api/auth/google')
  );
}

function isAuthSessionValidationRequest(url: string): boolean {
  return toPathname(url).endsWith('/api/auth/session');
}

function getToken(): string | null {
  try {
    const raw = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.token ?? null;
  } catch {
    return null;
  }
}

/**
 * Interceptor JWT — inyecta el Bearer token en cada petición.
 * Solo aplica a llamadas que comienzan con '/api'.
 */
export const jwtInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const token = getToken();

  // Inyectar token si existe y la llamada es a la API
  if (token && request.url.includes('/api')) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // No romper el flujo login/registro/OTP con redirecciones globales.
        if (isPublicAuthFlowRequest(request.url)) {
          const apiMessage =
            error.error?.detail || error.message || 'Error desconocido';
          return throwError(() => ({ ...error, apiMessage }));
        }

        // Solo cerrar sesión cuando falla la validación de sesión del auth-service.
        if (token && isAuthSessionValidationRequest(request.url)) {
          authService.logoutLocal('session_expired');
        }
      }

      if (error.status === 403) {
        // Solo cerrar sesión en endpoint canónico de sesión.
        if (token && isAuthSessionValidationRequest(request.url)) {
          authService.logoutLocal('access_denied');
        }
      }

      // Extraer mensaje de error de la API (formato FastAPI: { detail: string })
      const apiMessage =
        error.error?.detail || error.message || 'Error desconocido';
      return throwError(() => ({ ...error, apiMessage }));
    })
  );
};
