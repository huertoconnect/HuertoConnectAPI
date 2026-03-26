import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuditoriaLog } from '../models/auditoria-log.model';
import { AuditoriaLog as ApiAuditoriaLog } from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/auditoria`;

  getLogs(): Observable<AuditoriaLog[]> {
    return this.http.get<ApiAuditoriaLog[]>(`${this.base}/`).pipe(
      map((items) =>
        items.map((a) => ({
          id: a.id,
          actor: a.usuario_id ?? '',
          accion: a.accion,
          modulo: a.recurso,
          fecha: a.timestamp ?? '',
          ip: a.ip ?? '',
        }))
      ),
      catchError(() => of([]))
    );
  }
}
