import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reporte, AuditoriaLog } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api`;

  getReportes(params?: { skip?: number; limit?: number }): Observable<Reporte[]> {
    let httpParams = new HttpParams();
    if (params?.skip != null) httpParams = httpParams.set('skip', params.skip);
    if (params?.limit != null) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<Reporte[]>(`${this.base}/reportes/`, { params: httpParams });
  }

  getAuditoria(params?: { skip?: number; limit?: number }): Observable<AuditoriaLog[]> {
    let httpParams = new HttpParams();
    if (params?.skip != null) httpParams = httpParams.set('skip', params.skip);
    if (params?.limit != null) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<AuditoriaLog[]>(`${this.base}/auditoria/`, { params: httpParams });
  }
}
