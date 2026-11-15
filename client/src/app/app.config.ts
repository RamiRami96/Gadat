import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HabitRepository, HttpHabitRepository } from '@modules/habits';
import {
  credentialsInterceptor,
  unauthorizedInterceptor,
} from '@shared/services/http-interceptors';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([credentialsInterceptor, unauthorizedInterceptor])),
    { provide: HabitRepository, useClass: HttpHabitRepository },
  ],
};
