import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { AuthService } from '../../core/auth/services/auth.service';
import { getDashboardRouteByRole } from '../../core/auth/auth-role.utils';

@Component({
  selector: 'app-dashboard-entry',
  standalone: true,
  imports: [CommonModule],
  template: `<p class="loading-message">Cargando dashboard...</p>`,
  styles: [
    `
      :host {
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f2f8f2;
      }

      .loading-message {
        margin: 0;
        color: #235347;
        font-weight: 600;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardEntryComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    this.authService
      .getMe()
      .pipe(
        map((user) => {
          // Mapear role del backend (Admin/Usuario/Tecnico) al frontend (admin/user/manager)
          const roleRaw = (user.role as string).toLowerCase();
          const role = roleRaw === 'admin' ? 'admin' : roleRaw === 'tecnico' ? 'manager' : 'user';
          return role as 'admin' | 'manager' | 'user';
        }),
        catchError(() => of(this.authService.getUserRole())),
        take(1)
      )
      .subscribe((role) => {
        void this.router.navigateByUrl(getDashboardRouteByRole(role), { replaceUrl: true });
      });
  }
}
