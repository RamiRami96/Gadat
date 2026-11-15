import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, firstValueFrom, map, Observable, of, tap } from 'rxjs';
import { AppStore } from '../stores/app-store';
import { api } from './api-service';

/** The session cookie from the app's point of view: is it valid, and how to end it. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AppStore);

  /** Asks the server whether the session cookie is still valid. */
  check(): Observable<boolean> {
    return this.http.get<{ id: string }>(api('/auth/me')).pipe(
      map(() => true),
      catchError(() => of(false)),
      tap((signedIn) => this.store.signedIn.set(signedIn)),
    );
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(api('/auth/logout'), {}));
    } finally {
      this.store.signedIn.set(false);
    }
  }
}
