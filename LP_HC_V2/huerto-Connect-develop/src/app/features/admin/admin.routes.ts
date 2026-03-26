import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminUsuariosComponent } from './pages/admin-usuarios/admin-usuarios.component';
import { AdminHuertosComponent } from './pages/admin-huertos/admin-huertos.component';
import { AdminRegionesComponent } from './pages/admin-regiones/admin-regiones.component';
import { AdminPlagasComponent } from './pages/admin-plagas/admin-plagas.component';
import { AdminChatbotComponent } from './pages/admin-chatbot/admin-chatbot.component';
import { AdminEstadisticasComponent } from './pages/admin-estadisticas/admin-estadisticas.component';
import { AdminReportesComponent } from './pages/admin-reportes/admin-reportes.component';
import { AdminConfiguracionComponent } from './pages/admin-configuracion/admin-configuracion.component';
import { roleCanActivateGuard } from '../../core/auth/guards/role.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
        canActivate: [roleCanActivateGuard],
        data: { roles: ['admin', 'manager'] }
      },
      {
        path: 'usuarios',
        component: AdminUsuariosComponent,
        canActivate: [roleCanActivateGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'huertos',
        component: AdminHuertosComponent,
        canActivate: [roleCanActivateGuard],
        data: { roles: ['admin', 'manager'] }
      },
      {
        path: 'regiones',
        component: AdminRegionesComponent,
        canActivate: [roleCanActivateGuard],
        data: { roles: ['admin', 'manager'] }
      },
      {
        path: 'plagas',
        component: AdminPlagasComponent,
        canActivate: [roleCanActivateGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'chatbot',
        component: AdminChatbotComponent,
        canActivate: [roleCanActivateGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'estadisticas',
        component: AdminEstadisticasComponent,
        canActivate: [roleCanActivateGuard],
        data: { roles: ['admin', 'manager'] }
      },
      {
        path: 'reportes',
        component: AdminReportesComponent,
        canActivate: [roleCanActivateGuard],
        data: { roles: ['admin', 'manager'] }
      },
      {
        path: 'configuracion',
        component: AdminConfiguracionComponent,
        canActivate: [roleCanActivateGuard],
        data: { roles: ['admin'] }
      }
    ]
  }
];
