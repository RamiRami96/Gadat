import { Injectable, signal } from '@angular/core';

/** Whether the session cookie is valid: null until the first /auth/me answer. */
@Injectable({ providedIn: 'root' })
export class AppStore {
  readonly signedIn = signal<boolean | null>(null);
}
