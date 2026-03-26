import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Region } from '../models/region.model';
import { Plantio } from '../models/plantio.model';

interface ApiRegion {
  id: string;
  nombre: string;
  actividad?: string;
  priorizada?: boolean;
}

interface ApiHuertoLite {
  id: string;
  region_id: string | null;
}

interface ApiPlagaLite {
  huerto_id: string;
}

interface ApiMessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class RegionesService {
  private readonly http = inject(HttpClient);
  private readonly regionesBase = `${environment.apiUrl}/api/regiones`;
  private readonly huertosBase = `${environment.apiUrl}/api/huertos`;
  private readonly plagasBase = `${environment.apiUrl}/api/plagas`;

  getRegiones(): Observable<Region[]> {
    return forkJoin({
      regiones: this.http.get<ApiRegion[]>(this.regionesBase),
      huertos: this.http.get<ApiHuertoLite[]>(this.huertosBase).pipe(catchError(() => of([]))),
      plagas: this.http.get<ApiPlagaLite[]>(this.plagasBase).pipe(catchError(() => of([]))),
    }).pipe(
      map(({ regiones, huertos, plagas }) => {
        const huertosByRegion = huertos.reduce<Record<string, number>>((acc, huerto) => {
          const key = huerto.region_id ?? '';
          if (!key) return acc;
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {});

        const regionByHuerto = huertos.reduce<Record<string, string>>((acc, huerto) => {
          if (huerto.id && huerto.region_id) {
            acc[huerto.id] = huerto.region_id;
          }
          return acc;
        }, {});

        const deteccionesByRegion = plagas.reduce<Record<string, number>>((acc, plaga) => {
          const regionId = regionByHuerto[plaga.huerto_id];
          if (!regionId) return acc;
          acc[regionId] = (acc[regionId] ?? 0) + 1;
          return acc;
        }, {});

        return regiones.map((region) =>
          this.toRegion(
            region,
            huertosByRegion[region.id] ?? 0,
            deteccionesByRegion[region.id] ?? 0
          )
        );
      }),
      catchError(() => of([]))
    );
  }

  createRegion(data: Partial<Region>): Observable<Region> {
    const payload = {
      nombre: String(data.nombre ?? '').trim(),
      actividad: data.actividad ?? 'Media',
      priorizada: false,
    };
    return this.http.post<ApiRegion>(this.regionesBase, payload).pipe(
      map((region) => this.toRegion(region, 0, 0))
    );
  }

  updateRegion(id: string, changes: Partial<Region>): Observable<Region> {
    const payload: {
      nombre?: string;
      actividad?: string;
      priorizada?: boolean;
    } = {};

    if (changes.nombre !== undefined) payload.nombre = changes.nombre;
    if (changes.actividad !== undefined) payload.actividad = changes.actividad;

    return this.http.put<ApiRegion>(`${this.regionesBase}/${id}`, payload).pipe(
      map((region) => this.toRegion(region, changes.huertos ?? 0, changes.detecciones ?? 0))
    );
  }

  priorizarRegion(id: string): Observable<Region> {
    return this.http.put<ApiRegion>(`${this.regionesBase}/${id}`, { actividad: 'Alta', priorizada: true }).pipe(
      map((region) => this.toRegion(region, 0, 0))
    );
  }

  deleteRegion(id: string): Observable<boolean> {
    return this.http.delete<ApiMessageResponse>(`${this.regionesBase}/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  getPlantiosVeracruz(): Observable<Plantio[]> {
    // Obtener plantíos de todas las regiones disponibles
    return this.http.get<ApiRegion[]>(this.regionesBase).pipe(
      map((regiones) => {
        // No hay endpoint directo para plantíos generales, así que
        // generamos info mínima basándonos en las regiones
        return regiones.map((r, i) => ({
          id: r.id,
          nombre: r.nombre,
          cultivo: '',
          municipio: '',
          lat: 19.1738 + i * 0.02,
          lng: -96.1342 + i * 0.02,
          salud: 85,
          alertas: 0,
          severidad: 'Baja' as const,
        }));
      }),
      catchError(() => of([]))
    );
  }

  private toRegion(r: ApiRegion, huertosCount: number, deteccionesCount: number): Region {
    return {
      id: r.id,
      nombre: r.nombre,
      usuarios: 0, // No hay endpoint de conteo por región en backend
      huertos: huertosCount,
      detecciones: deteccionesCount,
      actividad: this.mapActividad(r.actividad),
    };
  }

  private mapActividad(value: string | undefined): 'Alta' | 'Media' | 'Baja' {
    const normalized = (value ?? '').toLowerCase();
    if (normalized.includes('alta')) return 'Alta';
    if (normalized.includes('baja')) return 'Baja';
    return 'Media';
  }
}
