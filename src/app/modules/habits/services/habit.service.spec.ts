import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HabitService } from './habit.service';
import { AuthService } from '../../auth/services/auth.service';
import { Habit } from '../models/habit.model';
import { User } from '../../auth/models/auth.model';

describe('HabitService', () => {
  let service: HabitService;
  let authService: jasmine.SpyObj<AuthService>;
  let mockUser: User;
  let localStorageSpy: jasmine.Spy;

  beforeEach(() => {
    // Create mock user
    mockUser = {
      id: 'user-123',
      username: 'testuser',
      name: 'Test User',
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLoginAt: '2024-01-01T00:00:00.000Z',
    };

    // Create spy for AuthService
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser: signal(mockUser),
    });

    // Setup localStorage spy
    localStorageSpy = spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(localStorage, 'setItem');

    TestBed.configureTestingModule({
      providers: [HabitService, { provide: AuthService, useValue: authServiceSpy }],
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    service = TestBed.inject(HabitService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Habit Creation', () => {
    it('should create a habit with user information', () => {
      const newHabit: Habit = {
        id: 'habit-1',
        type: 'health',
        name: 'digital detox',
        start: new Date('2024-01-01'),
        sprint: new Array(30).fill(false),
      };

      service.createHabit(newHabit);

      const habits = service.habits();
      expect(habits.length).toBe(1);
      expect(habits[0]).toEqual(
        jasmine.objectContaining({
          ...newHabit,
          userId: mockUser.id,
          createdBy: mockUser.username,
          createdAt: jasmine.any(String),
        })
      );
    });

    it('should not create a habit when user is not authenticated', () => {
      // Mock no authenticated user
      Object.defineProperty(authService, 'currentUser', {
        get: () => signal(null),
      });

      const newHabit: Habit = {
        id: 'habit-1',
        type: 'health',
        name: 'digital detox',
        start: new Date('2024-01-01'),
        sprint: new Array(30).fill(false),
      };

      service.createHabit(newHabit);

      const habits = service.habits();
      expect(habits.length).toBe(0);
    });
  });

  describe('Habit Retrieval', () => {
    beforeEach(() => {
      const habit1: Habit = {
        id: 'habit-1',
        type: 'health',
        name: 'digital detox',
        start: new Date('2024-01-01'),
        sprint: new Array(30).fill(false),
        userId: mockUser.id,
      };

      const habit2: Habit = {
        id: 'habit-2',
        type: 'job',
        name: 'stay focused',
        start: new Date('2024-01-02'),
        sprint: new Array(30).fill(false),
        userId: mockUser.id,
      };

      service.createHabit(habit1);
      service.createHabit(habit2);
    });

    it('should get a habit by id', () => {
      const habit = service.getHabit('habit-1');
      expect(habit).toBeTruthy();
      expect(habit?.id).toBe('habit-1');
      expect(habit?.name).toBe('digital detox');
    });

    it('should return null for non-existent habit', () => {
      const habit = service.getHabit('non-existent');
      expect(habit).toBeNull();
    });

    it('should return all habits', () => {
      const habits = service.habits();
      expect(habits.length).toBe(2);
    });

    it('should check if initial habits exist', () => {
      expect(service.hasInitialHabits).toBe(true);
    });
  });

  describe('Habit Updates', () => {
    let existingHabit: Habit;

    beforeEach(() => {
      existingHabit = {
        id: 'habit-1',
        type: 'health',
        name: 'digital detox',
        start: new Date('2024-01-01'),
        sprint: new Array(30).fill(false),
        userId: mockUser.id,
      };
      service.createHabit(existingHabit);
    });

    it('should update a habit', () => {
      const updatedHabit: Habit = {
        ...existingHabit,
        name: 'stay focused',
      };

      service.updateHabit(updatedHabit);

      const habit = service.getHabit('habit-1');
      expect(habit?.name).toBe('stay focused');
      expect(habit?.updatedAt).toBeDefined();
      expect(habit?.updatedBy).toBe(mockUser.username);
    });

    it('should not update habit belonging to another user', () => {
      const updatedHabit: Habit = {
        ...existingHabit,
        userId: 'other-user',
        name: 'stay focused',
      };

      spyOn(console, 'warn');
      service.updateHabit(updatedHabit);

      const habit = service.getHabit('habit-1');
      expect(habit?.name).toBe('digital detox'); // Should remain unchanged
      expect(console.warn).toHaveBeenCalledWith('User cannot update habits that do not belong to them');
    });

    it('should not update when user is not authenticated', () => {
      Object.defineProperty(authService, 'currentUser', {
        get: () => signal(null),
      });

      const updatedHabit: Habit = {
        ...existingHabit,
        name: 'stay focused',
      };

      service.updateHabit(updatedHabit);

      const habit = service.getHabit('habit-1');
      expect(habit?.name).toBe('digital detox'); // Should remain unchanged
    });
  });

  describe('Habit Deletion', () => {
    let existingHabit: Habit;

    beforeEach(() => {
      existingHabit = {
        id: 'habit-1',
        type: 'health',
        name: 'digital detox',
        start: new Date('2024-01-01'),
        sprint: new Array(30).fill(false),
        userId: mockUser.id,
      };
      service.createHabit(existingHabit);
    });

    it('should delete a habit', () => {
      service.deleteHabit('habit-1');

      const habit = service.getHabit('habit-1');
      expect(habit).toBeNull();
      expect(service.habits().length).toBe(0);
    });

    it('should not delete habit belonging to another user', () => {
      // Create a habit for another user
      const otherUserHabit: Habit = {
        id: 'habit-2',
        type: 'job',
        name: 'stay focused',
        start: new Date('2024-01-02'),
        sprint: new Array(30).fill(false),
        userId: 'other-user',
      };

      // Manually add to habits array to simulate existing data
      const currentHabits = service.habits();
      currentHabits.push(otherUserHabit);

      spyOn(console, 'warn');
      service.deleteHabit('habit-2');

      expect(console.warn).toHaveBeenCalledWith('User cannot delete habits that do not belong to them');
    });

    it('should delete all user habits', () => {
      const habit2: Habit = {
        id: 'habit-2',
        type: 'job',
        name: 'stay focused',
        start: new Date('2024-01-02'),
        sprint: new Array(30).fill(false),
        userId: mockUser.id,
      };
      service.createHabit(habit2);

      expect(service.habits().length).toBe(2);

      service.deleteAllHabits();

      expect(service.habits().length).toBe(0);
    });
  });

  describe('Habit Completion', () => {
    let existingHabit: Habit;

    beforeEach(() => {
      existingHabit = {
        id: 'habit-1',
        type: 'health',
        name: 'digital detox',
        start: new Date('2024-01-01'),
        sprint: new Array(30).fill(false),
        userId: mockUser.id,
      };
      service.createHabit(existingHabit);
    });

    it('should complete a habit', () => {
      // Mock the current date to be one day after start date
      jasmine.clock().install();
      const baseTime = new Date('2024-01-02').getTime();
      jasmine.clock().mockDate(new Date(baseTime));

      service.completeHabit(existingHabit);

      const updatedHabit = service.getHabit('habit-1');
      expect(updatedHabit?.sprint[1]).toBe(true); // Day 1 (0-indexed) should be completed
      expect(updatedHabit?.lastCompletedAt).toBeDefined();

      jasmine.clock().uninstall();
    });

    it('should not complete habit belonging to another user', () => {
      const otherUserHabit: Habit = {
        ...existingHabit,
        userId: 'other-user',
      };

      spyOn(console, 'warn');
      service.completeHabit(otherUserHabit);

      expect(console.warn).toHaveBeenCalledWith('User cannot complete habits that do not belong to them');
    });

    it('should handle completion on start date', () => {
      jasmine.clock().install();
      const baseTime = new Date('2024-01-01').getTime();
      jasmine.clock().mockDate(new Date(baseTime));

      service.completeHabit(existingHabit);

      const updatedHabit = service.getHabit('habit-1');
      expect(updatedHabit?.sprint[0]).toBe(true); // First day should be completed

      jasmine.clock().uninstall();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      const habit1: Habit = {
        id: 'habit-1',
        type: 'health',
        name: 'digital detox',
        start: new Date('2024-01-01'),
        sprint: new Array(30).fill(false),
        userId: mockUser.id,
      };

      const habit2: Habit = {
        id: 'habit-2',
        type: 'job',
        name: 'stay focused',
        start: new Date('2024-01-02'),
        sprint: new Array(30).fill(false),
        userId: mockUser.id,
      };

      service.createHabit(habit1);
      service.createHabit(habit2);
    });

    it('should search habits by name', () => {
      service.searchHabit('digital');
      const habits = service.habits();
      expect(habits.length).toBe(1);
      expect(habits[0].name).toBe('digital detox');
    });

    it('should search habits case insensitively', () => {
      service.searchHabit('DIGITAL');
      const habits = service.habits();
      expect(habits.length).toBe(1);
      expect(habits[0].name).toBe('digital detox');
    });

    it('should return all habits when search value is empty', () => {
      service.searchHabit('digital'); // First filter
      expect(service.habits().length).toBe(1);

      service.searchHabit(''); // Reset search
      expect(service.habits().length).toBe(2);
    });

    it('should return all habits when search value is null', () => {
      service.searchHabit('digital'); // First filter
      expect(service.habits().length).toBe(1);

      service.searchHabit(null); // Reset search
      expect(service.habits().length).toBe(2);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      const habit1: Habit = {
        id: 'habit-1',
        type: 'health',
        name: 'digital detox',
        start: new Date('2024-01-01'),
        sprint: [true, false, true, false, false],
        userId: mockUser.id,
      };

      const habit2: Habit = {
        id: 'habit-2',
        type: 'job',
        name: 'stay focused',
        start: new Date('2024-01-02'),
        sprint: [false, false, false, false, false],
        userId: mockUser.id,
      };

      service.createHabit(habit1);
      service.createHabit(habit2);
    });

    it('should get user habits count', () => {
      const count = service.getUserHabitsCount();
      expect(count).toBe(2);
    });

    it('should get user completed habits count', () => {
      const count = service.getUserCompletedHabitsCount();
      expect(count).toBe(1); // Only habit1 has completed days
    });

    it('should return 0 counts when user is not authenticated', () => {
      Object.defineProperty(authService, 'currentUser', {
        get: () => signal(null),
      });

      expect(service.getUserHabitsCount()).toBe(0);
      expect(service.getUserCompletedHabitsCount()).toBe(0);
    });
  });

  describe('Data Management', () => {
    it('should load user habits from localStorage', () => {
      const mockHabits: Habit[] = [
        {
          id: 'habit-1',
          type: 'health',
          name: 'digital detox',
          start: new Date('2024-01-01'),
          sprint: new Array(30).fill(false),
          userId: mockUser.id,
        },
        {
          id: 'habit-2',
          type: 'job',
          name: 'stay focused',
          start: new Date('2024-01-02'),
          sprint: new Array(30).fill(false),
          userId: 'other-user',
        },
      ];

      localStorageSpy.and.returnValue(JSON.stringify(mockHabits));

      service.loadUserHabits();

      const habits = service.habits();
      expect(habits.length).toBe(1); // Only user's habit should be loaded
      expect(habits[0].id).toBe('habit-1');
    });

    it('should clear user data', () => {
      const habit: Habit = {
        id: 'habit-1',
        type: 'health',
        name: 'digital detox',
        start: new Date('2024-01-01'),
        sprint: new Array(30).fill(false),
        userId: mockUser.id,
      };

      service.createHabit(habit);
      expect(service.habits().length).toBe(1);
      expect(service.hasInitialHabits).toBe(true);

      service.clearUserData();

      expect(service.habits().length).toBe(0);
      expect(service.hasInitialHabits).toBe(false);
    });

    it('should handle empty localStorage', () => {
      localStorageSpy.and.returnValue(null);

      service.loadUserHabits();

      expect(service.habits().length).toBe(0);
      expect(service.hasInitialHabits).toBe(false);
    });

    it('should load habits for users without userId (legacy data)', () => {
      const mockHabits: Habit[] = [
        {
          id: 'habit-1',
          type: 'health',
          name: 'digital detox',
          start: new Date('2024-01-01'),
          sprint: new Array(30).fill(false),
          // No userId - legacy data
        },
      ];

      localStorageSpy.and.returnValue(JSON.stringify(mockHabits));

      service.loadUserHabits();

      const habits = service.habits();
      expect(habits.length).toBe(1);
    });
  });
});
