import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Plaga,
  PlagaCreate,
  Alerta,
  Prediccion,
  ModeloIA,
  MessageResponse,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PlagasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api`;

  // ---- Plagas (catálogo) ----

  list(): Observable<Plaga[]> {
    return this.http.get<Plaga[]>(`${this.base}/plagas`);
  }

  create(body: PlagaCreate): Observable<Plaga> {
    return this.http.post<Plaga>(`${this.base}/plagas`, body);
  }

  update(id: string, body: Partial<PlagaCreate>): Observable<Plaga> {
    return this.http.put<Plaga>(`${this.base}/plagas/${id}`, body);
  }

  delete(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.base}/plagas/${id}`);
  }

  // ---- Alertas ----

  getAlertas(params?: { huerto_id?: string; resuelta?: boolean }): Observable<Alerta[]> {
    let httpParams = new HttpParams();
    if (params?.huerto_id) httpParams = httpParams.set('huerto_id', params.huerto_id);
    if (params?.resuelta != null) httpParams = httpParams.set('resuelta', String(params.resuelta));
    return this.http.get<Alerta[]>(`${this.base}/alertas`, { params: httpParams });
  }

  // ---- Predicciones de IA ----

  getPredicciones(params?: { huerto_id?: string; cultivo_id?: string }): Observable<Prediccion[]> {
    let httpParams = new HttpParams();
    if (params?.huerto_id) httpParams = httpParams.set('huerto_id', params.huerto_id);
    if (params?.cultivo_id) httpParams = httpParams.set('cultivo_id', params.cultivo_id);
    return this.http.get<Prediccion[]>(`${this.base}/predicciones`, { params: httpParams });
  }

  // ---- Modelos de IA ----

  getModelos(): Observable<ModeloIA[]> {
    return this.http.get<ModeloIA[]>(`${this.base}/modelos`);
  }
}
