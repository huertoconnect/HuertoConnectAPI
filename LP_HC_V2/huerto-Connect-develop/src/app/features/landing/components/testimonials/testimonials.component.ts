import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, Testimonial } from '../../../../core/services/data.service';
import { createFloatingLeaves, FloatingLeaf } from '../../../../shared/ui-effects/parallax-leaves.util';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';

@Component({
    selector: 'app-testimonials',
    standalone: true,
    imports: [CommonModule, ScrollRevealDirective],
    templateUrl: './testimonials.component.html',
    styleUrls: ['./testimonials.component.scss']
})
export class TestimonialsComponent implements OnInit, OnDestroy {
    readonly leaves: FloatingLeaf[] = createFloatingLeaves(12, 7307);
    testimonials: Testimonial[] = [];
    currentIndex = 0;
    private intervalId: ReturnType<typeof setInterval> | null = null;

    constructor(
        private dataService: DataService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.dataService.getTestimonials().subscribe(data => {
            this.testimonials = data;
            this.startAutoplay();
        });
    }

    ngOnDestroy(): void {
        this.stopAutoplay();
    }

    private startAutoplay(): void {
        this.stopAutoplay();

        if (this.testimonials.length <= 1) return;

        this.intervalId = setInterval(() => {
            this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
            this.cdr.detectChanges();
        }, 5000);
    }

    private stopAutoplay(): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    onArrowClick(direction: 'prev' | 'next'): void {
        this.stopAutoplay();

        if (direction === 'prev') {
            this.currentIndex = (this.currentIndex - 1 + this.testimonials.length) % this.testimonials.length;
        } else {
            this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
        }

        this.startAutoplay();
    }

    goTo(index: number): void {
        this.stopAutoplay();
        this.currentIndex = index;
        this.startAutoplay();
    }
}
