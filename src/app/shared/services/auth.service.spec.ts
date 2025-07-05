import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      return mockLocalStorage[key] || null;
    });
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete mockLocalStorage[key];
    });

    TestBed.configureTestingModule({});
  });

  describe('initialization', () => {
    it('should be created', () => {
      service = TestBed.inject(AuthService);
      expect(service).toBeTruthy();
    });

    it('should initialize as not authenticated when localStorage is empty', () => {
      service = TestBed.inject(AuthService);
      
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should initialize as authenticated when localStorage has true value', () => {
      mockLocalStorage['isAuthenticated'] = 'true';
      service = TestBed.inject(AuthService);
      
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should initialize as not authenticated when localStorage has false value', () => {
      mockLocalStorage['isAuthenticated'] = 'false';
      service = TestBed.inject(AuthService);
      
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should initialize as not authenticated when localStorage has invalid value', () => {
      mockLocalStorage['isAuthenticated'] = 'invalid';
      service = TestBed.inject(AuthService);
      
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should check localStorage on initialization', () => {
      service = TestBed.inject(AuthService);
      
      expect(localStorage.getItem).toHaveBeenCalledWith('isAuthenticated');
    });
  });

  describe('isAuthenticated getter', () => {
    beforeEach(() => {
      service = TestBed.inject(AuthService);
    });

    it('should return a readonly signal', () => {
      const authSignal = service.isAuthenticated;
      
      expect(typeof authSignal).toBe('function');
      expect(typeof authSignal()).toBe('boolean');
    });

    it('should be reactive to authentication state changes', () => {
      expect(service.isAuthenticated()).toBe(false);
      
      service.login('admin', 'password');
      
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should reflect current authentication state', () => {
      // Initially false
      expect(service.isAuthenticated()).toBe(false);
      
      // After login
      service.login('admin', 'password');
      expect(service.isAuthenticated()).toBe(true);
      
      // After logout
      service.logout();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('login method', () => {
    beforeEach(() => {
      service = TestBed.inject(AuthService);
    });

    it('should return true for valid credentials', () => {
      const result = service.login('admin', 'password');
      
      expect(result).toBe(true);
    });

    it('should return false for invalid username', () => {
      const result = service.login('invalid', 'password');
      
      expect(result).toBe(false);
    });

    it('should return false for invalid password', () => {
      const result = service.login('admin', 'invalid');
      
      expect(result).toBe(false);
    });

    it('should return false for both invalid credentials', () => {
      const result = service.login('invalid', 'invalid');
      
      expect(result).toBe(false);
    });

    it('should return false for empty credentials', () => {
      const result = service.login('', '');
      
      expect(result).toBe(false);
    });

    it('should return false for null credentials', () => {
      const result = service.login(null as any, null as any);
      
      expect(result).toBe(false);
    });

    it('should return false for undefined credentials', () => {
      const result = service.login(undefined as any, undefined as any);
      
      expect(result).toBe(false);
    });

    it('should set isAuthenticated to true on successful login', () => {
      service.login('admin', 'password');
      
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should not change isAuthenticated on failed login', () => {
      expect(service.isAuthenticated()).toBe(false);
      
      service.login('invalid', 'invalid');
      
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should save authentication state to localStorage on successful login', () => {
      service.login('admin', 'password');
      
      expect(localStorage.setItem).toHaveBeenCalledWith('isAuthenticated', 'true');
    });

    it('should not save to localStorage on failed login', () => {
      service.login('invalid', 'invalid');
      
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should be case sensitive for username', () => {
      const result = service.login('Admin', 'password');
      
      expect(result).toBe(false);
    });

    it('should be case sensitive for password', () => {
      const result = service.login('admin', 'Password');
      
      expect(result).toBe(false);
    });

    it('should handle whitespace in credentials', () => {
      const result = service.login(' admin ', ' password ');
      
      expect(result).toBe(false);
    });

    it('should allow multiple successful logins', () => {
      const result1 = service.login('admin', 'password');
      const result2 = service.login('admin', 'password');
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should update localStorage on subsequent logins', () => {
      service.login('admin', 'password');
      service.logout();
      service.login('admin', 'password');
      
      expect(localStorage.setItem).toHaveBeenCalledTimes(2);
      expect(localStorage.setItem).toHaveBeenCalledWith('isAuthenticated', 'true');
    });
  });

  describe('logout method', () => {
    beforeEach(() => {
      service = TestBed.inject(AuthService);
    });

    it('should set isAuthenticated to false', () => {
      // First login
      service.login('admin', 'password');
      expect(service.isAuthenticated()).toBe(true);
      
      // Then logout
      service.logout();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should remove authentication state from localStorage', () => {
      service.login('admin', 'password');
      
      service.logout();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('isAuthenticated');
    });

    it('should be safe to call when not authenticated', () => {
      expect(service.isAuthenticated()).toBe(false);
      
      expect(() => service.logout()).not.toThrow();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should be callable multiple times safely', () => {
      service.login('admin', 'password');
      
      service.logout();
      service.logout();
      
      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.removeItem).toHaveBeenCalledWith('isAuthenticated');
    });

    it('should not return any value', () => {
      const result = service.logout();
      
      expect(result).toBeUndefined();
    });

    it('should update signal immediately', () => {
      service.login('admin', 'password');
      expect(service.isAuthenticated()).toBe(true);
      
      service.logout();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should clear localStorage even if signal is already false', () => {
      // Manually set localStorage without going through login
      mockLocalStorage['isAuthenticated'] = 'true';
      
      service.logout();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('isAuthenticated');
    });
  });

  describe('authentication persistence', () => {
    it('should persist authentication state across service instances', () => {
      // First instance - login
      service = TestBed.inject(AuthService);
      service.login('admin', 'password');
      
      // Simulate new service instance (page reload)
      mockLocalStorage['isAuthenticated'] = 'true';
      const newService = TestBed.inject(AuthService);
      
      expect(newService.isAuthenticated()).toBe(true);
    });

    it('should not be authenticated in new instance after logout', () => {
      // First instance - login then logout
      service = TestBed.inject(AuthService);
      service.login('admin', 'password');
      service.logout();
      
      // Simulate new service instance
      const newService = TestBed.inject(AuthService);
      
      expect(newService.isAuthenticated()).toBe(false);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage['isAuthenticated'] = 'corrupted_data';
      
      service = TestBed.inject(AuthService);
      
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('mock credentials validation', () => {
    beforeEach(() => {
      service = TestBed.inject(AuthService);
    });

    it('should use hardcoded mock credentials', () => {
      // These tests verify the mock credentials are working as expected
      expect(service.login('admin', 'password')).toBe(true);
      expect(service.login('admin', 'wrong')).toBe(false);
      expect(service.login('wrong', 'password')).toBe(false);
    });

    it('should not accept any other valid-looking credentials', () => {
      const invalidCredentials = [
        ['user', 'pass'],
        ['test', 'test'],
        ['admin123', 'password123'],
        ['administrator', 'password']
      ];

      invalidCredentials.forEach(([username, password]) => {
        expect(service.login(username, password)).toBe(false);
      });
    });
  });

  describe('signal behavior', () => {
    beforeEach(() => {
      service = TestBed.inject(AuthService);
    });

    it('should provide readonly signal', () => {
      const authSignal = service.isAuthenticated;
      
      // Signal should be readonly - we can't set it directly
      expect(() => {
        (authSignal as any).set(true);
      }).toThrow();
    });

    it('should notify signal changes during login/logout cycle', () => {
      const values: boolean[] = [];
      
      // Track signal changes
      values.push(service.isAuthenticated());
      
      service.login('admin', 'password');
      values.push(service.isAuthenticated());
      
      service.logout();
      values.push(service.isAuthenticated());
      
      expect(values).toEqual([false, true, false]);
    });
  });

  describe('edge cases and error handling', () => {
    beforeEach(() => {
      service = TestBed.inject(AuthService);
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage.setItem to throw error
      (localStorage.setItem as jasmine.Spy).and.throwError('Storage full');
      
      expect(() => service.login('admin', 'password')).not.toThrow();
      // Authentication should still work in memory
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should handle localStorage.removeItem errors gracefully', () => {
      service.login('admin', 'password');
      
      // Mock localStorage.removeItem to throw error
      (localStorage.removeItem as jasmine.Spy).and.throwError('Storage error');
      
      expect(() => service.logout()).not.toThrow();
      // Authentication should still be cleared in memory
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should handle special characters in credentials', () => {
      const specialChars = ['admin@#$', 'password!@#'];
      
      const result = service.login(specialChars[0], specialChars[1]);
      
      expect(result).toBe(false);
    });

    it('should handle very long credential strings', () => {
      const longString = 'a'.repeat(1000);
      
      const result = service.login(longString, longString);
      
      expect(result).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    beforeEach(() => {
      service = TestBed.inject(AuthService);
    });

    it('should handle complete authentication flow', () => {
      // Initial state
      expect(service.isAuthenticated()).toBe(false);
      
      // Failed login attempt
      expect(service.login('wrong', 'wrong')).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
      
      // Successful login
      expect(service.login('admin', 'password')).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
      
      // Logout
      service.logout();
      expect(service.isAuthenticated()).toBe(false);
      
      // Another successful login
      expect(service.login('admin', 'password')).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should maintain state consistency with localStorage', () => {
      // Login and verify localStorage
      service.login('admin', 'password');
      expect(mockLocalStorage['isAuthenticated']).toBe('true');
      
      // Logout and verify localStorage
      service.logout();
      expect(mockLocalStorage['isAuthenticated']).toBeUndefined();
      
      // Multiple login/logout cycles
      service.login('admin', 'password');
      service.logout();
      service.login('admin', 'password');
      
      expect(service.isAuthenticated()).toBe(true);
      expect(mockLocalStorage['isAuthenticated']).toBe('true');
    });

    it('should handle rapid authentication state changes', () => {
      // Rapid login/logout cycles
      for (let i = 0; i < 5; i++) {
        service.login('admin', 'password');
        expect(service.isAuthenticated()).toBe(true);
        
        service.logout();
        expect(service.isAuthenticated()).toBe(false);
      }
      
      // Final state should be consistent
      expect(service.isAuthenticated()).toBe(false);
      expect(mockLocalStorage['isAuthenticated']).toBeUndefined();
    });
  });
});
