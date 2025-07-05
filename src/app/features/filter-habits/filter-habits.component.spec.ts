import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { FilterHabitsComponent } from './filter-habits.component';

describe('FilterHabitsComponent', () => {
  let component: FilterHabitsComponent;
  let fixture: ComponentFixture<FilterHabitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FilterHabitsComponent,
        MatInputModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        BrowserAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterHabitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty search value and not loading', () => {
    expect(component.searchValue()).toBe('');
    expect(component.isLoading()).toBe(false);
  });

  it('should render search input with correct attributes', () => {
    const inputElement = fixture.debugElement.query(By.css('input[matInput]'));
    const matLabel = fixture.debugElement.query(By.css('mat-label'));
    
    expect(inputElement).toBeTruthy();
    expect(inputElement.nativeElement.placeholder).toBe('Type to search');
    expect(inputElement.nativeElement.autocomplete).toBe('off');
    expect(matLabel.nativeElement.textContent).toBe('Search');
  });

  it('should have correct CSS classes', () => {
    const formField = fixture.debugElement.query(By.css('mat-form-field'));
    
    expect(formField.nativeElement.classList).toContain('filter-form');
    expect(formField.attributes['appearance']).toBe('outline');
  });

  it('should update searchValue signal when input changes', () => {
    const inputElement = fixture.debugElement.query(By.css('input'));
    
    inputElement.nativeElement.value = 'test search';
    inputElement.nativeElement.dispatchEvent(new Event('input'));
    
    expect(component.searchValue()).toBe('test search');
  });

  it('should call onSearchInput when input event is triggered', () => {
    spyOn(component, 'onSearchInput').and.callThrough();
    const inputElement = fixture.debugElement.query(By.css('input'));
    
    inputElement.nativeElement.value = 'test';
    inputElement.nativeElement.dispatchEvent(new Event('input'));
    
    expect(component.onSearchInput).toHaveBeenCalled();
  });

  it('should reflect searchValue in input value attribute', () => {
    component.searchValue.set('test value');
    fixture.detectChanges();
    
    const inputElement = fixture.debugElement.query(By.css('input'));
    expect(inputElement.nativeElement.value).toBe('test value');
  });

  it('should show loading spinner when isLoading is true', fakeAsync(() => {
    component.searchValue.set('search term');
    fixture.detectChanges();
    
    // Should show spinner immediately after search value change
    const spinner = fixture.debugElement.query(By.css('mat-spinner'));
    expect(spinner).toBeTruthy();
    expect(spinner.nativeElement.classList).toContain('filter-form__spinner');
    expect(component.isLoading()).toBe(true);
    
    flush();
  }));

  it('should hide loading spinner when isLoading is false', fakeAsync(() => {
    component.searchValue.set('search term');
    fixture.detectChanges();
    
    // Wait for the effect timeout to complete
    tick(500);
    fixture.detectChanges();
    
    const spinner = fixture.debugElement.query(By.css('mat-spinner'));
    expect(spinner).toBeFalsy();
    expect(component.isLoading()).toBe(false);
  }));

  it('should emit searchHabits event after 500ms delay', fakeAsync(() => {
    spyOn(component.searchHabits, 'emit');
    
    component.searchValue.set('test search');
    
    // Should not emit immediately
    expect(component.searchHabits.emit).not.toHaveBeenCalled();
    
    // Should emit after 500ms
    tick(500);
    expect(component.searchHabits.emit).toHaveBeenCalledWith({ value: 'test search' });
  }));

  it('should emit searchHabits with empty string for initial load', fakeAsync(() => {
    spyOn(component.searchHabits, 'emit');
    
    // Initial effect should trigger
    tick(500);
    expect(component.searchHabits.emit).toHaveBeenCalledWith({ value: '' });
  }));

  it('should debounce multiple rapid search inputs', fakeAsync(() => {
    spyOn(component.searchHabits, 'emit');
    
    // Rapid input changes
    component.searchValue.set('a');
    tick(100);
    component.searchValue.set('ab');
    tick(100);
    component.searchValue.set('abc');
    tick(100);
    component.searchValue.set('abcd');
    
    // Should not have emitted yet
    expect(component.searchHabits.emit).not.toHaveBeenCalled();
    
    // Wait for full debounce period
    tick(500);
    
    // Should only emit once with the final value
    expect(component.searchHabits.emit).toHaveBeenCalledTimes(1);
    expect(component.searchHabits.emit).toHaveBeenCalledWith({ value: 'abcd' });
  }));

  it('should handle rapid consecutive inputs correctly', fakeAsync(() => {
    spyOn(component.searchHabits, 'emit');
    
    // First input
    component.searchValue.set('first');
    tick(400);
    
    // Second input before first timeout completes
    component.searchValue.set('second');
    tick(400);
    
    // Third input before second timeout completes
    component.searchValue.set('third');
    tick(500);
    
    // Should only emit the last value
    expect(component.searchHabits.emit).toHaveBeenCalledTimes(1);
    expect(component.searchHabits.emit).toHaveBeenCalledWith({ value: 'third' });
  }));

  it('should set loading to true immediately when search value changes', () => {
    component.searchValue.set('test');
    expect(component.isLoading()).toBe(true);
  });

  it('should set loading to false after search completes', fakeAsync(() => {
    component.searchValue.set('test');
    expect(component.isLoading()).toBe(true);
    
    tick(500);
    expect(component.isLoading()).toBe(false);
  }));

  it('should handle empty search input correctly', fakeAsync(() => {
    spyOn(component.searchHabits, 'emit');
    
    // Set initial value
    component.searchValue.set('test');
    tick(500);
    
    // Clear the search
    component.searchValue.set('');
    tick(500);
    
    expect(component.searchHabits.emit).toHaveBeenCalledWith({ value: '' });
  }));

  it('should properly clean up timeouts in effect', fakeAsync(() => {
    const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callThrough();
    
    component.searchValue.set('first');
    component.searchValue.set('second');
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    flush();
  }));

  it('should handle onSearchInput with proper event structure', () => {
    const mockEvent = {
      target: {
        value: 'test input'
      }
    } as unknown as Event;
    
    component.onSearchInput(mockEvent);
    
    expect(component.searchValue()).toBe('test input');
  });

  it('should maintain consistent state during multiple search operations', fakeAsync(() => {
    spyOn(component.searchHabits, 'emit');
    
    // First search
    component.searchValue.set('search1');
    expect(component.isLoading()).toBe(true);
    tick(500);
    expect(component.isLoading()).toBe(false);
    
    // Second search
    component.searchValue.set('search2');
    expect(component.isLoading()).toBe(true);
    tick(500);
    expect(component.isLoading()).toBe(false);
    
    expect(component.searchHabits.emit).toHaveBeenCalledTimes(2);
    expect(component.searchHabits.emit).toHaveBeenCalledWith({ value: 'search1' });
    expect(component.searchHabits.emit).toHaveBeenCalledWith({ value: 'search2' });
  }));

  it('should have correct spinner attributes', fakeAsync(() => {
    component.searchValue.set('test');
    fixture.detectChanges();
    
    const spinner = fixture.debugElement.query(By.css('mat-spinner'));
    expect(spinner.attributes['matSuffix']).toBeDefined();
    expect(spinner.attributes['diameter']).toBe('20');
    
    flush();
  }));
});