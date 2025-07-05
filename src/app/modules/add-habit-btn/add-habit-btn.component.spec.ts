import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';

import { AddHabitBtnComponent } from './add-habit-btn.component';

describe('AddHabitBtnComponent', () => {
  let component: AddHabitBtnComponent;
  let fixture: ComponentFixture<AddHabitBtnComponent>;
  let router: jasmine.SpyObj<Router>;
  let routerSpy: jasmine.Spy;

  beforeEach(async () => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        AddHabitBtnComponent,
        MatButtonModule,
        MatIconModule
      ],
      providers: [
        { provide: Router, useValue: routerSpyObj }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddHabitBtnComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    routerSpy = router.navigate;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render button with correct text and icon', () => {
    const buttonElement = fixture.debugElement.query(By.css('button'));
    const iconElement = fixture.debugElement.query(By.css('mat-icon'));
    
    expect(buttonElement).toBeTruthy();
    expect(buttonElement.nativeElement.textContent.trim()).toContain('Add Habbit');
    expect(iconElement).toBeTruthy();
    expect(iconElement.nativeElement.textContent.trim()).toBe('add');
  });

  it('should have correct CSS classes and attributes', () => {
    const buttonElement = fixture.debugElement.query(By.css('button'));
    
    expect(buttonElement.nativeElement.classList).toContain('btn');
    expect(buttonElement.attributes['mat-raised-button']).toBeDefined();
  });

  it('should call createHabbit method when button is clicked', () => {
    spyOn(component, 'createHabbit');
    const buttonElement = fixture.debugElement.query(By.css('button'));
    
    buttonElement.nativeElement.click();
    
    expect(component.createHabbit).toHaveBeenCalled();
  });

  it('should navigate to /habits/create when createHabbit is called', () => {
    component.createHabbit();
    
    expect(routerSpy).toHaveBeenCalledWith(['/habits/create']);
  });

  it('should navigate to /habits/create when button is clicked', () => {
    const buttonElement = fixture.debugElement.query(By.css('button'));
    
    buttonElement.nativeElement.click();
    
    expect(routerSpy).toHaveBeenCalledWith(['/habits/create']);
  });

  it('should have the correct component structure', () => {
    const buttonElement = fixture.debugElement.query(By.css('button.btn[mat-raised-button]'));
    const iconElement = fixture.debugElement.query(By.css('mat-icon'));
    
    expect(buttonElement).toBeTruthy();
    expect(iconElement).toBeTruthy();
    expect(iconElement.parent?.nativeElement).toBe(buttonElement.nativeElement);
  });
});