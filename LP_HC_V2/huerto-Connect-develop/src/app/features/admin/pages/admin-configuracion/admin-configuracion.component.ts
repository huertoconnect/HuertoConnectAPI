import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SessionInfo, UsuarioAdmin } from '../../../../core/models/api.models';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { RegionesService } from '../../../../core/services/regiones.service';
import { UsuariosService as CoreUsuariosService } from '../../../../core/services/usuarios.service';
import { ToastService } from '../../components/toast-notification/toast-notification.component';
import { AdminNotificationsService } from '../../services/admin-notifications.service';

@Component({
  selector: 'app-admin-configuracion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-configuracion.component.html',
  styleUrls: ['./admin-configuracion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminConfiguracionComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  private readonly regionesService = inject(RegionesService);
  private readonly usuariosService = inject(CoreUsuariosService);
  private readonly notificationsService = inject(AdminNotificationsService);
  private readonly toast = inject(ToastService);

  readonly accountForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    apellidos: ['', [Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    regionId: ['']
  });

  readonly notifications$ = this.notificationsService.notifications$;
  readonly notificationsSummary$ = this.notificationsService.resumen$;

  regions: Array<{ id: string; nombre: string }> = [];
  sessions: SessionInfo[] = [];

  userId: string | null = null;
  loading = true;
  savingAccount = false;
  loadingSessions = false;

  ngOnInit(): void {
    this.loadConfiguration();
  }

  saveAccount(): void {
    if (!this.userId) {
      this.toast.error('No se encontró la sesión de usuario activa');
      return;
    }

    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      this.toast.error('Revisa los campos requeridos antes de guardar');
      return;
    }

    const raw = this.accountForm.getRawValue();
    const payload: Partial<UsuarioAdmin> = {
      nombre: raw.nombre.trim(),
      apellidos: raw.apellidos.trim(),
      email: raw.email.trim().toLowerCase(),
      region_id: raw.regionId || null
    };

    this.savingAccount = true;
    this.usuariosService.update(this.userId, payload).subscribe({
      next: () => {
        this.savingAccount = false;
        this.toast.success('Perfil actualizado correctamente');
        this.authService.getMe().subscribe();
        this.cdr.markForCheck();
      },
      error: () => {
        this.savingAccount = false;
        this.toast.error('No se pudo guardar la configuración');
        this.cdr.markForCheck();
      }
    });
  }

  refreshNotifications(): void {
    this.notificationsService.refresh().subscribe((items) => {
      if (items.length === 0) {
        this.toast.info('No hay notificaciones nuevas por ahora');
      } else {
        this.toast.success('Notificaciones actualizadas');
      }
    });
  }

  markAllNotificationsRead(): void {
    this.notificationsService.markAllAsRead().subscribe((ok) => {
      if (!ok) {
        this.toast.error('No se pudieron marcar todas como leídas');
        return;
      }
      this.toast.success('Notificaciones sincronizadas');
    });
  }

  revokeSession(sessionId: string): void {
    this.authService.revokeSession(sessionId).subscribe({
      next: () => {
        this.toast.success('Sesión cerrada correctamente');
        this.loadSessions();
      },
      error: () => {
        this.toast.error('No se pudo cerrar la sesión seleccionada');
      }
    });
  }

  revokeAllSessions(): void {
    this.authService.revokeAllSessions().subscribe({
      next: () => {
        this.toast.success('Se cerraron todas las sesiones remotas');
        this.loadSessions();
      },
      error: () => {
        this.toast.error('No fue posible cerrar todas las sesiones');
      }
    });
  }

  formatDate(value: string | null): string {
    if (!value) {
      return 'Sin fecha';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'Sin fecha';
    }

    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(parsed);
  }

  trackBySession(_index: number, session: SessionInfo): string {
    return session.id;
  }

  private loadConfiguration(): void {
    this.loading = true;

    this.authService.getMe().subscribe({
      next: (sessionUser) => {
        this.userId = sessionUser.id;

        forkJoin({
          perfil: this.usuariosService.getById(sessionUser.id).pipe(catchError(() => of(null))),
          regiones: this.regionesService.list().pipe(catchError(() => of([]))),
          sesiones: this.authService.listSessions().pipe(catchError(() => of([]))),
          notificaciones: this.notificationsService.refresh().pipe(catchError(() => of([])))
        }).subscribe(({ perfil, regiones, sesiones }) => {
          this.regions = regiones.map((region) => ({ id: region.id, nombre: region.nombre }));
          this.sessions = sesiones;
          this.accountForm.patchValue({
            nombre: perfil?.nombre ?? sessionUser.nombre,
            apellidos: perfil?.apellidos ?? sessionUser.apellidos,
            email: perfil?.email ?? sessionUser.email,
            regionId: perfil?.region_id ?? ''
          });
          this.loading = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.loading = false;
        this.toast.error('No se pudo cargar la configuración del usuario');
        this.cdr.markForCheck();
      }
    });
  }

  private loadSessions(): void {
    this.loadingSessions = true;
    this.authService.listSessions().pipe(catchError(() => of([]))).subscribe((sessions) => {
      this.sessions = sessions;
      this.loadingSessions = false;
      this.cdr.markForCheck();
    });
  }
}
