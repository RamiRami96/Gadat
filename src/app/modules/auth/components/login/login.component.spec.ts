import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'register']);
    // Mock isAuthenticated as a property that returns a signal-like function
    authServiceSpy.isAuthenticated = jasmine.createSpy('isAuthenticated').and.returnValue(false);

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
        MatProgressSpinnerModule,
        MatTabsModule,
        BrowserAnimationsModule,
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
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

  it('should initialize with empty forms and no errors', () => {
    expect(component.loginForm.get('username')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
    expect(component.registerForm.get('username')?.value).toBe('');
    expect(component.registerForm.get('name')?.value).toBe('');
    expect(component.registerForm.get('password')?.value).toBe('');
    expect(component.registerForm.get('confirmPassword')?.value).toBe('');
    expect(component.loginError()).toBe('');
    expect(component.registerError()).toBe('');
    expect(component.isLoading()).toBe(false);
  });

  it('should render auth form with tab group', () => {
    fixture.detectChanges();

    const cardTitle = fixture.debugElement.query(By.css('mat-card-title'));
    const tabGroup = fixture.debugElement.query(By.css('mat-tab-group'));

    expect(cardTitle.nativeElement.textContent).toContain('Welcome to Gadat');
    expect(tabGroup).toBeTruthy();
    // Note: Material tabs may not render fully in test environment,
    // so we just verify the tab group container exists
  });

  it('should have login form elements', () => {
    const usernameField = fixture.debugElement.query(By.css('input[formControlName="username"]'));
    const passwordField = fixture.debugElement.query(By.css('input[formControlName="password"]'));
    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));

    expect(usernameField).toBeTruthy();
    expect(passwordField).toBeTruthy();
    expect(passwordField.nativeElement.type).toBe('password');
    expect(submitButton).toBeTruthy();
  });

  it('should have login submit button disabled when form is invalid', () => {
    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));

    expect(component.loginForm.invalid).toBeTruthy();
    expect(submitButton.nativeElement.disabled).toBeTruthy();
  });

  it('should enable login submit button when form is valid', () => {
    component.loginForm.patchValue({
      username: 'testuser',
      password: 'testpass',
    });
    fixture.detectChanges();

    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));

    expect(component.loginForm.valid).toBeTruthy();
    expect(submitButton.nativeElement.disabled).toBeFalsy();
  });

  it('should show validation errors when login fields are touched and invalid', () => {
    const usernameControl = component.loginForm.get('username');
    const passwordControl = component.loginForm.get('password');

    usernameControl?.markAsTouched();
    passwordControl?.markAsTouched();
    fixture.detectChanges();

    expect(component.loginUsernameError).toContain('Username is required');
    expect(component.loginPasswordError).toContain('Password is required');
  });

  it('should call authService.login and navigate on successful login', async () => {
    authService.login.and.returnValue(Promise.resolve(true));

    component.loginForm.patchValue({
      username: 'admin',
      password: 'password',
    });

    await component.onLogin();

    expect(authService.login).toHaveBeenCalledWith('admin', 'password');
    expect(router.navigate).toHaveBeenCalledWith(['/habits']);
    expect(component.loginError()).toBe('');
  });

  it('should set loginError on failed login', async () => {
    authService.login.and.returnValue(Promise.resolve(false));

    component.loginForm.patchValue({
      username: 'wronguser',
      password: 'wrongpass',
    });

    await component.onLogin();

    expect(authService.login).toHaveBeenCalledWith('wronguser', 'wrongpass');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.loginError()).toBe('Invalid username or password');
  });

  it('should handle login service error', async () => {
    authService.login.and.returnValue(Promise.reject('Service error'));

    component.loginForm.patchValue({
      username: 'admin',
      password: 'password',
    });

    await component.onLogin();

    expect(component.loginError()).toBe('Login failed. Please try again.');
  });

  it('should show loading state during login', async () => {
    authService.login.and.returnValue(new Promise(resolve => setTimeout(() => resolve(true), 100)));

    component.loginForm.patchValue({
      username: 'admin',
      password: 'password',
    });

    const loginPromise = component.onLogin();

    expect(component.isLoading()).toBe(true);

    await loginPromise;

    expect(component.isLoading()).toBe(false);
  });

  // Registration tests
  it('should call authService.register on successful registration', async () => {
    authService.register.and.returnValue(Promise.resolve(true));

    component.registerForm.patchValue({
      username: 'newuser',
      name: 'New User',
      password: 'newpass',
      confirmPassword: 'newpass',
    });

    await component.onRegister();

    expect(authService.register).toHaveBeenCalledWith('newuser', 'newpass', 'New User');
    expect(component.registerSuccess()).toBe('Registration successful! You can now login.');
  });

  it('should set registerError on failed registration', async () => {
    authService.register.and.returnValue(Promise.resolve(false));

    component.registerForm.patchValue({
      username: 'existinguser',
      name: 'Existing User',
      password: 'password',
      confirmPassword: 'password',
    });

    await component.onRegister();

    expect(component.registerError()).toBe('Username already exists. Please choose a different one.');
  });

  it('should validate password confirmation', () => {
    component.registerForm.patchValue({
      username: 'testuser',
      name: 'Test User',
      password: 'password123',
      confirmPassword: 'different',
    });

    const confirmPasswordControl = component.registerForm.get('confirmPassword');
    expect(confirmPasswordControl?.hasError('passwordMismatch')).toBeTruthy();
    expect(component.confirmPasswordError).toBe('Passwords do not match');
  });

  it('should navigate to habits if user is already authenticated', async () => {
    // Reset the TestBed for this specific test
    TestBed.resetTestingModule();

    // Create a new spy that returns true for isAuthenticated
    const authenticatedAuthServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'register']);
    authenticatedAuthServiceSpy.isAuthenticated = jasmine.createSpy('isAuthenticated').and.returnValue(true);

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
        MatProgressSpinnerModule,
        MatTabsModule,
        BrowserAnimationsModule,
      ],
      providers: [
        { provide: AuthService, useValue: authenticatedAuthServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    // Create component which will trigger constructor logic
    const newFixture = TestBed.createComponent(LoginComponent);
    newFixture.detectChanges();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/habits']);
  });

  it('should not call onLogin when login form is invalid', async () => {
    spyOn(component, 'onLogin').and.callThrough();

    // Form is invalid by default (empty fields)
    await component.onLogin();

    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should not call onRegister when register form is invalid', async () => {
    spyOn(component, 'onRegister').and.callThrough();

    // Form is invalid by default (empty fields)
    await component.onRegister();

    expect(authService.register).not.toHaveBeenCalled();
  });
});
