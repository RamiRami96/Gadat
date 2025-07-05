import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';

import { HomeComponent } from './home.component';
import { AuthService } from '../../shared/services/auth.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let isAuthenticatedSignal: any;

  beforeEach(async () => {
    isAuthenticatedSignal = signal(false);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      isAuthenticated: isAuthenticatedSignal
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        HomeComponent,
        CommonModule,
        MatButtonModule,
        MatCardModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('template rendering', () => {
    it('should render main home structure', () => {
      const homeContainer = fixture.debugElement.query(By.css('.home'));
      const welcomeCard = fixture.debugElement.query(By.css('.home__welcome-card'));
      
      expect(homeContainer).toBeTruthy();
      expect(welcomeCard).toBeTruthy();
    });

    it('should display welcome title and subtitle', () => {
      const title = fixture.debugElement.query(By.css('.home__title'));
      const subtitle = fixture.debugElement.query(By.css('.home__subtitle'));
      
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent.trim()).toBe('Welcome to Gadat');
      expect(subtitle).toBeTruthy();
      expect(subtitle.nativeElement.textContent.trim()).toBe('Your Personal Habit Tracker');
    });

    it('should have proper card structure', () => {
      const card = fixture.debugElement.query(By.css('mat-card'));
      const cardHeader = fixture.debugElement.query(By.css('mat-card-header'));
      const cardContent = fixture.debugElement.query(By.css('mat-card-content'));
      
      expect(card).toBeTruthy();
      expect(cardHeader).toBeTruthy();
      expect(cardContent).toBeTruthy();
    });

    it('should have actions container', () => {
      const actionsContainer = fixture.debugElement.query(By.css('.home__actions'));
      
      expect(actionsContainer).toBeTruthy();
    });
  });

  describe('conditional rendering based on authentication', () => {
    it('should show Login button when user is not authenticated', () => {
      isAuthenticatedSignal.set(false);
      fixture.detectChanges();
      
      const loginButton = fixture.debugElement.query(By.css('button'));
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      
      expect(buttons.length).toBe(1);
      expect(loginButton.nativeElement.textContent.trim()).toBe('Login');
      expect(loginButton.attributes['color']).toBe('primary');
      expect(loginButton.attributes['mat-raised-button']).toBeDefined();
    });

    it('should show Go to My Habits and Logout buttons when user is authenticated', () => {
      isAuthenticatedSignal.set(true);
      fixture.detectChanges();
      
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      
      expect(buttons.length).toBe(2);
      
      const habitsButton = buttons[0];
      const logoutButton = buttons[1];
      
      expect(habitsButton.nativeElement.textContent.trim()).toBe('Go to My Habits');
      expect(habitsButton.attributes['color']).toBe('primary');
      expect(habitsButton.attributes['mat-raised-button']).toBeDefined();
      
      expect(logoutButton.nativeElement.textContent.trim()).toBe('Logout');
      expect(logoutButton.attributes['mat-stroked-button']).toBeDefined();
    });

    it('should not show Login button when user is authenticated', () => {
      isAuthenticatedSignal.set(true);
      fixture.detectChanges();
      
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const loginButton = buttons.find(btn => 
        btn.nativeElement.textContent.trim() === 'Login'
      );
      
      expect(loginButton).toBeFalsy();
    });

    it('should not show authenticated user buttons when not authenticated', () => {
      isAuthenticatedSignal.set(false);
      fixture.detectChanges();
      
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const habitsButton = buttons.find(btn => 
        btn.nativeElement.textContent.trim() === 'Go to My Habits'
      );
      const logoutButton = buttons.find(btn => 
        btn.nativeElement.textContent.trim() === 'Logout'
      );
      
      expect(habitsButton).toBeFalsy();
      expect(logoutButton).toBeFalsy();
    });
  });

  describe('navigation methods', () => {
    it('should navigate to habits page when navigateToHabits is called', () => {
      component.navigateToHabits();
      
      expect(router.navigate).toHaveBeenCalledWith(['/habits']);
    });

    it('should navigate to login page when navigateToLogin is called', () => {
      component.navigateToLogin();
      
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should call navigateToHabits multiple times successfully', () => {
      component.navigateToHabits();
      component.navigateToHabits();
      
      expect(router.navigate).toHaveBeenCalledTimes(2);
      expect(router.navigate).toHaveBeenCalledWith(['/habits']);
    });

    it('should call navigateToLogin multiple times successfully', () => {
      component.navigateToLogin();
      component.navigateToLogin();
      
      expect(router.navigate).toHaveBeenCalledTimes(2);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('logout functionality', () => {
    it('should call authService.logout and navigate to home when logout is called', () => {
      component.logout();
      
      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should call logout before navigation', () => {
      const callOrder: string[] = [];
      
      authService.logout.and.callFake(() => {
        callOrder.push('logout');
      });
      
      router.navigate.and.callFake(() => {
        callOrder.push('navigate');
        return Promise.resolve(true);
      });

      component.logout();

      expect(callOrder).toEqual(['logout', 'navigate']);
    });

    it('should navigate to root path after logout', () => {
      component.logout();

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('user interactions', () => {
    it('should call navigateToLogin when Login button is clicked', () => {
      isAuthenticatedSignal.set(false);
      fixture.detectChanges();
      
      spyOn(component, 'navigateToLogin');
      
      const loginButton = fixture.debugElement.query(By.css('button'));
      loginButton.nativeElement.click();
      
      expect(component.navigateToLogin).toHaveBeenCalled();
    });

    it('should call navigateToHabits when Go to My Habits button is clicked', () => {
      isAuthenticatedSignal.set(true);
      fixture.detectChanges();
      
      spyOn(component, 'navigateToHabits');
      
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const habitsButton = buttons[0];
      habitsButton.nativeElement.click();
      
      expect(component.navigateToHabits).toHaveBeenCalled();
    });

    it('should call logout when Logout button is clicked', () => {
      isAuthenticatedSignal.set(true);
      fixture.detectChanges();
      
      spyOn(component, 'logout');
      
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const logoutButton = buttons[1];
      logoutButton.nativeElement.click();
      
      expect(component.logout).toHaveBeenCalled();
    });

    it('should trigger actual navigation when Login button is clicked', () => {
      isAuthenticatedSignal.set(false);
      fixture.detectChanges();
      
      const loginButton = fixture.debugElement.query(By.css('button'));
      loginButton.nativeElement.click();
      
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should trigger actual navigation when Go to My Habits button is clicked', () => {
      isAuthenticatedSignal.set(true);
      fixture.detectChanges();
      
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const habitsButton = buttons[0];
      habitsButton.nativeElement.click();
      
      expect(router.navigate).toHaveBeenCalledWith(['/habits']);
    });

    it('should trigger actual logout when Logout button is clicked', () => {
      isAuthenticatedSignal.set(true);
      fixture.detectChanges();
      
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const logoutButton = buttons[1];
      logoutButton.nativeElement.click();
      
      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('component dependencies and structure', () => {
    it('should inject AuthService correctly', () => {
      expect(component.authService).toBeDefined();
      expect(component.authService).toBe(authService);
    });

    it('should inject Router correctly', () => {
      expect(component['router']).toBeDefined();
      expect(component['router']).toBe(router);
    });

    it('should have router as private property', () => {
      // Verify router is private (not accessible as public property)
      expect((component as any).router).toBeDefined();
    });

    it('should have authService as public property', () => {
      // AuthService is public since it's used in template
      expect(component.authService).toBeDefined();
    });
  });

  describe('authentication state reactivity', () => {
    it('should react to authentication state changes', () => {
      // Start unauthenticated
      isAuthenticatedSignal.set(false);
      fixture.detectChanges();
      
      let buttons = fixture.debugElement.queryAll(By.css('button'));
      expect(buttons.length).toBe(1);
      expect(buttons[0].nativeElement.textContent.trim()).toBe('Login');
      
      // Change to authenticated
      isAuthenticatedSignal.set(true);
      fixture.detectChanges();
      
      buttons = fixture.debugElement.queryAll(By.css('button'));
      expect(buttons.length).toBe(2);
      expect(buttons[0].nativeElement.textContent.trim()).toBe('Go to My Habits');
      expect(buttons[1].nativeElement.textContent.trim()).toBe('Logout');
    });

    it('should handle rapid authentication state changes', () => {
      // Rapid state changes
      isAuthenticatedSignal.set(true);
      fixture.detectChanges();
      isAuthenticatedSignal.set(false);
      fixture.detectChanges();
      isAuthenticatedSignal.set(true);
      fixture.detectChanges();
      
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      expect(buttons.length).toBe(2);
      expect(buttons[0].nativeElement.textContent.trim()).toBe('Go to My Habits');
      expect(buttons[1].nativeElement.textContent.trim()).toBe('Logout');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle logout errors gracefully', () => {
      authService.logout.and.throwError('Logout failed');
      
      expect(() => component.logout()).toThrow('Logout failed');
      // Verify navigation is not called if logout throws
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should handle navigation errors gracefully', () => {
      router.navigate.and.throwError('Navigation failed');
      
      expect(() => component.navigateToHabits()).toThrow('Navigation failed');
      expect(() => component.navigateToLogin()).toThrow('Navigation failed');
    });

    it('should maintain consistent state during logout error', () => {
      authService.logout.and.throwError('Service error');
      
      try {
        component.logout();
      } catch (error) {
        expect((error as Error).message).toBe('Service error');
      }
      
      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('method return types and signatures', () => {
    it('should have navigateToHabits method return void', () => {
      const result = component.navigateToHabits();
      
      expect(result).toBeUndefined();
    });

    it('should have navigateToLogin method return void', () => {
      const result = component.navigateToLogin();
      
      expect(result).toBeUndefined();
    });

    it('should have logout method return void', () => {
      const result = component.logout();
      
      expect(result).toBeUndefined();
    });
  });

  describe('Material UI integration', () => {
    it('should properly integrate with Material Card components', () => {
      const matCard = fixture.debugElement.query(By.css('mat-card'));
      const matCardHeader = fixture.debugElement.query(By.css('mat-card-header'));
      const matCardTitle = fixture.debugElement.query(By.css('mat-card-title'));
      const matCardSubtitle = fixture.debugElement.query(By.css('mat-card-subtitle'));
      const matCardContent = fixture.debugElement.query(By.css('mat-card-content'));

      expect(matCard).toBeTruthy();
      expect(matCardHeader).toBeTruthy();
      expect(matCardTitle).toBeTruthy();
      expect(matCardSubtitle).toBeTruthy();
      expect(matCardContent).toBeTruthy();
    });

    it('should use correct Material Button variants', () => {
      isAuthenticatedSignal.set(true);
      fixture.detectChanges();
      
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const habitsButton = buttons[0];
      const logoutButton = buttons[1];
      
      expect(habitsButton.attributes['mat-raised-button']).toBeDefined();
      expect(logoutButton.attributes['mat-stroked-button']).toBeDefined();
    });
  });
});
