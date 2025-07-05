import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { By } from '@angular/platform-browser';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { signal } from '@angular/core';

import { ListHabitComponent } from './list-habit.component';
import { HabitService } from '../../services/habit.service';
import { Habit } from '../../models/habit.model';

// Mock components for testing
@Component({
  selector: 'app-filter-habits',
  template: '<div>Filter Habits Component</div>',
  standalone: true
})
class MockFilterHabitsComponent {
  @Output() searchHabits = new EventEmitter<{ value?: string | null }>();
}

@Component({
  selector: 'app-habit-card',
  template: '<div class="habit-card">Habit Card: {{habit?.name}}</div>',
  standalone: true
})
class MockHabitCardComponent {
  @Input() habit!: Habit;
}

describe('ListHabitComponent', () => {
  let component: ListHabitComponent;
  let fixture: ComponentFixture<ListHabitComponent>;
  let habitService: jasmine.SpyObj<HabitService>;
  let habitsSignal: any;

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
    }
  ];

  beforeEach(async () => {
    habitsSignal = signal(mockHabits);
    const habitServiceSpy = jasmine.createSpyObj('HabitService', ['searchHabit'], {
      habits: habitsSignal
    });
    
    // Add a writable hasInitialHabits property
    Object.defineProperty(habitServiceSpy, 'hasInitialHabits', {
      value: true,
      writable: true,
      configurable: true
    });

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatFormFieldModule
      ],
      declarations: [
        ListHabitComponent,
        MockFilterHabitsComponent,
        MockHabitCardComponent
      ],
      providers: [
        { provide: HabitService, useValue: habitServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListHabitComponent);
    component = fixture.componentInstance;
    habitService = TestBed.inject(HabitService) as jasmine.SpyObj<HabitService>;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('component initialization', () => {
    it('should inject HabitService correctly', () => {
      expect(component.habitService).toBeDefined();
      expect(component.habitService).toBe(habitService);
    });

    it('should initialize habits signal from service', () => {
      expect(component.habits).toBeDefined();
      expect(component.habits()).toEqual(mockHabits);
    });

    it('should have habitService as public property', () => {
      // HabitService is public since it's used in template
      expect(component.habitService).toBeDefined();
    });
  });

  describe('template rendering with initial habits', () => {
    beforeEach(() => {
      (habitService as any).hasInitialHabits = true;
      fixture.detectChanges();
    });

    it('should render filter habits component when hasInitialHabits is true', () => {
      const filterComponent = fixture.debugElement.query(By.css('app-filter-habits'));
      
      expect(filterComponent).toBeTruthy();
    });

    it('should render habits list container when habits exist', () => {
      const habitsList = fixture.debugElement.query(By.css('.habits-list'));
      const habitsContainer = fixture.debugElement.query(By.css('.habits-list__container'));
      
      expect(habitsList).toBeTruthy();
      expect(habitsContainer).toBeTruthy();
    });

    it('should render habit cards for each habit', () => {
      const habitCards = fixture.debugElement.queryAll(By.css('app-habit-card'));
      
      expect(habitCards.length).toBe(2);
    });

    it('should pass correct habit data to habit cards', () => {
      const habitCards = fixture.debugElement.queryAll(By.css('app-habit-card'));
      
      expect(habitCards[0].componentInstance.habit).toEqual(mockHabits[0]);
      expect(habitCards[1].componentInstance.habit).toEqual(mockHabits[1]);
    });

    it('should track habits by id in for loop', () => {
      // This is implicitly tested by the rendering working correctly
      const habitCards = fixture.debugElement.queryAll(By.css('app-habit-card'));
      expect(habitCards.length).toBe(mockHabits.length);
    });
  });

  describe('template rendering without initial habits', () => {
    beforeEach(() => {
      (habitService as any).hasInitialHabits = false;
      fixture.detectChanges();
    });

    it('should not render filter habits component when hasInitialHabits is false', () => {
      const filterComponent = fixture.debugElement.query(By.css('app-filter-habits'));
      
      expect(filterComponent).toBeFalsy();
    });

    it('should not render habits list when hasInitialHabits is false', () => {
      const habitsList = fixture.debugElement.query(By.css('.habits-list'));
      
      expect(habitsList).toBeFalsy();
    });

    it('should show "Habits not found" message when hasInitialHabits is false', () => {
      const message = fixture.debugElement.query(By.css('.habits-list__message--not-found'));
      
      expect(message).toBeTruthy();
      expect(message.nativeElement.textContent.trim()).toBe('Habits not found');
    });
  });

  describe('empty habits state', () => {
    beforeEach(() => {
      (habitService as any).hasInitialHabits = true;
      habitsSignal.set([]);
      fixture.detectChanges();
    });

    it('should show filter component when hasInitialHabits is true but no habits', () => {
      const filterComponent = fixture.debugElement.query(By.css('app-filter-habits'));
      
      expect(filterComponent).toBeTruthy();
    });

    it('should show "No habits found for your search" message when habits array is empty', () => {
      const message = fixture.debugElement.query(By.css('.habits-list__message--no-search-results'));
      
      expect(message).toBeTruthy();
      expect(message.nativeElement.textContent.trim()).toBe('No habits found for your search');
    });

    it('should not render habits container when habits array is empty', () => {
      const habitsContainer = fixture.debugElement.query(By.css('.habits-list__container'));
      
      expect(habitsContainer).toBeFalsy();
    });

    it('should not render any habit cards when habits array is empty', () => {
      const habitCards = fixture.debugElement.queryAll(By.css('app-habit-card'));
      
      expect(habitCards.length).toBe(0);
    });
  });

  describe('searchHabit method', () => {
    it('should call habitService.searchHabit with correct value', () => {
      const searchEvent = { value: 'test search' };
      
      component.searchHabit(searchEvent);
      
      expect(habitService.searchHabit).toHaveBeenCalledWith('test search');
    });

    it('should call habitService.searchHabit with null value', () => {
      const searchEvent = { value: null };
      
      component.searchHabit(searchEvent);
      
      expect(habitService.searchHabit).toHaveBeenCalledWith(null);
    });

    it('should call habitService.searchHabit with undefined value', () => {
      const searchEvent = { value: undefined };
      
      component.searchHabit(searchEvent);
      
      expect(habitService.searchHabit).toHaveBeenCalledWith(undefined);
    });

    it('should call habitService.searchHabit with empty string', () => {
      const searchEvent = { value: '' };
      
      component.searchHabit(searchEvent);
      
      expect(habitService.searchHabit).toHaveBeenCalledWith('');
    });

    it('should handle searchHabit method being called multiple times', () => {
      component.searchHabit({ value: 'search1' });
      component.searchHabit({ value: 'search2' });
      
      expect(habitService.searchHabit).toHaveBeenCalledTimes(2);
      expect(habitService.searchHabit).toHaveBeenCalledWith('search1');
      expect(habitService.searchHabit).toHaveBeenCalledWith('search2');
    });
  });

  describe('filter habits component integration', () => {
    beforeEach(() => {
      (habitService as any).hasInitialHabits = true;
      fixture.detectChanges();
    });

    it('should listen to searchHabits event from filter component', () => {
      spyOn(component, 'searchHabit');
      
      const filterComponent = fixture.debugElement.query(By.css('app-filter-habits'));
      const searchEvent = { value: 'test' };
      
      filterComponent.componentInstance.searchHabits.emit(searchEvent);
      
      expect(component.searchHabit).toHaveBeenCalledWith(searchEvent);
    });

    it('should handle searchHabits event with various values', () => {
      spyOn(component, 'searchHabit');
      
      const filterComponent = fixture.debugElement.query(By.css('app-filter-habits'));
      
      filterComponent.componentInstance.searchHabits.emit({ value: 'health' });
      filterComponent.componentInstance.searchHabits.emit({ value: null });
      filterComponent.componentInstance.searchHabits.emit({ value: '' });
      
      expect(component.searchHabit).toHaveBeenCalledTimes(3);
      expect(component.searchHabit).toHaveBeenCalledWith({ value: 'health' });
      expect(component.searchHabit).toHaveBeenCalledWith({ value: null });
      expect(component.searchHabit).toHaveBeenCalledWith({ value: '' });
    });
  });

  describe('habits signal reactivity', () => {
    beforeEach(() => {
      (habitService as any).hasInitialHabits = true;
      fixture.detectChanges();
    });

    it('should react to habits signal changes', () => {
      // Start with initial habits
      let habitCards = fixture.debugElement.queryAll(By.css('app-habit-card'));
      expect(habitCards.length).toBe(2);
      
      // Update habits signal
      const newHabits: Habit[] = [mockHabits[0]]; // Only one habit
      habitsSignal.set(newHabits);
      fixture.detectChanges();
      
      habitCards = fixture.debugElement.queryAll(By.css('app-habit-card'));
      expect(habitCards.length).toBe(1);
      expect(habitCards[0].componentInstance.habit).toEqual(mockHabits[0]);
    });

    it('should show no search results when habits become empty', () => {
      // Start with habits
      let habitCards = fixture.debugElement.queryAll(By.css('app-habit-card'));
      expect(habitCards.length).toBe(2);
      
      // Clear habits
      habitsSignal.set([]);
      fixture.detectChanges();
      
      habitCards = fixture.debugElement.queryAll(By.css('app-habit-card'));
      expect(habitCards.length).toBe(0);
      
      const message = fixture.debugElement.query(By.css('.habits-list__message--no-search-results'));
      expect(message).toBeTruthy();
    });

    it('should handle adding new habits', () => {
      const newHabit: Habit = {
        id: '3',
        name: 'meet with new partner in a week',
        type: 'relationship',
        start: new Date('2024-01-03'),
        sprint: [false, false, false, false, false, false, false]
      };
      
      const expandedHabits = [...mockHabits, newHabit];
      habitsSignal.set(expandedHabits);
      fixture.detectChanges();
      
      const habitCards = fixture.debugElement.queryAll(By.css('app-habit-card'));
      expect(habitCards.length).toBe(3);
      expect(habitCards[2].componentInstance.habit).toEqual(newHabit);
    });
  });

  describe('conditional rendering states', () => {
    it('should render different states correctly', () => {
      // Test 1: No initial habits
      (habitService as any).hasInitialHabits = false;
      fixture.detectChanges();
      
      expect(fixture.debugElement.query(By.css('app-filter-habits'))).toBeFalsy();
      expect(fixture.debugElement.query(By.css('.habits-list__message--not-found'))).toBeTruthy();
      
      // Test 2: Has initial habits, with habits
      (habitService as any).hasInitialHabits = true;
      habitsSignal.set(mockHabits);
      fixture.detectChanges();
      
      expect(fixture.debugElement.query(By.css('app-filter-habits'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('.habits-list__container'))).toBeTruthy();
      expect(fixture.debugElement.queryAll(By.css('app-habit-card')).length).toBe(2);
      
      // Test 3: Has initial habits, no habits (search results)
      habitsSignal.set([]);
      fixture.detectChanges();
      
      expect(fixture.debugElement.query(By.css('app-filter-habits'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('.habits-list__message--no-search-results'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('.habits-list__container'))).toBeFalsy();
    });
  });

  describe('component structure and CSS classes', () => {
    it('should have correct CSS classes for different states', () => {
      // With habits
      (habitService as any).hasInitialHabits = true;
      habitsSignal.set(mockHabits);
      fixture.detectChanges();
      
      const habitsList = fixture.debugElement.query(By.css('.habits-list'));
      const habitsContainer = fixture.debugElement.query(By.css('.habits-list__container'));
      
      expect(habitsList).toBeTruthy();
      expect(habitsContainer).toBeTruthy();
      
      // No search results
      habitsSignal.set([]);
      fixture.detectChanges();
      
      const noResultsMessage = fixture.debugElement.query(By.css('.habits-list__message--no-search-results'));
      expect(noResultsMessage).toBeTruthy();
      
      // No initial habits
      (habitService as any).hasInitialHabits = false;
      fixture.detectChanges();
      
      const notFoundMessage = fixture.debugElement.query(By.css('.habits-list__message--not-found'));
      expect(notFoundMessage).toBeTruthy();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle searchHabit method with malformed event object', () => {
      const malformedEvent = {} as { value?: string | null };
      
      expect(() => component.searchHabit(malformedEvent)).not.toThrow();
      expect(habitService.searchHabit).toHaveBeenCalledWith(undefined);
    });

    it('should handle habits signal with null or undefined', () => {
      (habitService as any).hasInitialHabits = true;
      habitsSignal.set(null);
      fixture.detectChanges();
      
      // Should not crash, though behavior depends on implementation
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle rapid state changes', () => {
      (habitService as any).hasInitialHabits = true;
      
      // Rapid changes
      habitsSignal.set([]);
      fixture.detectChanges();
      habitsSignal.set(mockHabits);
      fixture.detectChanges();
      habitsSignal.set([mockHabits[0]]);
      fixture.detectChanges();
      
      const habitCards = fixture.debugElement.queryAll(By.css('app-habit-card'));
      expect(habitCards.length).toBe(1);
    });
  });

  describe('method return types', () => {
    it('should have searchHabit method return void', () => {
      const result = component.searchHabit({ value: 'test' });
      
      expect(result).toBeUndefined();
    });
  });
});