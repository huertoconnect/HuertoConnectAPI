import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Cultivo,
  CultivoCreate,
  Siembra,
  SiembraCreate,
  MessageResponse,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CultivosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/cultivos`;

  /** Lista el catálogo de cultivos disponibles. */
  list(): Observable<Cultivo[]> {
    return this.http.get<Cultivo[]>(this.base);
  }

  /** Crea un cultivo nuevo (Admin/Tecnico). */
  create(body: CultivoCreate): Observable<Cultivo> {
    return this.http.post<Cultivo>(this.base, body);
  }

  /** Actualiza un cultivo (Admin/Tecnico). */
  update(id: string, body: Partial<CultivoCreate>): Observable<Cultivo> {
    return this.http.put<Cultivo>(`${this.base}/${id}`, body);
  }

  /** Elimina un cultivo (Admin). */
  delete(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.base}/${id}`);
  }

  /** Registra la siembra de un cultivo en un huerto. */
  createSiembra(body: SiembraCreate): Observable<Siembra> {
    return this.http.post<Siembra>(`${this.base}/siembras`, body);
  }

  /** Obtiene las siembras activas de un huerto. */
  getSiembrasByHuerto(huertoId: string): Observable<Siembra[]> {
    return this.http.get<Siembra[]>(`${this.base}/siembras/${huertoId}`);
  }
}
