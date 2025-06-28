import { TestBed } from '@angular/core/testing';

import { HabitService } from './habit.service';
import { Habit } from '../models/habit.model';

describe('HabitService', () => {
  let service: HabitService;
  let localStorageSpy: jasmine.SpyObj<Storage>;

  const mockHabits: Habit[] = [
    {
      id: '1',
      name: 'digital detox',
      type: 'health',
      start: new Date('2025-06-25'),
      sprint: [true, true, false, false, false, false, false],
    },
    {
      id: '2',
      name: 'stay focused',
      type: 'job',
      start: new Date('2025-06-27'),
      sprint: [true, false, false, false, false, false, false],
    },
  ];

  beforeEach(() => {
    // Mock localStorage
    localStorageSpy = jasmine.createSpyObj('localStorage', ['getItem', 'setItem', 'removeItem']);

    // Replace the global localStorage with our spy
    Object.defineProperty(window, 'localStorage', {
      value: localStorageSpy,
      writable: true,
    });

    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorageSpy.getItem.calls.reset();
    localStorageSpy.setItem.calls.reset();
  });

  afterEach(() => {
    localStorageSpy.getItem.calls.reset();
    localStorageSpy.setItem.calls.reset();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      localStorageSpy.getItem.and.returnValue(null);
      service = TestBed.inject(HabitService);
      expect(service).toBeTruthy();
    });

    it('should initialize with empty habits when localStorage is empty', () => {
      localStorageSpy.getItem.and.returnValue(null);
      service = TestBed.inject(HabitService);

      expect(service.habits()).toEqual([]);
      expect(localStorageSpy.getItem).toHaveBeenCalledWith('habits');
    });

    it('should initialize with habits from localStorage when available', () => {
      localStorageSpy.getItem.and.returnValue(JSON.stringify(mockHabits));
      service = TestBed.inject(HabitService);

      expect(service.habits()).toEqual(mockHabits);
      expect(localStorageSpy.getItem).toHaveBeenCalledWith('habits');
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(() => {
      localStorageSpy.getItem.and.returnValue(JSON.stringify(mockHabits));
      service = TestBed.inject(HabitService);
    });

    describe('getHabit', () => {
      it('should return habit when found', () => {
        const habit = service.getHabit('1');
        expect(habit).toEqual(mockHabits[0]);
      });

      it('should return null when habit not found', () => {
        const habit = service.getHabit('nonexistent');
        expect(habit).toBeNull();
      });
    });

    describe('createHabit', () => {
      it('should add new habit and update localStorage', () => {
        const newHabit: Habit = {
          id: '3',
          name: 'meet with new partner in a week',
          type: 'relationship',
          start: new Date('2025-06-29'),
          sprint: [false, false, false, false, false, false, false],
        };

        service.createHabit(newHabit);

        expect(service.habits()).toContain(newHabit);
        expect(service.habits().length).toBe(3);
        expect(localStorageSpy.setItem).toHaveBeenCalledWith('habits', jasmine.any(String));
      });

      it('should persist all habits including the new one to localStorage', () => {
        const newHabit: Habit = {
          id: '3',
          name: 'meet with new partner in a week',
          type: 'relationship',
          start: new Date('2025-06-29'),
          sprint: [false, false, false, false, false, false, false],
        };

        service.createHabit(newHabit);

        const savedData = localStorageSpy.setItem.calls.mostRecent().args[1];
        const parsedData = JSON.parse(savedData);
        expect(parsedData).toContain(jasmine.objectContaining(newHabit));
      });
    });

    describe('updateHabit', () => {
      it('should update existing habit and save to localStorage', () => {
        const updatedHabit: Habit = {
          ...mockHabits[0],
          sprint: [true, true, true, false, false, false, false],
        };

        service.updateHabit(updatedHabit);

        const habit = service.getHabit('1');
        expect(habit?.sprint).toEqual([true, true, true, false, false, false, false]);
        expect(localStorageSpy.setItem).toHaveBeenCalledWith('habits', jasmine.any(String));
      });

      it('should not affect other habits when updating one', () => {
        const updatedHabit: Habit = {
          ...mockHabits[0],
          name: 'digital detox',
        };

        service.updateHabit(updatedHabit);

        const otherHabit = service.getHabit('2');
        expect(otherHabit).toEqual(mockHabits[1]);
      });
    });

    describe('deleteHabit', () => {
      it('should remove habit and update localStorage', () => {
        service.deleteHabit('1');

        expect(service.getHabit('1')).toBeNull();
        expect(service.habits().length).toBe(1);
        expect(localStorageSpy.setItem).toHaveBeenCalledWith('habits', jasmine.any(String));
      });

      it('should not affect other habits when deleting one', () => {
        service.deleteHabit('1');

        const remainingHabit = service.getHabit('2');
        expect(remainingHabit).toEqual(mockHabits[1]);
      });
    });

    describe('deleteAllHabits', () => {
      it('should remove all habits and update localStorage', () => {
        service.deleteAllHabits();

        expect(service.habits()).toEqual([]);
        expect(localStorageSpy.setItem).toHaveBeenCalledWith('habits', '[]');
      });
    });
  });

  describe('completeHabit', () => {
    beforeEach(() => {
      localStorageSpy.getItem.and.returnValue(JSON.stringify(mockHabits));
      service = TestBed.inject(HabitService);
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should mark habit as completed for current day', () => {
      jasmine.clock().mockDate(new Date('2025-06-29')); // 4 days after start date

      const habitToComplete = mockHabits[0]; // Started on 2025-06-25
      service.completeHabit(habitToComplete);

      const updatedHabit = service.getHabit('1');
      expect(updatedHabit?.sprint[4]).toBe(true); // Day 4 should be marked as completed
    });

    it('should not modify sprint if completion date is before start date', () => {
      jasmine.clock().mockDate(new Date('2025-06-24')); // Before start date

      const habitToComplete = mockHabits[0];
      const originalSprint = [...habitToComplete.sprint];
      service.completeHabit(habitToComplete);

      const updatedHabit = service.getHabit('1');
      expect(updatedHabit?.sprint).toEqual(originalSprint);
    });

    it('should not modify sprint if completion date is beyond sprint length', () => {
      jasmine.clock().mockDate(new Date('2025-07-05')); // 10 days after start (beyond 7-day sprint)

      const habitToComplete = mockHabits[0];
      const originalSprint = [...habitToComplete.sprint];
      service.completeHabit(habitToComplete);

      const updatedHabit = service.getHabit('1');
      expect(updatedHabit?.sprint).toEqual(originalSprint);
    });

    it('should create immutable copy of habit when completing', () => {
      jasmine.clock().mockDate(new Date('2025-06-27'));

      const habitToComplete = mockHabits[0];
      const originalHabit = { ...habitToComplete };
      service.completeHabit(habitToComplete);

      // Original habit object should not be modified
      expect(habitToComplete).toEqual(originalHabit);
    });
  });

  describe('searchHabit', () => {
    beforeEach(() => {
      localStorageSpy.getItem.and.returnValue(JSON.stringify(mockHabits));
      service = TestBed.inject(HabitService);
    });

    it('should return all habits when search value is null', () => {
      service.searchHabit(null);
      expect(service.habits()).toEqual(mockHabits);
    });

    it('should return all habits when search value is undefined', () => {
      service.searchHabit(undefined);
      expect(service.habits()).toEqual(mockHabits);
    });

    it('should return all habits when search value is empty string', () => {
      service.searchHabit('');
      expect(service.habits()).toEqual(mockHabits);
    });

    it('should filter habits by name containing search value', () => {
      service.searchHabit('digital');
      expect(service.habits()).toEqual([mockHabits[0]]);
    });

    it('should filter habits case-sensitively', () => {
      service.searchHabit('Digital'); // Capital D
      expect(service.habits()).toEqual([]);
    });

    it('should trim whitespace from search value', () => {
      service.searchHabit('  digital  ');
      expect(service.habits()).toEqual([mockHabits[0]]);
    });

    it('should return empty array when no habits match search', () => {
      service.searchHabit('nonexistent');
      expect(service.habits()).toEqual([]);
    });

    it('should handle partial matches', () => {
      service.searchHabit('focus');
      expect(service.habits()).toEqual([mockHabits[1]]);
    });

    it('should reset to original habits after search', () => {
      // First search
      service.searchHabit('digital');
      expect(service.habits().length).toBe(1);

      // Reset search
      service.searchHabit(null);
      expect(service.habits()).toEqual(mockHabits);
    });
  });

  describe('Signal Integration', () => {
    beforeEach(() => {
      localStorageSpy.getItem.and.returnValue(JSON.stringify(mockHabits));
      service = TestBed.inject(HabitService);
    });

    it('should return a signal for habits getter', () => {
      const habitsSignal = service.habits;
      expect(typeof habitsSignal).toBe('function');
      expect(habitsSignal()).toEqual(mockHabits);
    });

    it('should update signal when habits are modified', () => {
      const initialLength = service.habits().length;

      const newHabit: Habit = {
        id: '3',
        name: 'meet with new partner in a week',
        type: 'relationship',
        start: new Date('2025-06-29'),
        sprint: [false, false, false, false, false, false, false],
      };

      service.createHabit(newHabit);

      expect(service.habits().length).toBe(initialLength + 1);
    });
  });
});
