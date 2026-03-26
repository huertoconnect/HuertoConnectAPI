import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';

@Component({
    selector: 'app-features',
    standalone: true,
    imports: [CommonModule, ScrollRevealDirective],
    templateUrl: './features.component.html',
    styleUrls: ['./features.component.scss']
})
export class FeaturesComponent implements AfterViewInit, OnDestroy {
    @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

    features = [
        {
            title: 'Asistente IA',
            description: 'Inteligencia artificial que analiza tu zona y te guía paso a paso.',
            icon: 'brain',
            color: 'linear-gradient(135deg, #00C9A7 0%, #00D4A1 100%)',
            size: 'large',
            delay: '0ms'
        },
        {
            title: 'Cultivos Personalizados',
            description: 'Recomendaciones basadas en tu ubicación, clima y tipo de terreno.',
            icon: 'leaf',
            color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            size: 'normal',
            delay: '100ms'
        },
        {
            title: 'Cronograma de Siembra',
            description: 'Programa de actividades y fecha estimada de cosecha.',
            icon: 'calendar',
            color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            size: 'normal',
            delay: '200ms'
        },
        {
            title: 'Tips por Ubicación',
            description: 'Consejos adaptados a la temporada y condiciones de tu región.',
            icon: 'location',
            color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
            size: 'wide',
            delay: '300ms'
        },
        {
            title: 'Comunidad Agricultora',
            description: 'Conecta con otros usuarios, comparte experiencias y aprende.',
            icon: 'users',
            color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            size: 'tall',
            delay: '400ms'
        },
        {
            title: 'Soporte 24/7',
            description: 'Asistencia disponible cuando la necesites, siempre.',
            icon: 'support',
            color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
            size: 'normal',
            delay: '500ms'
        },
        // Duplicados para el loop infinito
        {
            title: 'Asistente IA',
            description: 'Inteligencia artificial que analiza tu zona y te guía paso a paso.',
            icon: 'brain',
            color: 'linear-gradient(135deg, #00C9A7 0%, #00D4A1 100%)',
            size: 'large',
            delay: '0ms'
        },
        {
            title: 'Cultivos Personalizados',
            description: 'Recomendaciones basadas en tu ubicación, clima y tipo de terreno.',
            icon: 'leaf',
            color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            size: 'normal',
            delay: '100ms'
        },
        {
            title: 'Cronograma de Siembra',
            description: 'Programa de actividades y fecha estimada de cosecha.',
            icon: 'calendar',
            color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            size: 'normal',
            delay: '200ms'
        },
        {
            title: 'Tips por Ubicación',
            description: 'Consejos adaptados a la temporada y condiciones de tu región.',
            icon: 'location',
            color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
            size: 'wide',
            delay: '300ms'
        },
        {
            title: 'Comunidad Agricultora',
            description: 'Conecta con otros usuarios, comparte experiencias y aprende.',
            icon: 'users',
            color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            size: 'tall',
            delay: '400ms'
        },
        {
            title: 'Soporte 24/7',
            description: 'Asistencia disponible cuando la necesites, siempre.',
            icon: 'support',
            color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
            size: 'normal',
            delay: '500ms'
        }
    ];

    private animationId: number | null = null;
    private isDown = false;
    private startX: number = 0;
    private scrollLeft: number = 0;
    private autoScrollSpeed = 0.5; // pixels per frame

    ngAfterViewInit() {
        this.startAutoScroll();
    }

    ngOnDestroy() {
        this.stopAutoScroll();
    }

    // --- AUTO SCROLL ---
    startAutoScroll() {
        // Prevent multiple loops
        if (this.animationId) return;

        const animate = () => {
            if (!this.scrollContainer) return;
            const el = this.scrollContainer.nativeElement;

            // Increment scroll
            el.scrollLeft += this.autoScrollSpeed;

            // Infinite loop logic: If we reached the middle (end of first set), snap back to start
            // We assume the content is duplicated. reset when we scroll nearly half the width
            if (el.scrollLeft >= (el.scrollWidth / 2)) {
                el.scrollLeft = 0;
            }

            this.animationId = requestAnimationFrame(animate);
        };

        this.animationId = requestAnimationFrame(animate);
    }

    stopAutoScroll() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    // --- MOUSE DRAG HANDLERS ---
    onMouseDown(e: MouseEvent) {
        this.isDown = true;
        this.stopAutoScroll(); // Stop auto moving while dragging
        this.scrollContainer.nativeElement.classList.add('active');
        this.startX = e.pageX - this.scrollContainer.nativeElement.offsetLeft;
        this.scrollLeft = this.scrollContainer.nativeElement.scrollLeft;
    }

    onMouseLeave() {
        this.isDown = false;
        this.scrollContainer.nativeElement.classList.remove('active');
        this.startAutoScroll(); // Resume auto
    }

    onMouseUp() {
        this.isDown = false;
        this.scrollContainer.nativeElement.classList.remove('active');
        this.startAutoScroll(); // Resume auto
    }

    onMouseMove(e: MouseEvent) {
        if (!this.isDown) return;
        e.preventDefault();
        const x = e.pageX - this.scrollContainer.nativeElement.offsetLeft;
        const walk = (x - this.startX) * 2; // Scroll-fast factor
        this.scrollContainer.nativeElement.scrollLeft = this.scrollLeft - walk;
    }
}
