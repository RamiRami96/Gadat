import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { HabitRepository, HttpHabitRepository } from '@modules/habits';
import {
  credentialsInterceptor,
  unauthorizedInterceptor,
} from '@shared/services/http-interceptors';
import { environment } from '../environments/environment';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, ...(environment.useHash ? [withHashLocation()] : [])),
    provideHttpClient(withInterceptors([credentialsInterceptor, unauthorizedInterceptor])),
    { provide: HabitRepository, useClass: HttpHabitRepository },
  ],
};
