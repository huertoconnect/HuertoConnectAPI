import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Huerto } from '../models/huerto.model';
import { Cultivo } from '../models/cultivo.model';

interface ApiHuerto {
  id: string;
  nombre: string;
  usuario_id: string;
  municipio: string;
  region_id: string | null;
  estado: string;
  salud: number;
}

interface ApiCultivo {
  id: string;
  nombre: string;
  temporada?: string;
  dificultad?: string;
  riego?: string;
  fertilizacion?: string;
  activo?: boolean;
}

interface ApiMessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class HuertosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api`;

  getHuertos(): Observable<Huerto[]> {
    return this.http.get<ApiHuerto[]>(`${this.base}/huertos`).pipe(
      map((items) => items.map((h) => this.toHuerto(h))),
      catchError(() => of([]))
    );
  }

  createHuerto(data: Partial<Huerto>): Observable<Huerto> {
    const payload = {
      nombre: String(data.nombre ?? '').trim(),
      municipio: String(data.municipio ?? '').trim(),
      region_id: data.region ? String(data.region) : null,
      estado: this.toApiEstado((data.estado as Huerto['estado']) ?? 'Optimo'),
      salud: Number(data.salud ?? 100),
    };
    return this.http.post<ApiHuerto>(`${this.base}/huertos`, payload).pipe(
      map((item) => this.toHuerto(item))
    );
  }

  updateHuerto(id: string, changes: Partial<Huerto>): Observable<Huerto> {
    const payload: {
      nombre?: string;
      municipio?: string;
      region_id?: string | null;
      estado?: string;
      salud?: number;
    } = {};

    if (changes.nombre !== undefined) payload.nombre = changes.nombre;
    if (changes.municipio !== undefined) payload.municipio = changes.municipio;
    if (changes.region !== undefined) payload.region_id = changes.region || null;
    if (changes.estado !== undefined) payload.estado = this.toApiEstado(changes.estado);
    if (changes.salud !== undefined) payload.salud = Number(changes.salud);

    return this.http.put<ApiHuerto>(`${this.base}/huertos/${id}`, payload).pipe(
      map((item) => this.toHuerto(item))
    );
  }

  markHuertoRevision(id: string): Observable<Huerto> {
    return this.updateHuerto(id, { estado: 'Atencion' });
  }

  deleteHuerto(id: string): Observable<boolean> {
    return this.http.delete<ApiMessageResponse>(`${this.base}/huertos/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  getCultivos(): Observable<Cultivo[]> {
    return this.http.get<ApiCultivo[]>(`${this.base}/cultivos`).pipe(
      map((items) => items.map((c) => this.toCultivo(c))),
      catchError(() => of([]))
    );
  }

  createCultivo(data: Partial<Cultivo>): Observable<Cultivo> {
    const payload = {
      nombre: String(data.nombre ?? '').trim(),
      temporada: String(data.temporada ?? '').trim(),
      dificultad: data.dificultad ?? 'Media',
      riego: String(data.riego ?? '').trim(),
      fertilizacion: String(data.fertilizacion ?? '').trim(),
      activo: data.activo ?? true,
    };
    return this.http.post<ApiCultivo>(`${this.base}/cultivos`, payload).pipe(
      map((item) => this.toCultivo(item))
    );
  }

  updateCultivo(id: string, changes: Partial<Cultivo>): Observable<Cultivo> {
    const payload: {
      nombre?: string;
      temporada?: string;
      dificultad?: string;
      riego?: string;
      fertilizacion?: string;
      activo?: boolean;
    } = {};

    if (changes.nombre !== undefined) payload.nombre = changes.nombre;
    if (changes.temporada !== undefined) payload.temporada = changes.temporada;
    if (changes.dificultad !== undefined) payload.dificultad = changes.dificultad;
    if (changes.riego !== undefined) payload.riego = changes.riego;
    if (changes.fertilizacion !== undefined) payload.fertilizacion = changes.fertilizacion;
    if (changes.activo !== undefined) payload.activo = Boolean(changes.activo);

    return this.http.put<ApiCultivo>(`${this.base}/cultivos/${id}`, payload).pipe(
      map((item) => this.toCultivo(item))
    );
  }

  deleteCultivo(id: string): Observable<boolean> {
    return this.http.delete<ApiMessageResponse>(`${this.base}/cultivos/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  private toHuerto(h: ApiHuerto): Huerto {
    return {
      id: h.id,
      nombre: h.nombre,
      usuario: h.usuario_id ?? '',
      municipio: h.municipio ?? '',
      region: h.region_id ?? '',
      cultivosActivos: 0,
      estado: this.mapEstado(h.estado),
      salud: h.salud ?? 100,
      alertas: 0,
    };
  }

  private toCultivo(c: ApiCultivo): Cultivo {
    return {
      id: c.id,
      nombre: c.nombre,
      temporada: c.temporada ?? '',
      dificultad: this.mapDificultad(c.dificultad),
      riego: c.riego ?? '',
      fertilizacion: c.fertilizacion ?? '',
      activo: c.activo ?? true,
    };
  }

  private toApiEstado(estado: Huerto['estado']): string {
    if (estado === 'Critico') return 'Critico';
    if (estado === 'Atencion') return 'Atencion';
    return 'Optimo';
  }

  private mapEstado(estado: string | undefined): 'Optimo' | 'Atencion' | 'Critico' {
    if (!estado) return 'Optimo';
    const lower = estado.toLowerCase();
    if (lower.includes('crit')) return 'Critico';
    if (lower.includes('alert') || lower.includes('aten')) return 'Atencion';
    return 'Optimo';
  }

  private mapDificultad(value: string | undefined): 'Baja' | 'Media' | 'Alta' {
    const lower = (value ?? '').toLowerCase();
    if (lower.includes('baj')) return 'Baja';
    if (lower.includes('alt')) return 'Alta';
    return 'Media';
  }
}
