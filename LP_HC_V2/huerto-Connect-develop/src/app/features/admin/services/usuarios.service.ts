import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Usuario, UsuarioFiltro } from '../models/usuario.model';
import { UsuarioAdmin } from '../../../core/models/api.models';

export type { UsuarioFiltro };

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/usuarios`;
  private readonly huertosBase = `${environment.apiUrl}/api/huertos`;

  getUsuarios(filtro: UsuarioFiltro = {}): Observable<Usuario[]> {
    let params = new HttpParams();
    if (filtro.rol) params = params.set('rol', filtro.rol);
    if (filtro.estado) params = params.set('estado', filtro.estado);

    return forkJoin({
      usuarios: this.http.get<UsuarioAdmin[]>(this.base, { params }),
      huertos: this.http.get<Array<{ id: string; usuario_id: string }>>(this.huertosBase).pipe(
        catchError(() => of([]))
      ),
    }).pipe(
      map(({ usuarios, huertos }) => {
        const huertosByUser = huertos.reduce<Record<string, number>>((acc, huerto) => {
          const key = String(huerto.usuario_id ?? '');
          if (!key) return acc;
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {});

        let mapped = usuarios.map((u) => this.toUsuario(u, huertosByUser[u.id] ?? 0));
        if (filtro.busqueda) {
          const q = filtro.busqueda.toLowerCase();
          mapped = mapped.filter(
            (u) => `${u.nombre} ${u.correo}`.toLowerCase().includes(q)
          );
        }
        if (filtro.region) {
          mapped = mapped.filter((u) => u.region === filtro.region);
        }
        return mapped;
      }),
      catchError(() => of([]))
    );
  }

  updateUsuario(id: string, changes: Partial<Usuario>): Observable<Usuario> {
    const payload: {
      nombre?: string;
      apellidos?: string;
      email?: string;
      rol?: string;
      estado?: Usuario['estado'];
      region_id?: string | null;
    } = {};

    if (changes.nombre !== undefined) {
      const { nombre, apellidos } = this.splitNombre(changes.nombre);
      payload.nombre = nombre;
      payload.apellidos = apellidos;
    }
    if (changes.correo !== undefined) payload.email = changes.correo;
    if (changes.rol !== undefined) payload.rol = this.toApiRol(changes.rol);
    if (changes.estado !== undefined) payload.estado = changes.estado;
    if (changes.region !== undefined) payload.region_id = changes.region || null;

    return this.http.patch<UsuarioAdmin>(`${this.base}/${id}`, payload).pipe(
      map((item) => this.toUsuario(item, changes.huertos ?? 0))
    );
  }

  createUsuario(data: Record<string, unknown>): Observable<Usuario> {
    const fullName = String(data['nombre'] ?? '').trim();
    const { nombre, apellidos } = this.splitNombre(fullName);
    const payload = {
      nombre,
      apellidos,
      email: String(data['correo'] ?? '').trim().toLowerCase(),
      password: String(data['password'] ?? ''),
      rol: this.toApiRol((data['rol'] as Usuario['rol']) ?? 'Productor'),
      estado: (data['estado'] as Usuario['estado']) ?? 'Activo',
      region_id: data['region'] ? String(data['region']) : null,
    };
    return this.http.post<UsuarioAdmin>(this.base, payload).pipe(
      map((item) => this.toUsuario(item, 0))
    );
  }

  actualizarEstado(id: string, estado: Usuario['estado']): Observable<boolean> {
    return this.http.patch(`${this.base}/${id}`, { estado }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  deleteUsuario(id: string): Observable<boolean> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  private toUsuario(u: UsuarioAdmin, huertosCount: number): Usuario {
    return {
      id: u.id,
      nombre: `${u.nombre} ${u.apellidos}`.trim(),
      correo: u.email,
      region: u.region_id ?? '',
      rol: this.mapRol(u.rol),
      estado: u.estado ?? 'Activo',
      huertos: huertosCount,
      ultimaActividad: u.ultima_actividad ?? '',
    };
  }

  private splitNombre(fullName: string): { nombre: string; apellidos: string } {
    const pieces = String(fullName ?? '').trim().split(/\s+/).filter(Boolean);
    if (pieces.length === 0) {
      return { nombre: '', apellidos: '' };
    }
    if (pieces.length === 1) {
      return { nombre: pieces[0], apellidos: '' };
    }
    return {
      nombre: pieces.slice(0, -1).join(' '),
      apellidos: pieces[pieces.length - 1],
    };
  }

  private mapRol(rol: string | undefined): 'Admin' | 'Productor' | 'Tecnico' {
    const normalized = (rol ?? '').toLowerCase();
    if (normalized.includes('admin')) return 'Admin';
    if (normalized.includes('tec')) return 'Tecnico';
    return 'Productor';
  }

  private toApiRol(rol: Usuario['rol']): 'Admin' | 'Usuario' | 'Tecnico' {
    if (rol === 'Admin') return 'Admin';
    if (rol === 'Tecnico') return 'Tecnico';
    return 'Usuario';
  }
}
