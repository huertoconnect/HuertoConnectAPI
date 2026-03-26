import { Component, HostListener, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
    isScrolled = false;
    isMenuOpen = false;
    activeSection = '';

    links = [
        { label: 'Nosotros', sectionId: 'about' },
        { label: 'Servicios', sectionId: 'services' },
        { label: 'Proceso', sectionId: 'process' },
        { label: 'Testimonios', sectionId: 'testimonials' },
        { label: 'FAQ', sectionId: 'faq' },
        { label: 'Contáctanos', sectionId: 'contact' }
    ];

    @HostListener('window:scroll', [])
    onWindowScroll() {
        this.isScrolled = window.scrollY > 20;
    }

    constructor(private ngZone: NgZone) { }

    ngAfterViewInit() {
        const observerOptions = {
            root: null,
            rootMargin: '-50% 0px -50% 0px', // Center line detection for better accuracy
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            this.ngZone.run(() => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.activeSection = entry.target.id;
                    }
                });
            });
        }, observerOptions);

        // Sections to observe
        const sectionsIds = ['hero', 'about', 'services', 'process', 'testimonials', 'faq', 'contact'];

        // Retry logic to ensure elements are in the DOM (handling router delays)
        let attempts = 0;
        const maxAttempts = 10;

        const initObserver = () => {
            const foundElements = sectionsIds.filter(id => document.getElementById(id));

            if (foundElements.length > 0) {
                // If we found at least some, start observing
                sectionsIds.forEach(sectionId => {
                    const element = document.getElementById(sectionId);
                    if (element) {
                        observer.observe(element);
                    }
                });
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(initObserver, 500); // Retry every 500ms
            }
        };

        initObserver();
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
    }

    scrollToSection(sectionId: string) {
        this.isMenuOpen = false;
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            // Manually set active after click to give immediate feedback
            // though observer will catch up
        }
    }
}
