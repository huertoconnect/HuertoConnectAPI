import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  UsuarioAdmin,
  MessageResponse,
  Notificacion,
  NotificacionesResumen,
} from '../models/api.models';

export interface ProfilePictureUpdateResponse {
  message?: string;
  profile_picture?: string | null;
  profile_picture_public_id?: string | null;
  user?: { profile_picture?: string | null } | null;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly usuariosBase = `${environment.apiUrl}/api/usuarios`;
  private readonly notifBase = `${environment.apiUrl}/api/notificaciones`;

  // ---- Admin: gestión de usuarios ----

  /** Lista todos los usuarios (Admin). */
  listAll(params?: { skip?: number; limit?: number; rol?: string; estado?: string }): Observable<UsuarioAdmin[]> {
    let httpParams = new HttpParams();
    if (params?.skip != null) httpParams = httpParams.set('skip', params.skip);
    if (params?.limit != null) httpParams = httpParams.set('limit', params.limit);
    if (params?.rol) httpParams = httpParams.set('rol', params.rol);
    if (params?.estado) httpParams = httpParams.set('estado', params.estado);
    return this.http.get<UsuarioAdmin[]>(this.usuariosBase, { params: httpParams });
  }

  /** Obtiene perfil de usuario (propio o Admin). */
  getById(userId: string): Observable<UsuarioAdmin> {
    return this.http.get<UsuarioAdmin>(`${this.usuariosBase}/${userId}`);
  }

  /** Actualiza perfil de usuario. Rol/Estado solo Admin. */
  update(userId: string, body: Partial<UsuarioAdmin>): Observable<UsuarioAdmin> {
    return this.http.patch<UsuarioAdmin>(`${this.usuariosBase}/${userId}`, body);
  }

  /** Soft-delete de usuario (Admin). */
  delete(userId: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.usuariosBase}/${userId}`);
  }

  /**
   * Actualiza la foto de perfil del usuario.
   * Sube la imagen (JPG/PNG/WebP, máx 5 MB) a Cloudinary vía la API.
   * Usa FormData por ser un upload de archivo.
   */
  updateProfilePicture(userId: string, file: File): Observable<ProfilePictureUpdateResponse> {
    const form = new FormData();
    form.append('foto', file, file.name);
    return this.http.patch(
      `${this.usuariosBase}/${userId}/foto`,
      form,
      { responseType: 'text' }
    ).pipe(
      map((body) => this.parseProfilePictureResponse(body))
    );
  }

  // ---- Notificaciones del usuario actual ----

  /** Lista notificaciones del usuario autenticado. */
  listNotificaciones(params?: { skip?: number; limit?: number; leida?: boolean }): Observable<Notificacion[]> {
    let httpParams = new HttpParams();
    if (params?.skip != null) httpParams = httpParams.set('skip', params.skip);
    if (params?.limit != null) httpParams = httpParams.set('limit', params.limit);
    if (params?.leida != null) httpParams = httpParams.set('leida', String(params.leida));
    return this.http.get<Notificacion[]>(this.notifBase, { params: httpParams });
  }

  /** Obtiene resumen de notificaciones (total, no leídas, leídas y por tipo). */
  getNotificacionesResumen(): Observable<NotificacionesResumen> {
    return this.http.get<NotificacionesResumen>(`${this.notifBase}/resumen`);
  }

  /** Marca una notificación como leída. */
  markNotificacionRead(notifId: string): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(
      `${this.notifBase}/${notifId}/leer`,
      {}
    );
  }

  private parseProfilePictureResponse(body: string): ProfilePictureUpdateResponse {
    if (!body?.trim()) {
      return {};
    }

    try {
      const parsed = JSON.parse(body) as ProfilePictureUpdateResponse;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
}
