import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Region,
  RegionCreate,
  MessageResponse,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class RegionesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/regiones`;

  list(): Observable<Region[]> {
    return this.http.get<Region[]>(this.base);
  }

  get(id: string): Observable<Region> {
    return this.http.get<Region>(`${this.base}/${id}`);
  }

  /** Obtiene los plantíos (siembras) de una región. */
  getPlantios(id: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/${id}/plantios`);
  }

  create(body: RegionCreate): Observable<Region> {
    return this.http.post<Region>(this.base, body);
  }

  update(id: string, body: Partial<RegionCreate>): Observable<Region> {
    return this.http.put<Region>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.base}/${id}`);
  }
}
