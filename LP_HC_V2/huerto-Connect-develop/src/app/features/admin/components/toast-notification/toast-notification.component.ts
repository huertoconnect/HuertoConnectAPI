import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
    leaving?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private listener: ((toast: Toast) => void) | null = null;
    private idCounter = 0;

    register(fn: (toast: Toast) => void) {
        this.listener = fn;
    }

    show(message: string, type: ToastType = 'success') {
        const toast: Toast = { id: ++this.idCounter, message, type };
        this.listener?.(toast);
    }

    success(message: string) { this.show(message, 'success'); }
    error(message: string) { this.show(message, 'error'); }
    warning(message: string) { this.show(message, 'warning'); }
    info(message: string) { this.show(message, 'info'); }
}

@Component({
    selector: 'app-toast-notification',
    standalone: true,
    imports: [CommonModule],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toasts; trackBy: trackById"
        class="toast"
        [class.success]="toast.type === 'success'"
        [class.error]="toast.type === 'error'"
        [class.warning]="toast.type === 'warning'"
        [class.info]="toast.type === 'info'"
        [class.leaving]="toast.leaving"
      >
        <div class="toast-icon">
          <ion-icon [name]="getIcon(toast.type)"></ion-icon>
        </div>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" (click)="dismiss(toast)">
          <ion-icon name="close-outline"></ion-icon>
        </button>
      </div>
    </div>
  `,
    styleUrls: ['./toast-notification.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastNotificationComponent {
    toasts: Toast[] = [];

    constructor(
        private readonly toastService: ToastService,
        private readonly cdr: ChangeDetectorRef
    ) {
        this.toastService.register((toast) => this.addToast(toast));
    }

    trackById(_: number, toast: Toast): number {
        return toast.id;
    }

    getIcon(type: ToastType): string {
        switch (type) {
            case 'success': return 'checkmark-circle-outline';
            case 'error': return 'alert-circle-outline';
            case 'warning': return 'warning-outline';
            case 'info': return 'information-circle-outline';
        }
    }

    addToast(toast: Toast) {
        this.toasts = [...this.toasts, toast];
        this.cdr.markForCheck();

        setTimeout(() => this.dismiss(toast), 4000);
    }

    dismiss(toast: Toast) {
        this.toasts = this.toasts.map((t) =>
            t.id === toast.id ? { ...t, leaving: true } : t
        );
        this.cdr.markForCheck();

        setTimeout(() => {
            this.toasts = this.toasts.filter((t) => t.id !== toast.id);
            this.cdr.markForCheck();
        }, 350);
    }
}
