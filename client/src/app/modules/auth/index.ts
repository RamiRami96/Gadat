import { Routes } from '@angular/router';
import { guestGuard } from '@shared/utils/route-guards';

/** Unlock, Set up and recovery. Lazy-loaded from app.routes.ts. */
export const AUTH_ROUTES: Routes = [
  {
    path: 'unlock',
    title: 'Unlock · Gӓdӓt',
    canActivate: [guestGuard],
    loadComponent: () => import('./components/unlock-page').then((m) => m.UnlockPage),
  },
  {
    path: 'setup',
    title: 'Set up · Gӓdӓt',
    canActivate: [guestGuard],
    loadComponent: () => import('./components/setup-page').then((m) => m.SetupPage),
  },
];
