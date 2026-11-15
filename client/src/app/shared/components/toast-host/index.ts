import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast-service';

@Component({
  selector: 'app-toast-host',
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 bottom-4 z-[1000] flex flex-col items-center gap-2 px-4"
      role="status"
      aria-live="polite"
    >
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          <span>{{ toast.message }}</span>
          <button
            type="button"
            class="-mr-2 min-h-11 min-w-11 rounded-xl text-white/80 hover:text-white"
            aria-label="Dismiss"
            (click)="toasts.dismiss(toast.id)"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  protected readonly toasts = inject(ToastService);
}
