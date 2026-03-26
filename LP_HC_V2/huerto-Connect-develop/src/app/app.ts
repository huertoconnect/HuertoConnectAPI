import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './core/components/header/header.component';
import { FooterComponent } from './core/components/footer/footer.component';
import { SplashScreenComponent } from './core/components/splash-screen/splash-screen.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, SplashScreenComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  title = 'huerto-connect';
  showSplash = true;
  showChrome = true; // Controls header + footer visibility
  isDashboard = false;
  private isInitialLoad = true;
  private previousUrl = '';

  constructor(private readonly router: Router) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const url = event.urlAfterRedirects || event.url;
      const [path, query = ''] = url.split('?');
      const reason = new URLSearchParams(query).get('reason');
      if (
        path === '/' &&
        (reason === 'session_expired' || reason === 'access_denied')
      ) {
        void this.router.navigate(['/login'], {
          queryParams: { reason },
          replaceUrl: true
        });
        return;
      }

      const isLoginRoute = url.startsWith('/login') || url.startsWith('/auth/login');
      const isPrivateDashboardRoute =
        url.startsWith('/admin') ||
        url.startsWith('/user') ||
        url.startsWith('/dashboard');

      this.showChrome = !isLoginRoute && !isPrivateDashboardRoute;
      this.isDashboard = url.startsWith('/admin') || url.startsWith('/user');

      // If we are navigating to admin FROM login, show splash again
      const fromLoginRoute =
        this.previousUrl.startsWith('/login') || this.previousUrl.startsWith('/auth/login');
      if (this.isDashboard && fromLoginRoute && !this.isInitialLoad) {
        this.showSplash = true;
        // The dashboard CSS handles the background color, we just reset inline style
        document.body.style.backgroundColor = '';
      }

      this.previousUrl = url;
      this.isInitialLoad = false;
    });
  }

  ngOnInit() {
    // Fallback if NavigationEnd takes time
  }

  onSplashComplete(): void {
    this.showSplash = false;

    // Smoothly transition body from dark splash color to page background
    document.body.style.transition = 'background-color 1.5s ease';
    document.body.style.backgroundColor = this.isDashboard ? '' : '#F9F9F9';
  }
}
