import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Notificacion, NotificacionesResumen } from '../../../core/models/api.models';
import { UsuariosService } from '../../../core/services/usuarios.service';

@Injectable({ providedIn: 'root' })
export class AdminNotificationsService {
  private readonly usuariosService = inject(UsuariosService);
  private readonly notificationsSubject = new BehaviorSubject<Notificacion[]>([]);
  private readonly resumenSubject = new BehaviorSubject<NotificacionesResumen>(this.emptySummary());

  readonly notifications$ = this.notificationsSubject.asObservable();
  readonly resumen$ = this.resumenSubject.asObservable();

  refresh(limit = 20): Observable<Notificacion[]> {
    return forkJoin({
      unread: this.usuariosService
        .listNotificaciones({ leida: false, limit })
        .pipe(catchError(() => of([]))),
      summary: this.usuariosService
        .getNotificacionesResumen()
        .pipe(catchError(() => of(this.emptySummary()))),
    }).pipe(
      map(({ unread, summary }) => ({
        unread: [...unread].sort((a, b) => this.toTime(b.fecha) - this.toTime(a.fecha)),
        summary
      })),
      tap(({ unread, summary }) => {
        this.notificationsSubject.next(unread);
        this.resumenSubject.next(summary);
      }),
      map(({ unread }) => unread),
      catchError(() => {
        this.notificationsSubject.next([]);
        this.resumenSubject.next(this.emptySummary());
        return of([]);
      })
    );
  }

  markAsRead(notificationId: string): Observable<boolean> {
    return this.usuariosService.markNotificacionRead(notificationId).pipe(
      tap(() => {
        const target = this.notificationsSubject.value.find((item) => item.id === notificationId);
        const updated = this.notificationsSubject.value.filter((item) => item.id !== notificationId);
        this.notificationsSubject.next(updated);
        this.updateSummaryAfterRead(target);
      }),
      map(() => true),
      catchError(() => of(false))
    );
  }

  markAllAsRead(): Observable<boolean> {
    const unread = this.notificationsSubject.value.filter((item) => !item.leida);
    if (unread.length === 0) {
      return of(true);
    }

    return forkJoin(unread.map((item) => this.usuariosService.markNotificacionRead(item.id))).pipe(
      switchMap(() => this.refreshSummary()),
      tap(() => this.notificationsSubject.next([])),
      map(() => true),
      catchError(() => of(false))
    );
  }

  refreshSummary(): Observable<NotificacionesResumen> {
    return this.usuariosService.getNotificacionesResumen().pipe(
      tap((summary) => this.resumenSubject.next(summary)),
      catchError(() => {
        this.resumenSubject.next(this.emptySummary());
        return of(this.emptySummary());
      })
    );
  }

  getUnreadCount(): number {
    return this.resumenSubject.value.no_leidas;
  }

  private toTime(value: string | null | undefined): number {
    if (!value) {
      return 0;
    }

    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  private updateSummaryAfterRead(notification: Notificacion | undefined): void {
    if (!notification) {
      return;
    }

    const current = this.resumenSubject.value;
    const nextPorTipo = { ...current.por_tipo };
    const typeCount = nextPorTipo[notification.tipo] ?? 0;
    nextPorTipo[notification.tipo] = Math.max(0, typeCount - 1);

    this.resumenSubject.next({
      total: current.total,
      no_leidas: Math.max(0, current.no_leidas - 1),
      leidas: Math.min(current.total, current.leidas + 1),
      por_tipo: nextPorTipo
    });
  }

  private emptySummary(): NotificacionesResumen {
    return {
      total: 0,
      no_leidas: 0,
      leidas: 0,
      por_tipo: {}
    };
  }
}
