import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

import { FilterHabitsComponent } from './filter-habits.component';

describe('FilterHabitsComponent', () => {
  let component: FilterHabitsComponent;
  let fixture: ComponentFixture<FilterHabitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FilterHabitsComponent,
        ReactiveFormsModule,
        MatInputModule,
        MatProgressSpinnerModule,
        BrowserAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterHabitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize searchControl with empty string', () => {
    expect(component.searchControl.value).toBe('');
  });

  it('should initialize isLoading as false', () => {
    expect(component.isLoading).toBe(false);
  });

  it('should render search input field', () => {
    const inputElement = fixture.debugElement.query(By.css('input[matInput]'));
    expect(inputElement).toBeTruthy();
    expect(inputElement.nativeElement.placeholder).toBe('Type to search');
  });

  it('should render mat-label with "Search" text', () => {
    const labelElement = fixture.debugElement.query(By.css('mat-label'));
    expect(labelElement).toBeTruthy();
    expect(labelElement.nativeElement.textContent.trim()).toBe('Search');
  });

  it('should not show spinner initially', () => {
    const spinnerElement = fixture.debugElement.query(By.css('mat-spinner'));
    expect(spinnerElement).toBeFalsy();
  });

  it('should show spinner when isLoading is true', () => {
    component.isLoading = true;
    fixture.detectChanges();

    const spinnerElement = fixture.debugElement.query(By.css('mat-spinner'));
    expect(spinnerElement).toBeTruthy();
  });

  it('should emit searchHabits event when search control value changes', fakeAsync(() => {
    spyOn(component.searchHabits, 'emit');

    component.searchControl.setValue('test search');
    tick(500); // Wait for debounce

    expect(component.searchHabits.emit).toHaveBeenCalledWith({ value: 'test search' });
  }));

  it('should debounce search input changes', fakeAsync(() => {
    spyOn(component.searchHabits, 'emit');

    // Set multiple values quickly
    component.searchControl.setValue('t');
    tick(100);
    component.searchControl.setValue('te');
    tick(100);
    component.searchControl.setValue('test');
    tick(500); // Wait for debounce

    // Should only emit once with the final value
    expect(component.searchHabits.emit).toHaveBeenCalledTimes(1);
    expect(component.searchHabits.emit).toHaveBeenCalledWith({ value: 'test' });
  }));

  it('should set isLoading to true then false during search', fakeAsync(() => {
    component.searchControl.setValue('test');

    // Should be true immediately after value change
    expect(component.isLoading).toBe(true);

    tick(500); // Wait for debounce

    // Should be false after emission
    expect(component.isLoading).toBe(false);
  }));

  it('should emit null value when search control is cleared', fakeAsync(() => {
    spyOn(component.searchHabits, 'emit');

    component.searchControl.setValue(null);
    tick(500); // Wait for debounce

    expect(component.searchHabits.emit).toHaveBeenCalledWith({ value: null });
  }));

  it('should emit empty string when search control is set to empty', fakeAsync(() => {
    spyOn(component.searchHabits, 'emit');

    component.searchControl.setValue('');
    tick(500); // Wait for debounce

    expect(component.searchHabits.emit).toHaveBeenCalledWith({ value: '' });
  }));

  it('should update input value when searchControl value is set programmatically', () => {
    const inputElement: HTMLInputElement = fixture.debugElement.query(By.css('input[matInput]')).nativeElement;

    component.searchControl.setValue('programmatic value');
    fixture.detectChanges();

    expect(inputElement.value).toBe('programmatic value');
  });

  it('should complete destroy subject on ngOnDestroy', () => {
    spyOn(component['_destroy$'], 'next');
    spyOn(component['_destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['_destroy$'].next).toHaveBeenCalled();
    expect(component['_destroy$'].complete).toHaveBeenCalled();
  });

  it('should stop emitting events after component is destroyed', fakeAsync(() => {
    spyOn(component.searchHabits, 'emit');

    component.ngOnDestroy();
    component.searchControl.setValue('test after destroy');
    tick(500);

    expect(component.searchHabits.emit).not.toHaveBeenCalled();
  }));

  it('should handle input autocomplete attribute', () => {
    const inputElement = fixture.debugElement.query(By.css('input[matInput]'));
    expect(inputElement.nativeElement.getAttribute('autocomplete')).toBe('off');
  });
});
