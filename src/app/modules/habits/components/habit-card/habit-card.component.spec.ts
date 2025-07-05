import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { By } from '@angular/platform-browser';

import { HabitCardComponent } from './habit-card.component';
import { HabitService } from '../../services/habit.service';
import { Habit } from '../../models/habit.model';

describe('HabitCardComponent', () => {
  let component: HabitCardComponent;
  let fixture: ComponentFixture<HabitCardComponent>;
  let habitService: jasmine.SpyObj<HabitService>;
  let router: jasmine.SpyObj<Router>;

  const mockHabit: Habit = {
    id: '1',
    name: 'digital detox',
    type: 'health',
    start: new Date('2024-01-01'),
    sprint: [true, false, true, false, false]
  };

  const mockCompletedHabit: Habit = {
    id: '2',
    name: 'stay focused',
    type: 'job',
    start: new Date('2024-01-01'),
    sprint: [true, true, true, true, true]
  };

  beforeEach(async () => {
    const habitServiceSpy = jasmine.createSpyObj('HabitService', ['completeHabit', 'deleteHabit']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        HabitCardComponent,
        MatCardModule,
        MatCheckboxModule,
        MatButtonModule
      ],
      providers: [
        { provide: HabitService, useValue: habitServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HabitCardComponent);
    component = fixture.componentInstance;
    habitService = TestBed.inject(HabitService) as jasmine.SpyObj<HabitService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    component.habit = mockHabit;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display habit information correctly', () => {
    const habitName = fixture.debugElement.query(By.css('h2'));
    const habitType = fixture.debugElement.query(By.css('b'));

    expect(habitName.nativeElement.textContent.trim()).toBe('digital detox');
    expect(habitType.nativeElement.textContent.trim()).toBe('health');
  });

  it('should render sprint checkboxes correctly', () => {
    const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
    
    expect(checkboxes.length).toBe(5);
    
    // Check the state of each checkbox matches the sprint array
    checkboxes.forEach((checkbox, index) => {
      const isChecked = checkbox.componentInstance.checked;
      expect(isChecked).toBe(mockHabit.sprint[index]);
      expect(checkbox.componentInstance.disabled).toBe(true);
    });
  });

  describe('showCompleteButton', () => {
    it('should return true when habit can be completed', () => {
      const habitToComplete: Habit = {
        id: '1',
        name: 'digital detox',
        type: 'health',
        start: new Date('2024-01-01'),
        sprint: [true, true, false, false, false] // 2 completed, day 4 can be completed
      };

      // Mock today to be 4 days after start
      (component as any)._today = new Date('2024-01-05');

      const result = component.showCompleteButton(habitToComplete);
      expect(result).toBe(true);
    });

    it('should return false when all sprint is completed', () => {
      (component as any)._today = new Date('2024-01-05');
      const result = component.showCompleteButton(mockCompletedHabit);
      expect(result).toBe(false);
    });

    it('should return false when user is behind schedule', () => {
      const behindScheduleHabit: Habit = {
        id: '1',
        name: 'digital detox',
        type: 'health',
        start: new Date('2024-01-01'),
        sprint: [false, false, false, false, false] // 0 completed but 4 days passed
      };

      (component as any)._today = new Date('2024-01-05');
      const result = component.showCompleteButton(behindScheduleHabit);
      expect(result).toBe(false);
    });

    it('should handle edge case when start date is today', () => {
      const todayHabit: Habit = {
        id: '1',
        name: 'digital detox',
        type: 'health',
        start: new Date('2024-01-05'), // Same as mocked today
        sprint: [false, false, false, false, false]
      };

      (component as any)._today = new Date('2024-01-05');
      const result = component.showCompleteButton(todayHabit);
      expect(result).toBe(true);
    });
  });

  describe('template rendering based on showCompleteButton', () => {
    it('should show Complete button when showCompleteButton returns true', () => {
      spyOn(component, 'showCompleteButton').and.returnValue(true);
      fixture.detectChanges();

      const completeButton = fixture.debugElement.query(By.css('button'));
      const completedText = fixture.debugElement.query(By.css('.card__success-text'));

      expect(completeButton.nativeElement.textContent.trim()).toBe('Complete');
      expect(completedText).toBeFalsy();
    });

    it('should show "Completed" text when showCompleteButton returns false', () => {
      spyOn(component, 'showCompleteButton').and.returnValue(false);
      fixture.detectChanges();

      const completeButton = fixture.debugElement.query(By.css('button:contains("Complete")'));
      const completedText = fixture.debugElement.query(By.css('.card__success-text'));

      expect(completeButton).toBeFalsy();
      expect(completedText).toBeTruthy();
      expect(completedText.nativeElement.textContent.trim()).toBe('Completed');
    });
  });

  describe('button interactions', () => {
    it('should call habitService.completeHabit when Complete button is clicked', () => {
      spyOn(component, 'showCompleteButton').and.returnValue(true);
      fixture.detectChanges();

      const completeButton = fixture.debugElement.query(By.css('button'));
      completeButton.nativeElement.click();

      expect(habitService.completeHabit).toHaveBeenCalledWith(mockHabit);
    });

    it('should call editHabit when Edit button is clicked', () => {
      spyOn(component, 'editHabit');
      
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const editButton = buttons.find(btn => btn.nativeElement.textContent.trim() === 'Edit');
      
      editButton?.nativeElement.click();

      expect(component.editHabit).toHaveBeenCalledWith(mockHabit.id);
    });

    it('should call habitService.deleteHabit when Delete button is clicked', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const deleteButton = buttons.find(btn => btn.nativeElement.textContent.trim() === 'Delete');
      
      deleteButton?.nativeElement.click();

      expect(habitService.deleteHabit).toHaveBeenCalledWith(mockHabit.id);
    });
  });

  describe('editHabit method', () => {
    it('should navigate to edit route with habit id', () => {
      component.editHabit('test-id');

      expect(router.navigate).toHaveBeenCalledWith(['/habits/edit', 'test-id']);
    });
  });

  describe('component structure', () => {
    it('should render within mat-card structure', () => {
      const matCard = fixture.debugElement.query(By.css('mat-card'));
      const matCardContent = fixture.debugElement.query(By.css('mat-card-content'));

      expect(matCard).toBeTruthy();
      expect(matCardContent).toBeTruthy();
      expect(matCard.nativeElement.classList).toContain('card-container__item');
    });

    it('should have correct button container structure', () => {
      const buttonContainer = fixture.debugElement.query(By.css('.card__btn-container'));
      const buttons = buttonContainer.queryAll(By.css('button'));

      expect(buttonContainer).toBeTruthy();
      expect(buttons.length).toBeGreaterThanOrEqual(2); // At least Edit and Delete
    });

    it('should have Delete button with warn color', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const deleteButton = buttons.find(btn => btn.nativeElement.textContent.trim() === 'Delete');

      expect(deleteButton?.attributes['color']).toBe('warn');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle habit with empty sprint array', () => {
      const emptySprintHabit: Habit = {
        id: '1',
        name: 'digital detox',
        type: 'health',
        start: new Date('2024-01-01'),
        sprint: []
      };

      component.habit = emptySprintHabit;
      fixture.detectChanges();

      const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
      expect(checkboxes.length).toBe(0);
    });

    it('should handle future start date correctly', () => {
      const futureHabit: Habit = {
        id: '1',
        name: 'digital detox',
        type: 'health',
        start: new Date('2025-01-01'), // Future date
        sprint: [false, false, false, false, false]
      };

      const result = component.showCompleteButton(futureHabit);
      expect(result).toBe(true); // Should show complete button for future habits
    });

    it('should handle different habit types correctly', () => {
      const relationshipHabit: Habit = {
        id: '3',
        name: 'meet with new partner in a week',
        type: 'relationship',
        start: new Date('2024-01-01'),
        sprint: [false, false, false, false, false]
      };

      component.habit = relationshipHabit;
      fixture.detectChanges();

      const habitType = fixture.debugElement.query(By.css('b'));
      expect(habitType.nativeElement.textContent.trim()).toBe('relationship');
    });
  });

  describe('date calculations', () => {
    it('should correctly calculate days difference', () => {
      // Test the internal logic of showCompleteButton indirectly
      const startDate = new Date('2024-01-01');
      const testHabit: Habit = {
        id: '1',
        name: 'digital detox',
        type: 'health',
        start: startDate,
        sprint: [true, false, false, false, false]
      };

      // Mock the private _today property to be 2 days after start
      (component as any)._today = new Date('2024-01-03');

      const result = component.showCompleteButton(testHabit);
      expect(result).toBe(false); // 1 completed but 2 days passed
    });
  });
});