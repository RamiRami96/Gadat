import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('./modules/dashboard').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('./modules/auth').then((m) => m.AUTH_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
