import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { switchMap, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastNotificationComponent } from '../../components/toast-notification/toast-notification.component';
import { ToastService } from '../../components/toast-notification/toast-notification.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { getRoleLabel } from '../../../../core/auth/auth-role.utils';
import { AuthService, UserRole } from '../../../../core/auth/services/auth.service';
import { Notificacion } from '../../../../core/models/api.models';
import { AdminNotificationsService } from '../../services/admin-notifications.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  accent: string;
  accentLight: string;
  roles: UserRole[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ToastNotificationComponent, ConfirmDialogComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationsService = inject(AdminNotificationsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly currentUser$ = this.authService.currentUser$;
  readonly defaultAvatar = 'assets/images/default-avatar.svg';
  readonly notifications$ = this.notificationsService.notifications$;
  readonly notificationsSummary$ = this.notificationsService.resumen$;
  logoutConfirmVisible = false;
  notificationsOpen = false;
  unreadCount = 0;

  readonly navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'grid-outline',
      route: '/admin/dashboard',
      accent: '#00f7ff',
      accentLight: '#0f6c77',
      roles: ['admin', 'manager']
    },
    {
      label: 'Usuarios',
      icon: 'people-outline',
      route: '/admin/usuarios',
      accent: '#2d8bff',
      accentLight: '#1e5e9d',
      roles: ['admin']
    },
    {
      label: 'Huertos',
      icon: 'leaf-outline',
      route: '/admin/huertos',
      accent: '#00ffa3',
      accentLight: '#0a8e5f',
      roles: ['admin', 'manager']
    },
    {
      label: 'Regiones y Ubicacion',
      icon: 'earth-outline',
      route: '/admin/regiones',
      accent: '#8f7bff',
      accentLight: '#5f4fb8',
      roles: ['admin', 'manager']
    },
    {
      label: 'Deteccion de Plagas (IA)',
      icon: 'bug-outline',
      route: '/admin/plagas',
      accent: '#22e48e',
      accentLight: '#0f8a54',
      roles: ['admin']
    },
    {
      label: 'Chatbot IA',
      icon: 'chatbubbles-outline',
      route: '/admin/chatbot',
      accent: '#3cd1ff',
      accentLight: '#1474a7',
      roles: ['admin']
    },
    {
      label: 'Estadisticas',
      icon: 'stats-chart-outline',
      route: '/admin/estadisticas',
      accent: '#ffc857',
      accentLight: '#9a7112',
      roles: ['admin', 'manager']
    },
    {
      label: 'Reportes',
      icon: 'document-text-outline',
      route: '/admin/reportes',
      accent: '#5ef2d6',
      accentLight: '#0e7f68',
      roles: ['admin', 'manager']
    }
  ];

  ngOnInit(): void {
    this.notificationsSummary$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((count) => {
        this.unreadCount = count.no_leidas;
        this.cdr.markForCheck();
      });

    timer(0, 45000)
      .pipe(
        switchMap(() => this.notificationsService.refresh()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.authService.getMe().subscribe({
      error: () => {
        // Keep current session data when /me fails temporarily.
      }
    });
  }

  get isAdmin(): boolean {
    return this.authService.getUserRole() === 'admin';
  }

  get visibleNavItems(): NavItem[] {
    const role = this.authService.getUserRole();
    if (!role) {
      return [];
    }
    return this.navItems.filter((item) => item.roles.includes(role));
  }

  getRoleName(role: UserRole | null | undefined): string {
    return getRoleLabel(role);
  }

  onAvatarError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (!target || target.src.endsWith(this.defaultAvatar)) {
      return;
    }

    target.src = this.defaultAvatar;
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.notificationsService.refresh().subscribe();
    }
  }

  onNotificationClick(notification: Notificacion): void {
    if (!notification.leida) {
      this.notificationsService.markAsRead(notification.id).subscribe((ok) => {
        if (!ok) {
          this.toast.error('No se pudo actualizar la notificación en el servidor');
        }
      });
    }

    const targetRoute = this.resolveNotificationRoute(notification);
    if (targetRoute) {
      void this.router.navigateByUrl(targetRoute);
      this.notificationsOpen = false;
    }
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead().subscribe((ok) => {
      if (!ok) {
        this.toast.error('No se pudieron marcar todas como leídas');
        return;
      }
      this.toast.success('Notificaciones actualizadas');
    });
  }

  refreshNotifications(): void {
    this.notificationsService.refresh().subscribe((items) => {
      if (items.length === 0) {
        this.toast.info('No hay nuevas notificaciones por ahora');
      }
    });
  }

  getNotificationIcon(type: Notificacion['tipo']): string {
    switch (type) {
      case 'alerta':
      case 'warning':
        return 'warning-outline';
      case 'error':
        return 'alert-circle-outline';
      case 'exito':
        return 'checkmark-done-circle-outline';
      default:
        return 'information-circle-outline';
    }
  }

  formatNotificationDate(value: string | null): string {
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
      hour: '2-digit',
      minute: '2-digit'
    }).format(parsed);
  }

  requestLogout() {
    this.notificationsOpen = false;
    this.logoutConfirmVisible = true;
  }

  confirmLogout() {
    this.logoutConfirmVisible = false;
    this.authService.logout().subscribe({
      next: () => {
        this.authService.logoutLocal();
      },
      error: () => {
        // Si la sesión ya venció en backend, limpiamos cliente de todos modos.
        this.authService.logoutLocal();
      },
    });
  }

  cancelLogout() {
    this.logoutConfirmVisible = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.notificationsOpen) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest('.notifications')) {
      return;
    }

    this.notificationsOpen = false;
    this.cdr.markForCheck();
  }

  private resolveNotificationRoute(notification: Notificacion): string {
    const referenceType = (notification.referencia_tipo ?? '').toLowerCase();
    if (referenceType.includes('reporte')) {
      return '/admin/reportes';
    }
    if (referenceType.includes('huerto')) {
      return '/admin/huertos';
    }
    if (referenceType.includes('usuario')) {
      return '/admin/usuarios';
    }
    if (referenceType.includes('plaga') || referenceType.includes('predic')) {
      return '/admin/plagas';
    }
    if (referenceType.includes('chat')) {
      return '/admin/chatbot';
    }
    return '/admin/dashboard';
  }
}
