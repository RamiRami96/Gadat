import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, isObservable, Observable } from 'rxjs';
import { HOME_URL, UNLOCK_URL } from '../constants/app-constants';
import { AppStore } from '../stores/app-store';
import { authGuard, guestGuard } from './route-guards';

describe('route guards', () => {
  let backend: HttpTestingController;
  let store: AppStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    backend = TestBed.inject(HttpTestingController);
    store = TestBed.inject(AppStore);
  });

  afterEach(() => backend.verify());

  function run(guard: CanActivateFn): Promise<boolean | UrlTree> {
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    if (!isObservable(result)) throw new Error('guard should return an observable');
    return firstValueFrom(result as Observable<boolean | UrlTree>);
  }

  function answerMe(status: number): void {
    backend.expectOne('/api/auth/me').flush({ id: 'u' }, { status, statusText: String(status) });
  }

  describe('authGuard', () => {
    it('lets a known signed-in user through without asking the server', async () => {
      store.signedIn.set(true);
      await expect(run(authGuard)).resolves.toBe(true);
    });

    it('checks the session when the state is unknown, and lets a valid one in', async () => {
      const result = run(authGuard);
      answerMe(200);
      await expect(result).resolves.toBe(true);
      expect(store.signedIn()).toBe(true);
    });

    it('sends a visitor without a session to the unlock page', async () => {
      const result = run(authGuard);
      answerMe(401);
      const outcome = await result;
      expect(outcome).toBeInstanceOf(UrlTree);
      expect(TestBed.inject(Router).serializeUrl(outcome as UrlTree)).toBe(UNLOCK_URL);
      expect(store.signedIn()).toBe(false);
    });
  });

  describe('guestGuard', () => {
    it('sends a signed-in user home', async () => {
      store.signedIn.set(true);
      const outcome = await run(guestGuard);
      expect(TestBed.inject(Router).serializeUrl(outcome as UrlTree)).toBe(HOME_URL);
    });

    it('lets a visitor without a session see the unlock page', async () => {
      const result = run(guestGuard);
      answerMe(401);
      await expect(result).resolves.toBe(true);
    });

    it('sends a visitor with a valid session home', async () => {
      const result = run(guestGuard);
      answerMe(200);
      const outcome = await result;
      expect(TestBed.inject(Router).serializeUrl(outcome as UrlTree)).toBe(HOME_URL);
    });
  });
});
