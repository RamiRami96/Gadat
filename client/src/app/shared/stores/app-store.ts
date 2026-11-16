import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppStore {
  readonly signedIn = signal<boolean | null>(null);
}
