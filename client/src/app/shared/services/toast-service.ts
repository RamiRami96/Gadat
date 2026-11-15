import { Injectable, signal } from '@angular/core';
import { TOAST_DURATION_MS } from '../constants/app-constants';
import type { Toast } from '../models/shared-models';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 1;

  show(message: string, durationMs = TOAST_DURATION_MS): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
