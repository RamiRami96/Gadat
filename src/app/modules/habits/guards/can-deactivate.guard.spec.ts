import { TestBed } from '@angular/core/testing';
import { canDeactivateGuard, CanDeactivateComponent } from './can-deactivate.guard';

describe('canDeactivateGuard', () => {
  let mockComponent: jasmine.SpyObj<CanDeactivateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    mockComponent = jasmine.createSpyObj('CanDeactivateComponent', ['canDeactivate']);
  });

  describe('when component has canDeactivate method', () => {
    it('should return true when component canDeactivate returns true', () => {
      mockComponent.canDeactivate.and.returnValue(true);

      const result = canDeactivateGuard(mockComponent, null as any, null as any, null as any);

      expect(result).toBe(true);
      expect(mockComponent.canDeactivate).toHaveBeenCalled();
    });

    it('should return false when component canDeactivate returns false', () => {
      mockComponent.canDeactivate.and.returnValue(false);

      const result = canDeactivateGuard(mockComponent, null as any, null as any, null as any);

      expect(result).toBe(false);
      expect(mockComponent.canDeactivate).toHaveBeenCalled();
    });

    it('should return Promise<true> when component canDeactivate returns Promise<true>', async () => {
      mockComponent.canDeactivate.and.returnValue(Promise.resolve(true));

      const result = canDeactivateGuard(mockComponent, null as any, null as any, null as any);

      expect(result).toBeInstanceOf(Promise);
      const resolvedResult = await result;
      expect(resolvedResult).toBe(true);
      expect(mockComponent.canDeactivate).toHaveBeenCalled();
    });

    it('should return Promise<false> when component canDeactivate returns Promise<false>', async () => {
      mockComponent.canDeactivate.and.returnValue(Promise.resolve(false));

      const result = canDeactivateGuard(mockComponent, null as any, null as any, null as any);

      expect(result).toBeInstanceOf(Promise);
      const resolvedResult = await result;
      expect(resolvedResult).toBe(false);
      expect(mockComponent.canDeactivate).toHaveBeenCalled();
    });

    it('should call canDeactivate method exactly once', () => {
      mockComponent.canDeactivate.and.returnValue(true);

      canDeactivateGuard(mockComponent, null as any, null as any, null as any);

      expect(mockComponent.canDeactivate).toHaveBeenCalledTimes(1);
    });
  });

  describe('when component does not have canDeactivate method', () => {
    it('should return true when component is null', () => {
      const result = canDeactivateGuard(null as any, null as any, null as any, null as any);

      expect(result).toBe(true);
    });

    it('should return true when component is undefined', () => {
      const result = canDeactivateGuard(undefined as any, null as any, null as any, null as any);

      expect(result).toBe(true);
    });

    it('should return true when component does not implement CanDeactivateComponent', () => {
      const simpleComponent = {};

      const result = canDeactivateGuard(simpleComponent as any, null as any, null as any, null as any);

      expect(result).toBe(true);
    });

    it('should return true when component canDeactivate is undefined', () => {
      const componentWithoutMethod = { canDeactivate: undefined } as any;

      const result = canDeactivateGuard(componentWithoutMethod, null as any, null as any, null as any);

      expect(result).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle exceptions thrown by canDeactivate method', () => {
      mockComponent.canDeactivate.and.throwError('Component error');

      expect(() => {
        canDeactivateGuard(mockComponent, null as any, null as any, null as any);
      }).toThrow('Component error');
    });

    it('should handle rejected promises from canDeactivate method', async () => {
      mockComponent.canDeactivate.and.returnValue(Promise.reject('Promise rejection'));

      const result = canDeactivateGuard(mockComponent, null as any, null as any, null as any);

      await expectAsync(result).toBeRejectedWith('Promise rejection');
    });

    it('should handle canDeactivate method that returns non-boolean values', () => {
      mockComponent.canDeactivate.and.returnValue('invalid' as any);

      const result = canDeactivateGuard(mockComponent, null as any, null as any, null as any);

      expect(result as any).toBe('invalid');
      expect(mockComponent.canDeactivate).toHaveBeenCalled();
    });
  });

  describe('async behavior', () => {
    it('should handle delayed promise resolution', async () => {
      let resolvePromise: (value: boolean) => void;
      const delayedPromise = new Promise<boolean>((resolve) => {
        resolvePromise = resolve;
      });

      mockComponent.canDeactivate.and.returnValue(delayedPromise);

      const resultPromise = canDeactivateGuard(mockComponent, null as any, null as any, null as any);
      
      // Resolve the promise after a delay
      setTimeout(() => resolvePromise!(true), 10);

      const result = await resultPromise;
      expect(result).toBe(true);
    });

    it('should handle multiple async calls', async () => {
      mockComponent.canDeactivate.and.returnValue(Promise.resolve(true));

      const results = await Promise.all([
        canDeactivateGuard(mockComponent, null as any, null as any, null as any),
        canDeactivateGuard(mockComponent, null as any, null as any, null as any),
        canDeactivateGuard(mockComponent, null as any, null as any, null as any)
      ]);

      expect(results).toEqual([true, true, true]);
      expect(mockComponent.canDeactivate).toHaveBeenCalledTimes(3);
    });
  });

  describe('component interface compliance', () => {
    it('should work with properly implemented CanDeactivateComponent', () => {
      const properComponent: CanDeactivateComponent = {
        canDeactivate: () => true
      };

      const result = canDeactivateGuard(properComponent, null as any, null as any, null as any);

      expect(result).toBe(true);
    });

    it('should work with async CanDeactivateComponent implementation', async () => {
      const asyncComponent: CanDeactivateComponent = {
        canDeactivate: async () => {
          await new Promise(resolve => setTimeout(resolve, 1));
          return false;
        }
      };

      const result = await canDeactivateGuard(asyncComponent, null as any, null as any, null as any);

      expect(result).toBe(false);
    });
  });
});
