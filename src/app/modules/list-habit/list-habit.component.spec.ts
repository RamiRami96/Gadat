import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';

import { ListHabitComponent } from './list-habit.component';
import { HabitService } from '../../shared/services/habit.service';
import { Habit } from '../../shared/models/habit.model';

describe('ListHabitComponent', () => {
  let component: ListHabitComponent;
  let fixture: ComponentFixture<ListHabitComponent>;
  let habitService: jasmine.SpyObj<HabitService>;

  const mockHabits: Habit[] = [
    {
      id: '1',
      name: 'digital detox',
      type: 'health',
      start: new Date('2025-06-25'), // 4 days ago
      sprint: [true, true, false, false, false, false, false],
    },
    {
      id: '2',
      name: 'stay focused',
      type: 'job',
      start: new Date('2025-06-27'), // 2 days ago
      sprint: [true, true, true, true, true, true, true], // All completed
    },
    {
      id: '3',
      name: 'meet with new partner in a week',
      type: 'relationship',
      start: new Date('2025-06-29'), // Today
      sprint: [false, false, false, false, false, false, false],
    },
  ];

  beforeEach(async () => {
    const habitServiceSpy = jasmine.createSpyObj('HabitService', ['searchHabit', 'completeHabit', 'deleteHabit'], {
      habits: signal(mockHabits),
    });

    await TestBed.configureTestingModule({
      imports: [ListHabitComponent, BrowserAnimationsModule],
      providers: [{ provide: HabitService, useValue: habitServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ListHabitComponent);
    component = fixture.componentInstance;
    habitService = TestBed.inject(HabitService) as jasmine.SpyObj<HabitService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize habits from service on ngOnInit', () => {
    expect(component.habits()).toEqual(mockHabits);
  });

  it('should render filter habits component', () => {
    const filterComponent = fixture.debugElement.query(By.css('app-filter-habits'));
    expect(filterComponent).toBeTruthy();
  });

  it('should display habits when habits array is not empty', () => {
    const cardElements = fixture.debugElement.queryAll(By.css('mat-card'));
    expect(cardElements.length).toBe(mockHabits.length);
  });

  it('should display "Habits not found" when habits array is empty', () => {
    component.habits.set([]);
    fixture.detectChanges();

    const noHabitsMessage = fixture.debugElement.query(By.css('h1'));
    expect(noHabitsMessage).toBeTruthy();
    expect(noHabitsMessage.nativeElement.textContent).toBe('Habits not found');
  });

  it('should display habit name and type correctly', () => {
    const firstCard = fixture.debugElement.query(By.css('mat-card'));
    const habitName = firstCard.query(By.css('h2'));
    const habitType = firstCard.query(By.css('p b'));

    expect(habitName.nativeElement.textContent).toBe('digital detox');
    expect(habitType.nativeElement.textContent).toBe('health');
  });

  it('should call searchHabit when filter component emits searchHabits event', () => {
    spyOn(component, 'searchHabit');
    const filterComponent = fixture.debugElement.query(By.css('app-filter-habits'));

    filterComponent.triggerEventHandler('searchHabits', { value: 'test' });

    expect(component.searchHabit).toHaveBeenCalledWith({ value: 'test' });
  });

  it('should call habitService.searchHabit when searchHabit is called', () => {
    const searchValue = 'digital';

    component.searchHabit({ value: searchValue });

    expect(habitService.searchHabit).toHaveBeenCalledWith(searchValue);
  });

  it('should show complete button for habits that can be completed', () => {
    // Mock today as 2025-06-29 (current date in tests)
    spyOn(component, 'showCompleteButton').and.returnValue(true);
    fixture.detectChanges();

    const completeButtons = fixture.debugElement.queryAll(By.css('button:contains("Complete")'));
    expect(completeButtons.length).toBeGreaterThan(0);
  });

  it('should show "Completed" text for fully completed habits', () => {
    spyOn(component, 'showCompleteButton').and.returnValue(false);
    fixture.detectChanges();

    const completedTexts = fixture.debugElement.queryAll(By.css('.card__success-text'));
    expect(completedTexts.length).toBeGreaterThan(0);
    expect(completedTexts[0].nativeElement.textContent).toBe('Completed');
  });

  it('should call habitService.completeHabit when complete button is clicked', () => {
    spyOn(component, 'showCompleteButton').and.returnValue(true);
    fixture.detectChanges();

    const completeButton = fixture.debugElement.query(By.css('button[mat-raised-button]'));
    completeButton.nativeElement.click();

    expect(habitService.completeHabit).toHaveBeenCalledWith(mockHabits[0]);
  });

  it('should call habitService.deleteHabit when delete button is clicked', () => {
    const deleteButtons = fixture.debugElement.queryAll(By.css('button[mat-raised-button]'));
    const deleteButton = deleteButtons.find(btn => btn.nativeElement.textContent.trim() === 'Delete');

    expect(deleteButton).toBeTruthy();
    deleteButton!.nativeElement.click();

    expect(habitService.deleteHabit).toHaveBeenCalledWith(mockHabits[0].id);
  });

  it('should display checkboxes for each sprint day', () => {
    const firstCard = fixture.debugElement.query(By.css('mat-card'));
    const checkboxes = firstCard.queryAll(By.css('mat-checkbox'));

    expect(checkboxes.length).toBe(mockHabits[0].sprint.length);
  });

  it('should set checkboxes as disabled', () => {
    const firstCard = fixture.debugElement.query(By.css('mat-card'));
    const checkboxes = firstCard.queryAll(By.css('mat-checkbox'));

    checkboxes.forEach(checkbox => {
      expect(checkbox.nativeElement.getAttribute('ng-reflect-disabled')).toBe('true');
    });
  });

  describe('showCompleteButton', () => {
    beforeEach(() => {
      // Mock the current date to 2025-06-29
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2025-06-29'));
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should return true for habit that can be completed today', () => {
      const habit: Habit = {
        id: '1',
        name: 'digital detox',
        type: 'health',
        start: new Date('2025-06-27'), // 2 days ago
        sprint: [true, true, false, false, false, false, false], // Completed for 2 days, can complete today
      };

      const result = component.showCompleteButton(habit);
      expect(result).toBe(true);
    });

    it('should return false for habit with all sprint days completed', () => {
      const habit: Habit = {
        id: '2',
        name: 'stay focused',
        type: 'job',
        start: new Date('2025-06-23'), // 6 days ago
        sprint: [true, true, true, true, true, true, true], // All completed
      };

      const result = component.showCompleteButton(habit);
      expect(result).toBe(false);
    });

    it('should return false for habit that is behind schedule', () => {
      const habit: Habit = {
        id: '3',
        name: 'meet with new partner in a week',
        type: 'relationship',
        start: new Date('2025-06-25'), // 4 days ago
        sprint: [true, false, false, false, false, false, false], // Only 1 day completed out of 4
      };

      const result = component.showCompleteButton(habit);
      expect(result).toBe(false);
    });

    it('should return true for habit started today', () => {
      const habit: Habit = {
        id: '4',
        name: 'digital detox',
        type: 'health',
        start: new Date('2025-06-29'), // Today
        sprint: [false, false, false, false, false, false, false], // No days completed yet
      };

      const result = component.showCompleteButton(habit);
      expect(result).toBe(true);
    });
  });
});
