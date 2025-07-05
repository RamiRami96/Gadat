import { TestBed } from '@angular/core/testing';
import { HabitService } from './habit.service';
import { Habit } from '../models/habit.model';

describe('HabitService', () => {
  let service: HabitService;
  let mockLocalStorage: { [key: string]: string };

  const mockHabits: Habit[] = [
    {
      id: '1',
      name: 'digital detox',
      type: 'health',
      start: new Date('2024-01-01'),
      sprint: [true, false, true, false, false, false, false]
    },
    {
      id: '2',
      name: 'stay focused',
      type: 'job',
      start: new Date('2024-01-02'),
      sprint: [false, true, false, true, false, false, false]
    },
    {
      id: '3',
      name: 'meet with new partner in a week',
      type: 'relationship',
      start: new Date('2024-01-03'),
      sprint: [false, false, false, false, false, false, false]
    }
  ];

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
      service = TestBed.inject(HabitService);
      expect(service).toBeTruthy();
    });

    it('should initialize with empty habits when localStorage is empty', () => {
      service = TestBed.inject(HabitService);
      
      expect(service.habits().length).toBe(0);
      expect(service.hasInitialHabits).toBe(false);
    });

    it('should initialize with habits from localStorage', () => {
      mockLocalStorage['habits'] = JSON.stringify(mockHabits);
      service = TestBed.inject(HabitService);
      
      expect(service.habits().length).toBe(3);
      expect(service.hasInitialHabits).toBe(true);
      expect(service.habits()).toEqual(mockHabits);
    });

    it('should handle malformed JSON in localStorage gracefully', () => {
      mockLocalStorage['habits'] = 'invalid json';
      
      expect(() => {
        service = TestBed.inject(HabitService);
      }).toThrow();
    });

    it('should handle null values in localStorage', () => {
      mockLocalStorage['habits'] = JSON.stringify(null);
      
      expect(() => {
        service = TestBed.inject(HabitService);
      }).not.toThrow();
    });
  });

  describe('habits getter', () => {
    beforeEach(() => {
      service = TestBed.inject(HabitService);
    });

    it('should return a signal', () => {
      const habitsSignal = service.habits;
      
      expect(typeof habitsSignal).toBe('function');
      expect(Array.isArray(habitsSignal())).toBe(true);
    });

    it('should be reactive to changes', () => {
      const initialLength = service.habits().length;
      
      service.createHabit(mockHabits[0]);
      
      expect(service.habits().length).toBe(initialLength + 1);
    });
  });

  describe('hasInitialHabits getter', () => {
    it('should return false when no initial habits', () => {
      service = TestBed.inject(HabitService);
      
      expect(service.hasInitialHabits).toBe(false);
    });

    it('should return true when initial habits exist', () => {
      mockLocalStorage['habits'] = JSON.stringify(mockHabits);
      service = TestBed.inject(HabitService);
      
      expect(service.hasInitialHabits).toBe(true);
    });

    it('should reflect current state of initial habits', () => {
      service = TestBed.inject(HabitService);
      expect(service.hasInitialHabits).toBe(false);
      
      service.createHabit(mockHabits[0]);
      expect(service.hasInitialHabits).toBe(true);
    });
  });

  describe('getHabit method', () => {
    beforeEach(() => {
      mockLocalStorage['habits'] = JSON.stringify(mockHabits);
      service = TestBed.inject(HabitService);
    });

    it('should return habit by id when it exists', () => {
      const habit = service.getHabit('1');
      
      expect(habit).toEqual(mockHabits[0]);
    });

    it('should return null when habit does not exist', () => {
      const habit = service.getHabit('nonexistent');
      
      expect(habit).toBeNull();
    });

    it('should return null for empty string id', () => {
      const habit = service.getHabit('');
      
      expect(habit).toBeNull();
    });

    it('should find habit after creating new ones', () => {
      const newHabit: Habit = {
        id: '4',
        name: 'digital detox',
        type: 'health',
        start: new Date(),
        sprint: [false, false, false, false, false, false, false]
      };
      
      service.createHabit(newHabit);
      const foundHabit = service.getHabit('4');
      
      expect(foundHabit).toEqual(newHabit);
    });
  });

  describe('createHabit method', () => {
    beforeEach(() => {
      service = TestBed.inject(HabitService);
    });

    it('should add new habit to habits array', () => {
      const initialLength = service.habits().length;
      
      service.createHabit(mockHabits[0]);
      
      expect(service.habits().length).toBe(initialLength + 1);
      expect(service.habits()).toContain(mockHabits[0]);
    });

    it('should save habit to localStorage', () => {
      service.createHabit(mockHabits[0]);
      
      expect(localStorage.setItem).toHaveBeenCalledWith('habits', JSON.stringify([mockHabits[0]]));
    });

    it('should update hasInitialHabits when first habit is created', () => {
      expect(service.hasInitialHabits).toBe(false);
      
      service.createHabit(mockHabits[0]);
      
      expect(service.hasInitialHabits).toBe(true);
    });

    it('should maintain habit order when adding multiple habits', () => {
      service.createHabit(mockHabits[0]);
      service.createHabit(mockHabits[1]);
      
      const habits = service.habits();
      expect(habits[0]).toEqual(mockHabits[0]);
      expect(habits[1]).toEqual(mockHabits[1]);
    });

    it('should create habits with unique ids', () => {
      service.createHabit(mockHabits[0]);
      service.createHabit(mockHabits[1]);
      
      const habits = service.habits();
      const ids = habits.map(h => h.id);
      const uniqueIds = [...new Set(ids)];
      
      expect(ids.length).toBe(uniqueIds.length);
    });
  });

  describe('updateHabit method', () => {
    beforeEach(() => {
      mockLocalStorage['habits'] = JSON.stringify(mockHabits);
      service = TestBed.inject(HabitService);
    });

    it('should update existing habit', () => {
      const updatedHabit: Habit = {
        ...mockHabits[0],
        name: 'stay focused' // Valid HabitName
      };
      
      service.updateHabit(updatedHabit);
      
      const habit = service.getHabit('1');
      expect(habit?.name).toBe('stay focused');
    });

    it('should not change array length when updating', () => {
      const initialLength = service.habits().length;
      const updatedHabit = { ...mockHabits[0], name: 'stay focused' as const };
      
      service.updateHabit(updatedHabit);
      
      expect(service.habits().length).toBe(initialLength);
    });

    it('should save updated habits to localStorage', () => {
      const updatedHabit = { ...mockHabits[0], name: 'stay focused' as const };
      
      service.updateHabit(updatedHabit);
      
      expect(localStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse((localStorage.setItem as jasmine.Spy).calls.mostRecent().args[1]);
      expect(savedData.find((h: Habit) => h.id === '1').name).toBe('stay focused');
    });

    it('should not affect other habits when updating one', () => {
      const updatedHabit = { ...mockHabits[0], name: 'stay focused' as const };
      
      service.updateHabit(updatedHabit);
      
      const otherHabits = service.habits().filter(h => h.id !== '1');
      expect(otherHabits[0]).toEqual(mockHabits[1]);
      expect(otherHabits[1]).toEqual(mockHabits[2]);
    });

    it('should handle updating non-existent habit gracefully', () => {
      const nonExistentHabit: Habit = {
        id: 'nonexistent',
        name: 'digital detox',
        type: 'health',
        start: new Date(),
        sprint: [false, false, false, false, false, false, false]
      };
      
      const initialLength = service.habits().length;
      service.updateHabit(nonExistentHabit);
      
      expect(service.habits().length).toBe(initialLength);
    });
  });

  describe('deleteHabit method', () => {
    beforeEach(() => {
      mockLocalStorage['habits'] = JSON.stringify(mockHabits);
      service = TestBed.inject(HabitService);
    });

    it('should remove habit from habits array', () => {
      const initialLength = service.habits().length;
      
      service.deleteHabit('1');
      
      expect(service.habits().length).toBe(initialLength - 1);
      expect(service.getHabit('1')).toBeNull();
    });

    it('should save updated habits to localStorage after deletion', () => {
      service.deleteHabit('1');
      
      expect(localStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse((localStorage.setItem as jasmine.Spy).calls.mostRecent().args[1]);
      expect(savedData.find((h: Habit) => h.id === '1')).toBeUndefined();
    });

    it('should not affect other habits when deleting one', () => {
      service.deleteHabit('1');
      
      expect(service.getHabit('2')).toEqual(mockHabits[1]);
      expect(service.getHabit('3')).toEqual(mockHabits[2]);
    });

    it('should handle deleting non-existent habit gracefully', () => {
      const initialLength = service.habits().length;
      
      service.deleteHabit('nonexistent');
      
      expect(service.habits().length).toBe(initialLength);
    });

    it('should update hasInitialHabits when all habits are deleted', () => {
      service.deleteHabit('1');
      service.deleteHabit('2');
      service.deleteHabit('3');
      
      expect(service.hasInitialHabits).toBe(false);
    });
  });

  describe('deleteAllHabits method', () => {
    beforeEach(() => {
      mockLocalStorage['habits'] = JSON.stringify(mockHabits);
      service = TestBed.inject(HabitService);
    });

    it('should remove all habits', () => {
      service.deleteAllHabits();
      
      expect(service.habits().length).toBe(0);
      expect(service.hasInitialHabits).toBe(false);
    });

    it('should save empty array to localStorage', () => {
      service.deleteAllHabits();
      
      expect(localStorage.setItem).toHaveBeenCalledWith('habits', JSON.stringify([]));
    });

    it('should be callable multiple times safely', () => {
      service.deleteAllHabits();
      service.deleteAllHabits();
      
      expect(service.habits().length).toBe(0);
    });
  });

  describe('completeHabit method', () => {
    beforeEach(() => {
      mockLocalStorage['habits'] = JSON.stringify(mockHabits);
      service = TestBed.inject(HabitService);
    });

    it('should mark habit as completed for current day', () => {
      const habitToComplete = mockHabits[2]; // Has all false sprint
      const originalSprint = [...habitToComplete.sprint];
      
      // Mock current date to be 2 days after start date
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2024-01-05')); // 2 days after start
      
      service.completeHabit(habitToComplete);
      
      const updatedHabit = service.getHabit('3');
      expect(updatedHabit?.sprint[2]).toBe(true); // Day 2 should be marked true
      expect(updatedHabit?.sprint[0]).toBe(originalSprint[0]); // Other days unchanged
      
      jasmine.clock().uninstall();
    });

    it('should not mark completion outside sprint range', () => {
      const habitToComplete = mockHabits[0];
      
      // Mock current date to be way after sprint period
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2024-01-15')); // 14 days after start (outside 7-day sprint)
      
      service.completeHabit(habitToComplete);
      
      const updatedHabit = service.getHabit('1');
      expect(updatedHabit?.sprint).toEqual(mockHabits[0].sprint); // Should remain unchanged
      
      jasmine.clock().uninstall();
    });

    it('should handle completion on start date', () => {
      const habitToComplete = mockHabits[2];
      
      // Mock current date to be same as start date
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2024-01-03')); // Same as start date
      
      service.completeHabit(habitToComplete);
      
      const updatedHabit = service.getHabit('3');
      expect(updatedHabit?.sprint[0]).toBe(true); // Day 0 should be marked true
      
      jasmine.clock().uninstall();
    });

    it('should save updated habit to localStorage', () => {
      const habitToComplete = mockHabits[2];
      
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2024-01-05'));
      
      service.completeHabit(habitToComplete);
      
      expect(localStorage.setItem).toHaveBeenCalled();
      
      jasmine.clock().uninstall();
    });
  });

  describe('searchHabit method', () => {
    beforeEach(() => {
      mockLocalStorage['habits'] = JSON.stringify(mockHabits);
      service = TestBed.inject(HabitService);
    });

    it('should return all habits when search value is null', () => {
      service.searchHabit(null);
      
      expect(service.habits().length).toBe(3);
      expect(service.habits()).toEqual(mockHabits);
    });

    it('should return all habits when search value is undefined', () => {
      service.searchHabit(undefined);
      
      expect(service.habits().length).toBe(3);
      expect(service.habits()).toEqual(mockHabits);
    });

    it('should return all habits when search value is empty string', () => {
      service.searchHabit('');
      
      expect(service.habits().length).toBe(3);
      expect(service.habits()).toEqual(mockHabits);
    });

    it('should filter habits by name (case insensitive)', () => {
      service.searchHabit('digital');
      
      expect(service.habits().length).toBe(1);
      expect(service.habits()[0].name).toBe('digital detox');
    });

    it('should filter habits by name (uppercase)', () => {
      service.searchHabit('DIGITAL');
      
      expect(service.habits().length).toBe(1);
      expect(service.habits()[0].name).toBe('digital detox');
    });

    it('should filter habits by partial name match', () => {
      service.searchHabit('focus');
      
      expect(service.habits().length).toBe(1);
      expect(service.habits()[0].name).toBe('stay focused');
    });

    it('should return empty array when no habits match search', () => {
      service.searchHabit('nonexistent');
      
      expect(service.habits().length).toBe(0);
    });

    it('should handle search with whitespace', () => {
      service.searchHabit('  digital  ');
      
      expect(service.habits().length).toBe(1);
      expect(service.habits()[0].name).toBe('digital detox');
    });

    it('should return multiple matching habits', () => {
      // Both habits contain "e"
      service.searchHabit('e');
      
      expect(service.habits().length).toBeGreaterThan(1);
    });

    it('should maintain original habits after search and reset', () => {
      service.searchHabit('digital');
      expect(service.habits().length).toBe(1);
      
      service.searchHabit(null);
      expect(service.habits().length).toBe(3);
      expect(service.habits()).toEqual(mockHabits);
    });
  });

  describe('private _markHabitAsCompleted method', () => {
    beforeEach(() => {
      service = TestBed.inject(HabitService);
    });

    it('should calculate days difference correctly', () => {
      const habit = mockHabits[0];
      const completionDate = new Date('2024-01-04'); // 3 days after start
      
      // Access private method for testing
      const result = (service as any)._markHabitAsCompleted(habit, completionDate);
      
      expect(result.sprint[3]).toBe(true);
      expect(result.sprint[0]).toBe(habit.sprint[0]); // Original values preserved
    });

    it('should not modify sprint for negative day difference', () => {
      const habit = mockHabits[0];
      const completionDate = new Date('2023-12-31'); // Before start date
      
      const result = (service as any)._markHabitAsCompleted(habit, completionDate);
      
      expect(result.sprint).toEqual(habit.sprint); // Should remain unchanged
    });

    it('should not modify sprint for day beyond sprint length', () => {
      const habit = mockHabits[0];
      const completionDate = new Date('2024-01-10'); // 9 days after start (beyond 7-day sprint)
      
      const result = (service as any)._markHabitAsCompleted(habit, completionDate);
      
      expect(result.sprint).toEqual(habit.sprint); // Should remain unchanged
    });

    it('should create new habit object without mutating original', () => {
      const habit = mockHabits[0];
      const originalSprint = [...habit.sprint];
      const completionDate = new Date('2024-01-02');
      
      const result = (service as any)._markHabitAsCompleted(habit, completionDate);
      
      expect(habit.sprint).toEqual(originalSprint); // Original not mutated
      expect(result).not.toBe(habit); // New object created
    });
  });

  describe('private _updateHabits method', () => {
    beforeEach(() => {
      service = TestBed.inject(HabitService);
    });

    it('should update localStorage with new habits', () => {
      const newHabits = [mockHabits[0]];
      
      (service as any)._updateHabits(newHabits);
      
      expect(localStorage.setItem).toHaveBeenCalledWith('habits', JSON.stringify(newHabits));
    });

    it('should update habits signal', () => {
      const newHabits = [mockHabits[0]];
      
      (service as any)._updateHabits(newHabits);
      
      expect(service.habits()).toEqual(newHabits);
    });

    it('should update initial habits array', () => {
      const newHabits = [mockHabits[0]];
      
      (service as any)._updateHabits(newHabits);
      
      expect(service.hasInitialHabits).toBe(true);
    });

    it('should handle empty array', () => {
      (service as any)._updateHabits([]);
      
      expect(service.habits().length).toBe(0);
      expect(service.hasInitialHabits).toBe(false);
      expect(localStorage.setItem).toHaveBeenCalledWith('habits', JSON.stringify([]));
    });
  });

  describe('integration scenarios', () => {
    beforeEach(() => {
      service = TestBed.inject(HabitService);
    });

    it('should handle complete CRUD operations', () => {
      // Create
      service.createHabit(mockHabits[0]);
      expect(service.habits().length).toBe(1);
      
      // Read
      const habit = service.getHabit('1');
      expect(habit).toEqual(mockHabits[0]);
      
      // Update
      const updatedHabit = { ...mockHabits[0], name: 'stay focused' as const };
      service.updateHabit(updatedHabit);
      expect(service.getHabit('1')?.name).toBe('stay focused');
      
      // Delete
      service.deleteHabit('1');
      expect(service.getHabit('1')).toBeNull();
      expect(service.habits().length).toBe(0);
    });

    it('should maintain data consistency across operations', () => {
      // Add multiple habits
      mockHabits.forEach(habit => service.createHabit(habit));
      
      // Search and verify
      service.searchHabit('digital');
      expect(service.habits().length).toBe(1);
      
      // Reset search and verify all habits still exist
      service.searchHabit(null);
      expect(service.habits().length).toBe(3);
      
      // Complete a habit and verify update
      service.completeHabit(mockHabits[0]);
      const completedHabit = service.getHabit('1');
      expect(completedHabit).toBeDefined();
    });

    it('should handle rapid successive operations', () => {
      service.createHabit(mockHabits[0]);
      service.createHabit(mockHabits[1]);
      service.deleteHabit('1');
      service.createHabit(mockHabits[2]);
      
      expect(service.habits().length).toBe(2);
      expect(service.getHabit('1')).toBeNull();
      expect(service.getHabit('2')).toBeDefined();
      expect(service.getHabit('3')).toBeDefined();
    });
  });
});
