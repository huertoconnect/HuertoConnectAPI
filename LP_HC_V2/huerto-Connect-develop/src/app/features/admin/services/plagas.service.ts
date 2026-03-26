import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PlagaDeteccion } from '../models/plaga-deteccion.model';

interface ApiPlagaDeteccion {
  id: string;
  imagen_url?: string | null;
  plaga: string;
  confianza: number;
  huerto_id: string;
  cultivo_id?: string | null;
  severidad: string;
  estado: string;
  fecha?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PlagasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/plagas`;

  getDetecciones(): Observable<PlagaDeteccion[]> {
    return this.http.get<ApiPlagaDeteccion[]>(this.base).pipe(
      map((items) => items.map((item) => this.toDeteccion(item))),
      catchError(() => of([]))
    );
  }

  createDeteccion(data: Partial<PlagaDeteccion>): Observable<PlagaDeteccion> {
    const payload = {
      imagen_url: data.imagenUrl ?? '',
      plaga: String(data.plaga ?? '').trim(),
      confianza: Number(data.confianza ?? 0),
      huerto_id: String(data.ubicacion ?? '').trim(),
      cultivo_id: data.cultivo ? String(data.cultivo).trim() : null,
      severidad: data.severidad ?? 'Baja',
      estado: data.estado ?? 'Pendiente',
    };

    return this.http.post<ApiPlagaDeteccion>(this.base, payload).pipe(
      map((item) => this.toDeteccion(item))
    );
  }

  updateDeteccion(id: string, changes: Partial<PlagaDeteccion>): Observable<PlagaDeteccion> {
    const payload: {
      plaga?: string;
      confianza?: number;
      severidad?: string;
      estado?: string;
    } = {};

    if (changes.plaga !== undefined) payload.plaga = changes.plaga;
    if (changes.confianza !== undefined) payload.confianza = Number(changes.confianza);
    if (changes.severidad !== undefined) payload.severidad = changes.severidad;
    if (changes.estado !== undefined) payload.estado = changes.estado;

    return this.http.patch<ApiPlagaDeteccion>(`${this.base}/${id}`, payload).pipe(
      map((item) => this.toDeteccion(item))
    );
  }

  marcarDeteccion(id: string, estado: PlagaDeteccion['estado']): Observable<boolean> {
    return this.http.patch<ApiPlagaDeteccion>(`${this.base}/${id}`, { estado }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  private toDeteccion(a: ApiPlagaDeteccion): PlagaDeteccion {
    return {
      id: a.id,
      imagenUrl: a.imagen_url ?? '',
      plaga: a.plaga ?? 'Plaga no identificada',
      confianza: Number(a.confianza ?? 0),
      cultivo: a.cultivo_id ?? '',
      ubicacion: a.huerto_id ?? '',
      fecha: a.fecha ?? '',
      severidad: this.mapSeveridad(a.severidad),
      estado: this.mapEstado(a.estado),
    };
  }

  private mapSeveridad(sev?: string): 'Baja' | 'Media' | 'Alta' {
    if (!sev) return 'Baja';
    const lower = sev.toLowerCase();
    if (lower.includes('alta') || lower.includes('crit')) return 'Alta';
    if (lower.includes('media')) return 'Media';
    return 'Baja';
  }

  private mapEstado(estado?: string): 'Pendiente' | 'Confirmada' | 'Descartada' {
    const lower = (estado ?? '').toLowerCase();
    if (lower.includes('conf')) return 'Confirmada';
    if (lower.includes('desc')) return 'Descartada';
    return 'Pendiente';
  }
}
