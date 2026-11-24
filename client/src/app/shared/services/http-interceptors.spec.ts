import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UNLOCK_URL } from '../constants/app-constants';
import { AppStore } from '../stores/app-store';
import { credentialsInterceptor, unauthorizedInterceptor } from './http-interceptors';

describe('http interceptors', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let store: AppStore;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([credentialsInterceptor, unauthorizedInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigateByUrl: navigate } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    store = TestBed.inject(AppStore);
    store.signedIn.set(true);
  });

  afterEach(() => backend.verify());

  describe('credentialsInterceptor', () => {
    it('sends cookies and a JSON content type on writes to the API', () => {
      http.post('/api/habits', {}).subscribe();
      const req = backend.expectOne('/api/habits');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush({});
    });

    it('sends cookies on reads without forcing a content type', () => {
      http.get('/api/habits').subscribe();
      const req = backend.expectOne('/api/habits');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.headers.has('Content-Type')).toBe(false);
      req.flush([]);
    });

    it('leaves requests to other origins alone', () => {
      http.post('https://example.com/api/habits', {}).subscribe();
      const req = backend.expectOne('https://example.com/api/habits');
      expect(req.request.withCredentials).toBe(false);
      req.flush({});
    });
  });

  describe('unauthorizedInterceptor', () => {
    it('signs the user out and goes to the unlock page when the session is gone', async () => {
      const result = firstValueFrom(http.get('/api/habits'));
      backend.expectOne('/api/habits').flush({}, { status: 401, statusText: 'Unauthorized' });
      await expect(result).rejects.toMatchObject({ status: 401 });
      expect(store.signedIn()).toBe(false);
      expect(navigate).toHaveBeenCalledWith(UNLOCK_URL);
    });

    it('does not redirect when an auth call itself fails with 401', async () => {
      const result = firstValueFrom(http.post('/api/auth/recovery', { code: 'x' }));
      backend
        .expectOne('/api/auth/recovery')
        .flush({}, { status: 401, statusText: 'Unauthorized' });
      await expect(result).rejects.toMatchObject({ status: 401 });
      expect(store.signedIn()).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('passes other errors through without signing out', async () => {
      const result = firstValueFrom(http.get('/api/habits'));
      backend.expectOne('/api/habits').flush({}, { status: 500, statusText: 'Server Error' });
      await expect(result).rejects.toMatchObject({ status: 500 });
      expect(store.signedIn()).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
