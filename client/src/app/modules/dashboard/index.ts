import { Routes } from '@angular/router';
import { authGuard } from '@shared/utils/route-guards';
import { DashboardPage } from './components/dashboard-page';

/** The signed-in home screen. Lazy-loaded from app.routes.ts. */
export const DASHBOARD_ROUTES: Routes = [
  { path: '', title: 'Gӓdӓt', canActivate: [authGuard], component: DashboardPage },
];
