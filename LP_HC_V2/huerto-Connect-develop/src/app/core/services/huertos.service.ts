import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Huerto,
  HuertoCreate,
  HuertoUpdate,
  MessageResponse,
  PaginationParams,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class HuertosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/huertos`;

  /**
   * Lista huertos.
   * - Usuario: solo ve sus propios huertos.
   * - Admin/Tecnico: ve todos.
   */
  list(params?: PaginationParams & { region_id?: string; estado?: string }): Observable<Huerto[]> {
    let httpParams = new HttpParams();
    if (params?.skip != null) httpParams = httpParams.set('skip', params.skip);
    if (params?.limit != null) httpParams = httpParams.set('limit', params.limit);
    if (params?.region_id) httpParams = httpParams.set('region_id', params.region_id);
    if (params?.estado) httpParams = httpParams.set('estado', params.estado);
    return this.http.get<Huerto[]>(this.base, { params: httpParams });
  }

  get(id: string): Observable<Huerto> {
    return this.http.get<Huerto>(`${this.base}/${id}`);
  }

  create(body: HuertoCreate): Observable<Huerto> {
    return this.http.post<Huerto>(this.base, body);
  }

  update(id: string, body: HuertoUpdate): Observable<Huerto> {
    return this.http.put<Huerto>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.base}/${id}`);
  }
}
