import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Alerta } from '../models/alerta.model';

interface ApiAlerta {
  id: string;
  titulo: string;
  tipo: string;
  severidad: string;
  estado: string;
  huerto_id: string;
  responsable_id?: string | null;
  fecha?: string | null;
}

interface ApiMessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AlertasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/alertas`;

  getAlertas(): Observable<Alerta[]> {
    return this.http.get<ApiAlerta[]>(this.base).pipe(
      map((items) => items.map((a) => this.toAlerta(a))),
      catchError(() => of([]))
    );
  }

  createAlerta(data: Partial<Alerta>): Observable<Alerta> {
    const payload = {
      titulo: String(data.titulo ?? '').trim(),
      tipo: data.tipo ?? 'Sistema',
      severidad: data.severidad ?? 'Advertencia',
      huerto_id: String(data.region ?? '').trim(),
      responsable_id: data.responsable ? String(data.responsable).trim() : null,
    };
    return this.http.post<ApiAlerta>(this.base, payload).pipe(
      map((item) => this.toAlerta(item))
    );
  }

  updateAlerta(id: string, changes: Partial<Alerta>): Observable<Alerta> {
    const payload: {
      titulo?: string;
      severidad?: string;
      estado?: string;
      responsable_id?: string | null;
    } = {};

    if (changes.titulo !== undefined) payload.titulo = changes.titulo;
    if (changes.severidad !== undefined) payload.severidad = changes.severidad;
    if (changes.estado !== undefined) payload.estado = changes.estado;
    if (changes.responsable !== undefined) payload.responsable_id = changes.responsable || null;

    return this.http.patch<ApiAlerta>(`${this.base}/${id}`, payload).pipe(
      map((item) => this.toAlerta(item))
    );
  }

  actualizarEstado(id: string, estado: Alerta['estado']): Observable<boolean> {
    return this.http.patch<ApiAlerta>(`${this.base}/${id}`, { estado }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  deleteAlerta(id: string): Observable<boolean> {
    return this.http.delete<ApiMessageResponse>(`${this.base}/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  private toAlerta(a: ApiAlerta): Alerta {
    return {
      id: String(a.id),
      titulo: a.titulo ?? '',
      tipo: this.mapTipo(a.tipo),
      severidad: this.mapSeveridad(a.severidad),
      estado: this.mapEstado(a.estado),
      region: a.huerto_id ?? '',
      fecha: a.fecha ?? '',
      responsable: a.responsable_id ?? '',
    };
  }

  private mapTipo(tipo?: string): 'Plaga' | 'Riego' | 'Sensor' | 'Sistema' {
    if (!tipo) return 'Sistema';
    const lower = tipo.toLowerCase();
    if (lower.includes('plaga')) return 'Plaga';
    if (lower.includes('riego')) return 'Riego';
    if (lower.includes('sensor')) return 'Sensor';
    return 'Sistema';
  }

  private mapSeveridad(sev?: string): 'Seguro' | 'Advertencia' | 'Critico' {
    if (!sev) return 'Seguro';
    const lower = sev.toLowerCase();
    if (lower.includes('crit') || lower.includes('alta')) return 'Critico';
    if (lower.includes('advert') || lower.includes('media')) return 'Advertencia';
    return 'Seguro';
  }

  private mapEstado(estado?: string): 'Abierta' | 'En progreso' | 'Resuelta' {
    const lower = (estado ?? '').toLowerCase();
    if (lower.includes('resu')) return 'Resuelta';
    if (lower.includes('prog')) return 'En progreso';
    return 'Abierta';
  }
}
