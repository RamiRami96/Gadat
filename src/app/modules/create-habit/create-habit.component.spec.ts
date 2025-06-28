import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HabitService } from '../../shared/services/habit.service';
import { CreateHabitComponent } from './create-habit.component';
import { Habit } from '../../shared/models/habit.model';
import { healthHabits, jobHabits, relationshipHabits } from '../../shared/const/habitTypes.const';

describe('CreateHabitComponent', () => {
  let component: CreateHabitComponent;
  let fixture: ComponentFixture<CreateHabitComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<CreateHabitComponent>>;
  let mockHabitService: jasmine.SpyObj<HabitService>;

  beforeEach(async () => {
    const dialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const habitServiceSpy = jasmine.createSpyObj('HabitService', ['createHabit']);

    await TestBed.configureTestingModule({
      imports: [CreateHabitComponent, BrowserAnimationsModule, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: MatDialogRef, useValue: dialogSpy },
        { provide: HabitService, useValue: habitServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateHabitComponent);
    component = fixture.componentInstance;
    mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CreateHabitComponent>>;
    mockHabitService = TestBed.inject(HabitService) as jasmine.SpyObj<HabitService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with required validators', () => {
      expect(component.form).toBeDefined();
      expect(component.form.get('type')?.hasError('required')).toBeTruthy();
      expect(component.form.get('name')?.hasError('required')).toBeTruthy();
    });

    it('should have initial empty values', () => {
      expect(component.form.get('type')?.value).toBe('');
      expect(component.form.get('name')?.value).toBe('');
    });

    it('should be invalid when form is empty', () => {
      expect(component.form.valid).toBeFalsy();
    });

    it('should be valid when all required fields are filled', () => {
      component.form.patchValue({
        type: 'Health',
        name: 'Exercise daily',
      });
      expect(component.form.valid).toBeTruthy();
    });
  });

  describe('Habit Type Selection', () => {
    it('should update currentHabits when Health type is selected', () => {
      component.form.get('type')?.setValue('Health');
      expect(component.currentHabits).toEqual(healthHabits);
    });

    it('should update currentHabits when Job type is selected', () => {
      component.form.get('type')?.setValue('Job');
      expect(component.currentHabits).toEqual(jobHabits);
    });

    it('should update currentHabits when Relationships type is selected', () => {
      component.form.get('type')?.setValue('Relationships');
      expect(component.currentHabits).toEqual(relationshipHabits);
    });

    it('should not update currentHabits for unknown type', () => {
      const initialHabits = component.currentHabits;
      component.form.get('type')?.setValue('Unknown');
      expect(component.currentHabits).toEqual(initialHabits);
    });
  });

  describe('Habit Creation', () => {
    beforeEach(() => {
      component.form.patchValue({
        type: 'Health',
        name: 'Exercise daily',
      });
    });

    it('should create habit with correct properties', () => {
      component.createHabit();

      expect(mockHabitService.createHabit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: 'Health',
          name: 'Exercise daily',
          start: jasmine.any(Date),
          sprint: jasmine.any(Array),
        })
      );
    });

    it('should create habit with UUID', () => {
      component.createHabit();

      const habitCall = mockHabitService.createHabit.calls.mostRecent();
      const habit: Habit = habitCall.args[0];
      expect(habit.id).toBeDefined();
      expect(typeof habit.id).toBe('string');
      expect(habit.id.length).toBeGreaterThan(0);
    });

    it('should create habit with 7-day sprint array initialized to false', () => {
      component.createHabit();

      const habitCall = mockHabitService.createHabit.calls.mostRecent();
      const habit: Habit = habitCall.args[0];
      expect(habit.sprint).toEqual([false, false, false, false, false, false, false]);
    });

    it('should close dialog after creating habit', () => {
      component.createHabit();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    it('should have habitTypes property defined', () => {
      expect(component.habitTypes).toBeDefined();
      expect(Array.isArray(component.habitTypes)).toBeTruthy();
    });

    it('should initialize currentHabits as empty array', () => {
      expect(component.currentHabits).toEqual([]);
    });

    it('should complete destroy subject on ngOnDestroy', () => {
      spyOn(component['_destroy$'], 'next');
      spyOn(component['_destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['_destroy$'].next).toHaveBeenCalled();
      expect(component['_destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Form Validation Edge Cases', () => {
    it('should be invalid with only type filled', () => {
      component.form.patchValue({ type: 'Health' });
      expect(component.form.valid).toBeFalsy();
    });

    it('should be invalid with only name filled', () => {
      component.form.patchValue({ name: 'Exercise' });
      expect(component.form.valid).toBeFalsy();
    });

    it('should handle empty string values', () => {
      component.form.patchValue({
        type: '',
        name: '',
      });
      expect(component.form.get('type')?.hasError('required')).toBeTruthy();
      expect(component.form.get('name')?.hasError('required')).toBeTruthy();
    });
  });
});
