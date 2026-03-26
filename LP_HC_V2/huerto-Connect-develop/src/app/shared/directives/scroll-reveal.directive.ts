import { Directive, ElementRef, OnInit, OnDestroy, Input } from '@angular/core';

@Directive({
    selector: '[appScrollReveal]',
    standalone: true
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
    /** Animation direction: 'up' | 'down' | 'left' | 'right' */
    @Input() revealDirection: 'up' | 'down' | 'left' | 'right' = 'up';
    /** Delay in ms before reveal starts */
    @Input() revealDelay = 0;
    /** Distance in px the element travels */
    @Input() revealDistance = 40;
    /** Duration in ms */
    @Input() revealDuration = 700;
    /** Threshold 0-1: how much of the element must be visible */
    @Input() revealThreshold = 0.12;

    private observer: IntersectionObserver | null = null;

    constructor(private el: ElementRef<HTMLElement>) { }

    ngOnInit() {
        const element = this.el.nativeElement;

        // Set initial hidden state
        element.style.opacity = '0';
        element.style.transition = `opacity ${this.revealDuration}ms cubic-bezier(0.22, 1, 0.36, 1) ${this.revealDelay}ms, transform ${this.revealDuration}ms cubic-bezier(0.22, 1, 0.36, 1) ${this.revealDelay}ms`;

        const d = this.revealDistance;
        switch (this.revealDirection) {
            case 'up':
                element.style.transform = `translateY(${d}px)`;
                break;
            case 'down':
                element.style.transform = `translateY(-${d}px)`;
                break;
            case 'left':
                element.style.transform = `translateX(${d}px)`;
                break;
            case 'right':
                element.style.transform = `translateX(-${d}px)`;
                break;
        }

        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        element.style.opacity = '1';
                        element.style.transform = 'translate(0, 0)';
                        // Stop observing once revealed
                        this.observer?.unobserve(element);
                    }
                });
            },
            {
                threshold: this.revealThreshold,
                rootMargin: '0px 0px -40px 0px'
            }
        );

        this.observer.observe(element);
    }

    ngOnDestroy() {
        this.observer?.disconnect();
    }
}
