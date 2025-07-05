import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { habitExistsGuard } from './habit-exists.guard';
import { HabitService } from '../../modules/habits/services/habit.service';
import { Habit } from '../../modules/habits/models/habit.model';

describe('habitExistsGuard', () => {
  let mockHabitService: jasmine.SpyObj<HabitService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoute: jasmine.SpyObj<ActivatedRouteSnapshot>;
  let mockParamMap: jasmine.SpyObj<any>;

  const mockHabit: Habit = {
    id: '1',
    name: 'digital detox',
    type: 'health',
    start: new Date('2024-01-01'),
    sprint: [true, false, true, false, false, false, false]
  };

  beforeEach(() => {
    const habitSpy = jasmine.createSpyObj('HabitService', ['getHabit']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const paramMapSpy = jasmine.createSpyObj('ParamMap', ['get']);
    const routeSpy = jasmine.createSpyObj('ActivatedRouteSnapshot', [], {
      paramMap: paramMapSpy
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: HabitService, useValue: habitSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    mockHabitService = TestBed.inject(HabitService) as jasmine.SpyObj<HabitService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockRoute = routeSpy;
    mockParamMap = paramMapSpy;
  });

  describe('when habit exists', () => {
    beforeEach(() => {
      mockParamMap.get.and.returnValue('1');
      mockHabitService.getHabit.and.returnValue(mockHabit);
    });

    it('should return true', () => {
      const result = TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));

      expect(result).toBe(true);
      expect(mockParamMap.get).toHaveBeenCalledWith('id');
      expect(mockHabitService.getHabit).toHaveBeenCalledWith('1');
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should not redirect to habits page', () => {
      TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should check habit existence with correct ID', () => {
      const testId = 'test-habit-id';
      mockParamMap.get.and.returnValue(testId);
      mockHabitService.getHabit.and.returnValue(mockHabit);

      TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));

      expect(mockHabitService.getHabit).toHaveBeenCalledWith(testId);
    });
  });

  describe('when habit does not exist', () => {
    beforeEach(() => {
      mockParamMap.get.and.returnValue('999');
      mockHabitService.getHabit.and.returnValue(null);
    });

    it('should return false', () => {
      const result = TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));

      expect(result).toBe(false);
      expect(mockHabitService.getHabit).toHaveBeenCalledWith('999');
    });

    it('should redirect to habits page', () => {
      TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/habits']);
    });

    it('should check habit existence and redirect in correct order', () => {
      const result = TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));

      expect(mockParamMap.get).toHaveBeenCalledWith('id');
      expect(mockHabitService.getHabit).toHaveBeenCalledWith('999');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/habits']);
      expect(result).toBe(false);
    });
  });

  describe('when no ID is provided', () => {
    beforeEach(() => {
      mockParamMap.get.and.returnValue(null);
    });

    it('should return false when ID is null', () => {
      const result = TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));

      expect(result).toBe(false);
      expect(mockParamMap.get).toHaveBeenCalledWith('id');
      expect(mockHabitService.getHabit).not.toHaveBeenCalled();
    });

    it('should redirect to habits page when ID is null', () => {
      TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/habits']);
    });

    it('should return false when ID is undefined', () => {
      mockParamMap.get.and.returnValue(undefined);

      const result = TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/habits']);
    });

    it('should return false when ID is empty string', () => {
      mockParamMap.get.and.returnValue('');

      const result = TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/habits']);
    });
  });

  describe('edge cases', () => {
    it('should handle habit service returning undefined', () => {
      mockParamMap.get.and.returnValue('1');
      mockHabitService.getHabit.and.returnValue(undefined as any);

      const result = TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/habits']);
    });

    it('should handle habit service throwing error', () => {
      mockParamMap.get.and.returnValue('1');
      mockHabitService.getHabit.and.throwError('Service error');

      expect(() => {
        TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));
      }).toThrow('Service error');
    });

    it('should handle router navigation error', () => {
      mockParamMap.get.and.returnValue(null);
      mockRouter.navigate.and.throwError('Navigation error');

      expect(() => {
        TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));
      }).toThrow('Navigation error');
    });

    it('should call paramMap.get exactly once', () => {
      mockParamMap.get.and.returnValue('1');
      mockHabitService.getHabit.and.returnValue(mockHabit);

      TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));

      expect(mockParamMap.get).toHaveBeenCalledTimes(1);
      expect(mockParamMap.get).toHaveBeenCalledWith('id');
    });
  });

  describe('different habit scenarios', () => {
    it('should work with different habit types', () => {
      const workHabit: Habit = {
        id: '2',
        name: 'stay focused',
        type: 'job',
        start: new Date('2024-01-02'),
        sprint: [false, true, false, true, false, false, false]
      };

      mockParamMap.get.and.returnValue('2');
      mockHabitService.getHabit.and.returnValue(workHabit);

      const result = TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));

      expect(result).toBe(true);
      expect(mockHabitService.getHabit).toHaveBeenCalledWith('2');
    });

    it('should handle habits with complex IDs', () => {
      const complexId = 'habit-123-abc-456';
      mockParamMap.get.and.returnValue(complexId);
      mockHabitService.getHabit.and.returnValue(mockHabit);

      const result = TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));

      expect(result).toBe(true);
      expect(mockHabitService.getHabit).toHaveBeenCalledWith(complexId);
    });

    it('should handle habits with special characters in ID', () => {
      const specialId = 'habit_special-123!';
      mockParamMap.get.and.returnValue(specialId);
      mockHabitService.getHabit.and.returnValue(mockHabit);

      const result = TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));

      expect(result).toBe(true);
      expect(mockHabitService.getHabit).toHaveBeenCalledWith(specialId);
    });
  });

  describe('integration scenarios', () => {
    it('should work correctly in a typical route resolution flow', () => {
      // Simulate a real route with habit ID
      mockParamMap.get.and.returnValue('valid-habit-id');
      mockHabitService.getHabit.and.returnValue(mockHabit);

      const result = TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));

      expect(result).toBe(true);
      expect(mockParamMap.get).toHaveBeenCalledWith('id');
      expect(mockHabitService.getHabit).toHaveBeenCalledWith('valid-habit-id');
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should work correctly when protecting habit detail routes', () => {
      // Test scenario: user tries to access /habits/non-existent-id
      mockParamMap.get.and.returnValue('non-existent-id');
      mockHabitService.getHabit.and.returnValue(null);

      const result = TestBed.runInInjectionContext(() => habitExistsGuard(mockRoute, null as any));

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/habits']);
    });
  });
});
