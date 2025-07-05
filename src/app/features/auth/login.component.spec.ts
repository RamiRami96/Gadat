import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';

import { LoginComponent } from './login.component';
import { AuthService } from '../../shared/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form and no login error', () => {
    expect(component.loginForm.get('username')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
    expect(component.loginError).toBe('');
  });

  it('should render login form with correct elements', () => {
    const cardTitle = fixture.debugElement.query(By.css('mat-card-title'));
    const usernameField = fixture.debugElement.query(By.css('input[formControlName="username"]'));
    const passwordField = fixture.debugElement.query(By.css('input[formControlName="password"]'));
    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));

    expect(cardTitle.nativeElement.textContent).toContain('Login to Gadat');
    expect(usernameField).toBeTruthy();
    expect(passwordField).toBeTruthy();
    expect(passwordField.nativeElement.type).toBe('password');
    expect(submitButton).toBeTruthy();
  });

  it('should have submit button disabled when form is invalid', () => {
    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
    
    expect(component.loginForm.invalid).toBeTruthy();
    expect(submitButton.nativeElement.disabled).toBeTruthy();
  });

  it('should enable submit button when form is valid', () => {
    component.loginForm.patchValue({
      username: 'testuser',
      password: 'testpass'
    });
    fixture.detectChanges();

    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
    
    expect(component.loginForm.valid).toBeTruthy();
    expect(submitButton.nativeElement.disabled).toBeFalsy();
  });

  it('should show validation errors when fields are touched and invalid', () => {
    const usernameControl = component.loginForm.get('username');
    const passwordControl = component.loginForm.get('password');

    usernameControl?.markAsTouched();
    passwordControl?.markAsTouched();
    fixture.detectChanges();

    const usernameError = fixture.debugElement.query(By.css('mat-error'));
    expect(usernameError.nativeElement.textContent).toContain('Username is required');
  });

  it('should not call onSubmit when form is invalid', () => {
    spyOn(component, 'onSubmit').and.callThrough();
    
    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
    submitButton.nativeElement.click();
    
    expect(component.onSubmit).toHaveBeenCalled();
    expect(authService.login).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should call authService.login and navigate on successful login', () => {
    authService.login.and.returnValue(true);
    
    component.loginForm.patchValue({
      username: 'admin',
      password: 'password'
    });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith('admin', 'password');
    expect(router.navigate).toHaveBeenCalledWith(['/habits']);
    expect(component.loginError).toBe('');
  });

  it('should set loginError on failed login', () => {
    authService.login.and.returnValue(false);
    
    component.loginForm.patchValue({
      username: 'wronguser',
      password: 'wrongpass'
    });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith('wronguser', 'wrongpass');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.loginError).toBe('Invalid credentials');
  });

  it('should display login error message when loginError is set', () => {
    component.loginError = 'Invalid credentials';
    fixture.detectChanges();

    const errorElement = fixture.debugElement.query(By.css('.login__error'));
    expect(errorElement).toBeTruthy();
    expect(errorElement.nativeElement.textContent).toContain('Invalid credentials');
  });

  it('should not display error message when loginError is empty', () => {
    component.loginError = '';
    fixture.detectChanges();

    const errorElement = fixture.debugElement.query(By.css('.login__error'));
    expect(errorElement).toBeFalsy();
  });

  it('should call onSubmit when form is submitted', () => {
    spyOn(component, 'onSubmit');
    
    component.loginForm.patchValue({
      username: 'admin',
      password: 'password'
    });
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', null);

    expect(component.onSubmit).toHaveBeenCalled();
  });

  it('should have correct form validation requirements', () => {
    const usernameControl = component.loginForm.get('username');
    const passwordControl = component.loginForm.get('password');

    expect(usernameControl?.hasError('required')).toBeTruthy();
    expect(passwordControl?.hasError('required')).toBeTruthy();

    usernameControl?.setValue('test');
    passwordControl?.setValue('test');

    expect(usernameControl?.hasError('required')).toBeFalsy();
    expect(passwordControl?.hasError('required')).toBeFalsy();
  });

  it('should clear loginError on successful login', () => {
    // First set an error
    component.loginError = 'Some previous error';
    authService.login.and.returnValue(true);
    
    component.loginForm.patchValue({
      username: 'admin',
      password: 'password'
    });

    component.onSubmit();

    expect(component.loginError).toBe('');
  });

  it('should handle form input events correctly', () => {
    const usernameInput = fixture.debugElement.query(By.css('input[formControlName="username"]'));
    const passwordInput = fixture.debugElement.query(By.css('input[formControlName="password"]'));

    usernameInput.nativeElement.value = 'testuser';
    usernameInput.nativeElement.dispatchEvent(new Event('input'));
    
    passwordInput.nativeElement.value = 'testpass';
    passwordInput.nativeElement.dispatchEvent(new Event('input'));
    
    fixture.detectChanges();

    expect(component.loginForm.get('username')?.value).toBe('testuser');
    expect(component.loginForm.get('password')?.value).toBe('testpass');
  });
});
