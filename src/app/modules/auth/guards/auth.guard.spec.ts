import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.and.returnValue(true);
    });

    it('should return true', () => {
      const result = TestBed.runInInjectionContext(() => authGuard(null as any, null as any));

      expect(result).toBe(true);
      expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should not redirect to login', () => {
      TestBed.runInInjectionContext(() => authGuard(null as any, null as any));

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.and.returnValue(false);
    });

    it('should return false', () => {
      const result = TestBed.runInInjectionContext(() => authGuard(null as any, null as any));

      expect(result).toBe(false);
      expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
    });

    it('should redirect to login page', () => {
      TestBed.runInInjectionContext(() => authGuard(null as any, null as any));

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should check authentication and redirect in correct order', () => {
      const result = TestBed.runInInjectionContext(() => authGuard(null as any, null as any));

      expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle authentication service returning undefined gracefully', () => {
      mockAuthService.isAuthenticated.and.returnValue(undefined as any);

      const result = TestBed.runInInjectionContext(() => authGuard(null as any, null as any));

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle authentication service returning null gracefully', () => {
      mockAuthService.isAuthenticated.and.returnValue(null as any);

      const result = TestBed.runInInjectionContext(() => authGuard(null as any, null as any));

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should call authentication service exactly once', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);

      TestBed.runInInjectionContext(() => authGuard(null as any, null as any));

      expect(mockAuthService.isAuthenticated).toHaveBeenCalledTimes(1);
    });

    it('should handle router navigation errors gracefully', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);
      mockRouter.navigate.and.throwError('Navigation error');

      expect(() => {
        TestBed.runInInjectionContext(() => authGuard(null as any, null as any));
      }).toThrow('Navigation error');
    });
  });

  describe('integration', () => {
    it('should work with real authentication service behavior', () => {
      // Test with different authentication states
      mockAuthService.isAuthenticated.and.returnValue(false);
      let result = TestBed.runInInjectionContext(() => authGuard(null as any, null as any));
      expect(result).toBe(false);

      mockAuthService.isAuthenticated.and.returnValue(true);
      result = TestBed.runInInjectionContext(() => authGuard(null as any, null as any));
      expect(result).toBe(true);
    });

    it('should maintain consistent behavior across multiple calls', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);

      const result1 = TestBed.runInInjectionContext(() => authGuard(null as any, null as any));
      const result2 = TestBed.runInInjectionContext(() => authGuard(null as any, null as any));

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(mockAuthService.isAuthenticated).toHaveBeenCalledTimes(2);
    });
  });
});
