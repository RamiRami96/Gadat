import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';

import { HabitFormComponent } from './habit-form.component';
import { HabitService } from '../../shared/services/habit.service';
import { Habit } from '../../shared/models/habit.model';

describe('HabitFormComponent', () => {
  let component: HabitFormComponent;
  let fixture: ComponentFixture<HabitFormComponent>;
  let habitService: jasmine.SpyObj<HabitService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  const mockHabit: Habit = {
    id: 'test-id',
    name: 'digital detox',
    type: 'health',
    start: new Date('2024-01-01'),
    sprint: [false, false, false, false, false, false, false]
  };

  beforeEach(async () => {
    const habitServiceSpy = jasmine.createSpyObj('HabitService', ['getHabit', 'createHabit', 'updateHabit']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    const activatedRouteMock = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue(null)
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        HabitFormComponent,
        CommonModule,
        MatButtonModule,
        MatStepperModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCardModule,
        MatDialogModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: HabitService, useValue: habitServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HabitFormComponent);
    component = fixture.componentInstance;
    habitService = TestBed.inject(HabitService) as jasmine.SpyObj<HabitService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    activatedRoute = TestBed.inject(ActivatedRoute);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.habitType()).toBe('');
    expect(component.habitName()).toBe('');
    expect(component.currentHabits()).toEqual([]);
    expect(component.isEditing).toBe(false);
    expect(component.isDialogMode).toBe(false);
  });

  describe('ngOnInit', () => {
    it('should set isEditing to false when no id in route', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue(null);
      
      component.ngOnInit();
      
      expect(component.isEditing).toBe(false);
    });

    it('should set isEditing to true when id exists in route', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('test-id');
      habitService.getHabit.and.returnValue(mockHabit);
      
      component.ngOnInit();
      
      expect(component.isEditing).toBe(true);
      expect(habitService.getHabit).toHaveBeenCalledWith('test-id');
    });

    it('should populate form with existing habit data when editing', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('test-id');
      habitService.getHabit.and.returnValue(mockHabit);
      
      component.ngOnInit();
      
      expect(component.habitType()).toBe('health');
      expect(component.habitName()).toBe('digital detox');
    });

    it('should set originalFormValue on init', () => {
      component.ngOnInit();
      
      expect(component.originalFormValue()).toEqual({ 
        type: component.habitType(), 
        name: component.habitName() 
      });
    });
  });

  describe('template rendering', () => {
    it('should display "Create New Habit" title when not editing', () => {
      component.isEditing = false;
      fixture.detectChanges();
      
      const title = fixture.debugElement.query(By.css('mat-card-title'));
      expect(title.nativeElement.textContent).toBe('Create New Habit');
    });

    it('should display "Edit Habit" title when editing', () => {
      component.isEditing = true;
      fixture.detectChanges();
      
      const title = fixture.debugElement.query(By.css('mat-card-title'));
      expect(title.nativeElement.textContent).toBe('Edit Habit');
    });

    it('should display habit type select', () => {
      const habitTypeSelect = fixture.debugElement.query(By.css('mat-select[required]'));
      expect(habitTypeSelect).toBeTruthy();
    });

    it('should show habit name select when habits are available', () => {
      component.currentHabits.set([
        { value: 'digital detox', viewValue: 'Digital Detox' }
      ]);
      fixture.detectChanges();
      
      const habitNameSelect = fixture.debugElement.queryAll(By.css('mat-select'))[1];
      expect(habitNameSelect).toBeTruthy();
    });

    it('should hide habit name select when no habits available', () => {
      component.currentHabits.set([]);
      fixture.detectChanges();
      
      const habitNameSelects = fixture.debugElement.queryAll(By.css('mat-select'));
      expect(habitNameSelects.length).toBe(1); // Only type select
    });

    it('should display Create button when not editing', () => {
      component.isEditing = false;
      fixture.detectChanges();
      
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitButton.nativeElement.textContent.trim()).toContain('Create Habit');
    });

    it('should display Update button when editing', () => {
      component.isEditing = true;
      fixture.detectChanges();
      
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitButton.nativeElement.textContent.trim()).toContain('Update Habit');
    });
  });

  describe('loadHabitsForType', () => {
    it('should load health habits when type is health', () => {
      component.onTypeChange('Health');
      
      expect(component.currentHabits().length).toBeGreaterThan(0);
      expect(component.currentHabits()[0].value).toBe('Regular exercise');
    });

    it('should load job habits when type is job', () => {
      component.onTypeChange('Job');
      
      expect(component.currentHabits().length).toBeGreaterThan(0);
      expect(component.currentHabits()[0].value).toBe('Daily goals');
    });

    it('should load relationship habits when type is relationships', () => {
      component.onTypeChange('Relationships');
      
      expect(component.currentHabits().length).toBeGreaterThan(0);
      expect(component.currentHabits()[0].value).toBe('Meet new people');
    });

    it('should clear habits for unknown type', () => {
      component.onTypeChange('Unknown');
      
      expect(component.currentHabits()).toEqual([]);
    });

    it('should handle case insensitive type matching', () => {
      component.onTypeChange('HEALTH');
      
      expect(component.currentHabits().length).toBeGreaterThan(0);
    });
  });

  describe('effect behavior', () => {
    it('should load habits when habitType changes', () => {
      spyOn(component as any, 'loadHabitsForType');
      
      component.habitType.set('Health');
      
      expect((component as any).loadHabitsForType).toHaveBeenCalledWith('Health');
    });

    it('should not load habits when habitType is empty', () => {
      spyOn(component as any, 'loadHabitsForType');
      
      component.habitType.set('');
      
      expect((component as any).loadHabitsForType).not.toHaveBeenCalled();
    });
  });

  describe('form validation', () => {
    it('should return false when habitType is empty', () => {
      component.habitType.set('');
      component.habitName.set('Some name');
      
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false when habitName is empty', () => {
      component.habitType.set('Health');
      component.habitName.set('');
      
      expect(component.isFormValid()).toBe(false);
    });

    it('should return true when both habitType and habitName are filled', () => {
      component.habitType.set('Health');
      component.habitName.set('digital detox');
      
      expect(component.isFormValid()).toBe(true);
    });

    it('should disable submit button when form is invalid', () => {
      component.habitType.set('');
      component.habitName.set('');
      fixture.detectChanges();
      
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitButton.nativeElement.disabled).toBe(true);
    });

    it('should enable submit button when form is valid', () => {
      component.habitType.set('Health');
      component.habitName.set('digital detox');
      fixture.detectChanges();
      
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitButton.nativeElement.disabled).toBe(false);
    });
  });

  describe('onSubmit', () => {
    it('should create new habit when not editing', () => {
      component.habitType.set('Health');
      component.habitName.set('digital detox');
      component.isEditing = false;
      
      component.onSubmit();
      
      expect(habitService.createHabit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: 'Health',
          name: 'digital detox',
          sprint: [false, false, false, false, false, false, false]
        })
      );
      expect(router.navigate).toHaveBeenCalledWith(['/habits']);
    });

    it('should update existing habit when editing', () => {
      const habitId = 'test-id';
      component.habitType.set('Job');
      component.habitName.set('stay focused');
      component.isEditing = true;
      (component as any).habitId = habitId;
      habitService.getHabit.and.returnValue(mockHabit);
      
      component.onSubmit();
      
      expect(habitService.updateHabit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          id: 'test-id',
          type: 'Job',
          name: 'stay focused'
        })
      );
      expect(router.navigate).toHaveBeenCalledWith(['/habits']);
    });

    it('should not submit when form is invalid', () => {
      component.habitType.set('');
      component.habitName.set('');
      
      component.onSubmit();
      
      expect(habitService.createHabit).not.toHaveBeenCalled();
      expect(habitService.updateHabit).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should update originalFormValue after successful submit', () => {
      component.habitType.set('Health');
      component.habitName.set('digital detox');
      
      component.onSubmit();
      
      expect(component.originalFormValue()).toEqual({
        type: 'Health',
        name: 'digital detox'
      });
    });
  });

  describe('event handlers', () => {
    it('should update habitType and clear habitName on type change', () => {
      component.onTypeChange('Health');
      
      expect(component.habitType()).toBe('Health');
      expect(component.habitName()).toBe('');
    });

    it('should update habitName on name change', () => {
      component.onNameChange('digital detox');
      
      expect(component.habitName()).toBe('digital detox');
    });
  });

  describe('cancel functionality', () => {
    it('should navigate to habits page when cancel is clicked', () => {
      component.cancel();
      
      expect(router.navigate).toHaveBeenCalledWith(['/habits']);
    });

    it('should call cancel when cancel button is clicked', () => {
      spyOn(component, 'cancel');
      
      const cancelButton = fixture.debugElement.query(By.css('button[type="button"]'));
      cancelButton.nativeElement.click();
      
      expect(component.cancel).toHaveBeenCalled();
    });
  });

  describe('canDeactivate guard', () => {
    it('should return true when in dialog mode', () => {
      component.isDialogMode = true;
      
      expect(component.canDeactivate()).toBe(true);
    });

    it('should return true when form has not changed', () => {
      component.originalFormValue.set({ type: 'Health', name: 'Exercise' });
      component.habitType.set('Health');
      component.habitName.set('Exercise');
      
      expect(component.canDeactivate()).toBe(true);
    });

    it('should call confirm when form has changed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      component.originalFormValue.set({ type: '', name: '' });
      component.habitType.set('Health');
      component.habitName.set('Exercise');
      
      const result = component.canDeactivate();
      
      expect(window.confirm).toHaveBeenCalledWith('You have unsaved changes. Are you sure you want to leave?');
      expect(result).toBe(true);
    });

    it('should return false when user cancels confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.originalFormValue.set({ type: '', name: '' });
      component.habitType.set('Health');
      component.habitName.set('Exercise');
      
      const result = component.canDeactivate();
      
      expect(result).toBe(false);
    });
  });

  describe('form change detection', () => {
    it('should detect form changes correctly', () => {
      component.originalFormValue.set({ type: 'Health', name: 'Exercise' });
      component.habitType.set('Job');
      component.habitName.set('Goals');
      
      expect((component as any).hasFormChanged()).toBe(true);
    });

    it('should detect no changes when values are same', () => {
      component.originalFormValue.set({ type: 'Health', name: 'Exercise' });
      component.habitType.set('Health');
      component.habitName.set('Exercise');
      
      expect((component as any).hasFormChanged()).toBe(false);
    });

    it('should compare form values correctly', () => {
      const value1 = { type: 'Health', name: 'Exercise' };
      const value2 = { type: 'Health', name: 'Exercise' };
      const value3 = { type: 'Job', name: 'Goals' };
      
      expect((component as any).formValuesEqual(value1, value2)).toBe(true);
      expect((component as any).formValuesEqual(value1, value3)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle null habit when editing', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('non-existent-id');
      habitService.getHabit.and.returnValue(null);
      
      expect(() => component.ngOnInit()).not.toThrow();
      expect(component.habitType()).toBe('');
      expect(component.habitName()).toBe('');
    });

    it('should handle empty string habitId', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('');
      
      component.ngOnInit();
      
      expect(component.isEditing).toBe(false);
    });

    it('should create habit with UUID', () => {
      component.habitType.set('Health');
      component.habitName.set('digital detox');
      
      component.onSubmit();
      
      const createCall = habitService.createHabit.calls.mostRecent();
      expect(createCall.args[0].id).toBeTruthy();
      expect(typeof createCall.args[0].id).toBe('string');
    });

    it('should create habit with current date', () => {
      component.habitType.set('Health');
      component.habitName.set('digital detox');
      
      const beforeSubmit = new Date();
      component.onSubmit();
      const afterSubmit = new Date();
      
      const createCall = habitService.createHabit.calls.mostRecent();
      const habitStart = createCall.args[0].start;
      expect(habitStart.getTime()).toBeGreaterThanOrEqual(beforeSubmit.getTime());
      expect(habitStart.getTime()).toBeLessThanOrEqual(afterSubmit.getTime());
    });
  });
});
