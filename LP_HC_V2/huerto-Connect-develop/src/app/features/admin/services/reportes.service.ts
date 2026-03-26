import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import type {
  ReporteItem,
  IntegracionItem,
} from '../mock/reportes.mock';

interface ApiReporte {
  id: string;
  nombre: string;
  tipo: string;
  estado: string;
  fecha?: string | null;
}

interface ApiHealth {
  services?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api`;

  getReportes(): Observable<ReporteItem[]> {
    return this.http.get<ApiReporte[]>(`${this.base}/reportes`).pipe(
      map((items) =>
        items.map((r) => ({
          id: r.id,
          nombre: r.nombre ?? `Reporte ${r.tipo}`,
          tipo: r.tipo,
          fecha: r.fecha ?? '',
          estado: this.mapEstado(r.estado),
        }))
      ),
      catchError(() => of([]))
    );
  }

  createReporte(data: Partial<ReporteItem>): Observable<ReporteItem> {
    const payload = {
      nombre: String(data.nombre ?? '').trim(),
      tipo: String(data.tipo ?? 'General').trim(),
      archivo_url: null as string | null,
    };
    return this.http.post<ApiReporte>(`${this.base}/reportes`, payload).pipe(
      map((item) => ({
        id: item.id,
        nombre: item.nombre,
        tipo: item.tipo,
        fecha: item.fecha ?? '',
        estado: this.mapEstado(item.estado),
      }))
    );
  }

  deleteReporte(id: string): Observable<boolean> {
    return this.http.delete<{ message: string }>(`${this.base}/reportes/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  getIntegraciones(): Observable<IntegracionItem[]> {
    // Usar el health check del gateway para determinar el estado de los servicios
    return this.http.get<ApiHealth>(`${this.base}/health`).pipe(
      map((health) => {
        const services = health.services ?? {};
        const labels: Array<{ key: string; name: string }> = [
          { key: 'auth', name: 'auth-service' },
          { key: 'huertos', name: 'huertos-service' },
          { key: 'plagas', name: 'plagas-service' },
          { key: 'chat', name: 'chat-service' },
          { key: 'reportes', name: 'reportes-service' },
        ];

        return labels.map(({ key, name }) => {
          const status = services[key] ?? 'unknown';
          return {
            nombre: name,
            estado: status === 'ok' ? ('Conectado' as const) : ('Degradado' as const),
            ultimaRevision: new Date().toLocaleTimeString(),
          };
        });
      }),
      catchError(() =>
        of([
          { nombre: 'API Gateway', estado: 'Desconectado' as const, ultimaRevision: 'N/A' },
        ])
      )
    );
  }

  private mapEstado(value: string | undefined): 'Generado' | 'En proceso' {
    const lower = (value ?? '').toLowerCase();
    if (lower.includes('proceso')) return 'En proceso';
    return 'Generado';
  }
}
