import { UserRole } from './services/auth.service';

export const ADMIN_PANEL_ROLES: readonly UserRole[] = ['admin', 'manager'];

export function canAccessAdminPanel(role: UserRole | null | undefined): boolean {
  return role === 'admin' || role === 'manager';
}

export function getDashboardRouteByRole(role: UserRole | null | undefined): string {
  return canAccessAdminPanel(role) ? '/admin/dashboard' : '/user/dashboard';
}

export function getRoleLabel(role: UserRole | null | undefined): string {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'manager':
      return 'Moderador';
    default:
      return 'Usuario';
  }
}
