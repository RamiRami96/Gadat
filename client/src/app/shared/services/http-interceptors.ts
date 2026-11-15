import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { isApiUrl } from './api-service';
import { MUTATING_METHODS, UNLOCK_URL } from '../constants/app-constants';
import { AppStore } from '../stores/app-store';

/**
 * Every API request carries the session cookie (withCredentials). Mutating requests always say they
 * are JSON, because the server rejects anything else (a CSRF defence).
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiUrl(req.url)) return next(req);
  const headers = MUTATING_METHODS.has(req.method)
    ? req.headers.set('Content-Type', 'application/json')
    : req.headers;
  return next(req.clone({ withCredentials: true, headers }));
};

/** A 401 from any data request means the session is gone: go back to the unlock screen. */
export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const state = inject(AppStore);
  const router = inject(Router);
  return next(req).pipe(
    catchError((error: unknown) => {
      const isAuthCall = req.url.includes('/auth/');
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthCall) {
        state.signedIn.set(false);
        void router.navigateByUrl(UNLOCK_URL);
      }
      return throwError(() => error);
    }),
  );
};
