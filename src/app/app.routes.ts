import { Routes } from '@angular/router';
import { authGuard } from './modules/auth/guards/auth.guard';
import { habitExistsGuard } from './modules/habits/guards/habit-exists.guard';
import { canDeactivateGuard } from './modules/habits/guards/can-deactivate.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/habits',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./modules/home').then(m => m.HomeComponent),
    title: 'Gadat - Home',
  },
  {
    path: 'login',
    loadComponent: () => import('./modules/auth').then(m => m.LoginComponent),
    title: 'Gadat - Login',
  },
  {
    path: 'habits',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./modules/habits').then(m => m.HabitsPageComponent),
        title: 'Gadat - My Habits',
      },
      {
        path: 'create',
        loadComponent: () => import('./modules/habits').then(m => m.HabitFormComponent),
        canDeactivate: [canDeactivateGuard],
        title: 'Gadat - Create Habit',
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('./modules/habits').then(m => m.HabitFormComponent),
        canActivate: [habitExistsGuard],
        canDeactivate: [canDeactivateGuard],
        title: 'Gadat - Edit Habit',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/habits',
  },
];
