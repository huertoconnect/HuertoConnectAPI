import { Routes } from '@angular/router';
import { HomeComponent } from './features/landing/pages/home/home.component';
import { LoginComponent } from './core/auth/login/login';
import { authGuard } from './core/auth/guards/auth.guard';
import { roleCanMatchGuard } from './core/auth/guards/role.guard';
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'dashboard',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard-entry.component').then((m) => m.DashboardEntryComponent)
  },
  {
    path: 'admin',
    canMatch: [authGuard, roleCanMatchGuard],
    data: { roles: ['admin', 'manager'] },
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES)
  },
  {
    path: 'user',
    canMatch: [authGuard, roleCanMatchGuard],
    data: { roles: ['user'] },
    loadChildren: () =>
      import('./features/user/user.routes').then((m) => m.USER_ROUTES)
  },
  { path: '**', redirectTo: '' }
];

