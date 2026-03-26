import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Route, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';
import { getDashboardRouteByRole } from '../auth-role.utils';

function readAllowedRoles(route: Pick<Route, 'data'>): UserRole[] {
  const value = route.data?.['roles'];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is UserRole => item === 'admin' || item === 'manager' || item === 'user');
}

function evaluateRole(route: Pick<Route, 'data'>): boolean | ReturnType<Router['createUrlTree']> {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const allowedRoles = readAllowedRoles(route);
  if (allowedRoles.length === 0) {
    return true;
  }

  const currentRole = authService.getUserRole();
  if (currentRole && allowedRoles.includes(currentRole)) {
    return true;
  }

  return router.createUrlTree([getDashboardRouteByRole(currentRole)]);
}

export const roleCanMatchGuard: CanMatchFn = (route) => evaluateRole(route);

export const roleCanActivateGuard: CanActivateFn = (route) => evaluateRole(route);
