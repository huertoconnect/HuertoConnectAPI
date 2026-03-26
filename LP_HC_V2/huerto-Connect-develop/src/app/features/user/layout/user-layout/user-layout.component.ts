import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService, UserRole } from '../../../../core/auth/services/auth.service';
import { getRoleLabel } from '../../../../core/auth/auth-role.utils';
import { ConfirmDialogComponent } from '../../../admin/components/confirm-dialog/confirm-dialog.component';

interface UserNavItem {
  label: string;
  icon: string;
  route: string;
  description: string;
}

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ConfirmDialogComponent],
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);

  readonly currentUser$ = this.authService.currentUser$;
  readonly defaultAvatar = 'assets/images/default-avatar.svg';
  readonly todayLabel = this.formatDate('long');
  readonly shortDateLabel = this.formatDate('short');
  logoutConfirmVisible = false;
  sidebarOpen = false;

  readonly navItems: UserNavItem[] = [
    {
      label: 'Dashboard personal',
      icon: 'grid-outline',
      route: '/user/dashboard',
      description: 'Resumen de estado, alertas y recomendaciones.'
    }
  ];

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.authService.getMe().subscribe({
      error: () => {
        // Ignore transient errors and keep current session data.
      }
    });
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

  requestLogout(): void {
    this.closeSidebar();
    this.logoutConfirmVisible = true;
  }

  confirmLogout(): void {
    this.logoutConfirmVisible = false;
    this.authService.logout().subscribe({
      next: () => {
        this.authService.logoutLocal();
      },
      error: () => {
        // Si backend responde 401/403, limpiamos sesión local igual.
        this.authService.logoutLocal();
      },
    });
  }

  cancelLogout(): void {
    this.logoutConfirmVisible = false;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  private formatDate(format: 'long' | 'short'): string {
    const options = format === 'long'
      ? ({ weekday: 'long', day: 'numeric', month: 'long' } as const)
      : ({ day: '2-digit', month: 'short' } as const);

    const value = new Intl.DateTimeFormat('es-MX', options).format(new Date());
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
