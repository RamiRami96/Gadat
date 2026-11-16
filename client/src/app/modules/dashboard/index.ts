import { Routes } from '@angular/router';
import { authGuard } from '@shared/utils/route-guards';
import { DashboardPage } from './components/dashboard-page';

export const DASHBOARD_ROUTES: Routes = [
  { path: '', title: 'Gӓdӓt', canActivate: [authGuard], component: DashboardPage },
];
