import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, of } from 'rxjs';
import { AppStore } from '../stores/app-store';
import { HOME_URL, UNLOCK_URL } from '../constants/app-constants';
import { SessionService } from '../services/session-service';

/** Home needs a session. The first navigation asks /api/auth/me; later ones reuse the answer. */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const state = inject(AppStore);
  const unlock = router.parseUrl(UNLOCK_URL);
  if (state.signedIn() === true) return of(true);
  return inject(SessionService)
    .check()
    .pipe(map((signedIn) => signedIn || unlock));
};

/** Unlock and Set up are for signed-out visitors; signed-in ones go straight home. */
export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  const state = inject(AppStore);
  const home = router.parseUrl(HOME_URL);
  if (state.signedIn() === true) return of(home);
  return inject(SessionService)
    .check()
    .pipe(map((signedIn) => (signedIn ? home : true)));
};
