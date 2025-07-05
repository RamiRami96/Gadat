import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { habitExistsGuard } from './shared/guards/habit-exists.guard';
import { canDeactivateGuard } from './shared/guards/can-deactivate.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Gadat - Home',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
    title: 'Gadat - Login',
  },
  {
    path: 'habits',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/habits-page/habits-page.component').then(m => m.HabitsPageComponent),
        title: 'Gadat - My Habits',
      },
      {
        path: 'create',
        loadComponent: () => import('./features/habit-form/habit-form.component').then(m => m.HabitFormComponent),
        canDeactivate: [canDeactivateGuard],
        title: 'Gadat - Create Habit',
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('./features/habit-form/habit-form.component').then(m => m.HabitFormComponent),
        canActivate: [habitExistsGuard],
        canDeactivate: [canDeactivateGuard],
        title: 'Gadat - Edit Habit',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
