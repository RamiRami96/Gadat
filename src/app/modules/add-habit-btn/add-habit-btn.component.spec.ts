import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

import { AddHabitBtnComponent } from './add-habit-btn.component';
import { CreateHabitComponent } from '../create-habit/create-habit.component';

describe('AddHabitBtnComponent', () => {
  let component: AddHabitBtnComponent;
  let fixture: ComponentFixture<AddHabitBtnComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [AddHabitBtnComponent, BrowserAnimationsModule],
      providers: [{ provide: MatDialog, useValue: dialogSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(AddHabitBtnComponent);
    component = fixture.componentInstance;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a dialog instance injected', () => {
    expect(component.dialog).toBeTruthy();
    expect(component.dialog).toBe(mockDialog);
  });

  it('should render button with correct text and icon', () => {
    const buttonElement = fixture.debugElement.query(By.css('button'));
    const iconElement = fixture.debugElement.query(By.css('mat-icon'));

    expect(buttonElement).toBeTruthy();
    expect(buttonElement.nativeElement.textContent.trim()).toContain('Add Habbit');
    expect(iconElement).toBeTruthy();
    expect(iconElement.nativeElement.textContent.trim()).toBe('add');
  });

  it('should have correct CSS classes on button', () => {
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

  it('should open dialog when createHabbit is called', () => {
    component.createHabbit();

    expect(mockDialog.open).toHaveBeenCalledWith(CreateHabitComponent, {
      maxWidth: '80vw',
      maxHeight: '80vh',
      height: '100%',
      width: '100%',
      enterAnimationDuration: '5000',
      exitAnimationDuration: '5000',
    });
  });

  it('should open dialog with correct configuration when button is clicked', () => {
    const buttonElement = fixture.debugElement.query(By.css('button'));

    buttonElement.nativeElement.click();

    expect(mockDialog.open).toHaveBeenCalledTimes(1);
    expect(mockDialog.open).toHaveBeenCalledWith(
      CreateHabitComponent,
      jasmine.objectContaining({
        maxWidth: '80vw',
        maxHeight: '80vh',
        height: '100%',
        width: '100%',
        enterAnimationDuration: '5000',
        exitAnimationDuration: '5000',
      })
    );
  });

  it('should trigger dialog open on button click through DOM event', () => {
    const buttonElement: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;

    buttonElement.click();
    fixture.detectChanges();

    expect(mockDialog.open).toHaveBeenCalledWith(CreateHabitComponent, jasmine.any(Object));
  });
});
