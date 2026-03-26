import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-hero',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './hero.component.html',
    styleUrls: ['./hero.component.scss']
})
export class HeroComponent {
    // Hardcoded data for visual simplicity as requested
    badge = 'Agricultura Inteligente';
    title = 'Tu Huerto,';
    highlight = 'Infinitas Posibilidades';
    subtitle = 'Cosecha más, usa menos. Tecnología que respeta la tierra y multiplica tus resultados.';
    ctaPrimary = 'Comenzar Ahora →';
    ctaSecondary = 'Ver Demo';
    backgroundImage = 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

    stats = [
        { value: '500+', label: 'Huertos Activos' },
        { value: '98%', label: 'Satisfacción' },
        { value: '24/7', label: 'Monitoreo' }
    ];

    scrollToAbout(event: Event) {
        event.preventDefault();
        const el = document.getElementById('about');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    }
}
