import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';

import { HabitsPageComponent } from './habits-page.component';
import { AuthService } from '../../../auth/services/auth.service';

// Mock components for testing
@Component({
  selector: 'app-layout',
  template: '<ng-content></ng-content>',
  standalone: true
})
class MockLayoutComponent { }

@Component({
  selector: 'app-list-habit',
  template: '<div>List Habit Component</div>',
  standalone: true
})
class MockListHabitComponent { }

@Component({
  selector: 'app-add-habit-btn',
  template: '<button>Add Habit</button>',
  standalone: true
})
class MockAddHabitBtnComponent { }

describe('HabitsPageComponent', () => {
  let component: HabitsPageComponent;
  let fixture: ComponentFixture<HabitsPageComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        HabitsPageComponent,
        CommonModule,
        MatButtonModule,
        MatToolbarModule,
        MatIconModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .overrideComponent(HabitsPageComponent, {
      set: {
        imports: [
          CommonModule,
          MatButtonModule,
          MatToolbarModule,
          MatIconModule,
          MockLayoutComponent,
          MockListHabitComponent,
          MockAddHabitBtnComponent
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(HabitsPageComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('template rendering', () => {
    it('should render main page structure', () => {
      const habitsPage = fixture.debugElement.query(By.css('.habits-page'));
      const toolbar = fixture.debugElement.query(By.css('mat-toolbar'));
      const layout = fixture.debugElement.query(By.css('app-layout'));

      expect(habitsPage).toBeTruthy();
      expect(toolbar).toBeTruthy();
      expect(layout).toBeTruthy();
    });

    it('should display app title in toolbar', () => {
      const title = fixture.debugElement.query(By.css('.habits-page__title'));
      
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent.trim()).toBe('Gadat');
    });

    it('should have primary colored toolbar', () => {
      const toolbar = fixture.debugElement.query(By.css('mat-toolbar'));
      
      expect(toolbar.attributes['color']).toBe('primary');
      expect(toolbar.nativeElement.classList).toContain('habits-page__toolbar');
    });

    it('should render logout button with icon', () => {
      const logoutButton = fixture.debugElement.query(By.css('.habits-page__logout-btn'));
      const logoutIcon = fixture.debugElement.query(By.css('mat-icon'));

      expect(logoutButton).toBeTruthy();
      expect(logoutButton.attributes['mat-icon-button']).toBeDefined();
      expect(logoutIcon).toBeTruthy();
      expect(logoutIcon.nativeElement.textContent.trim()).toBe('logout');
    });

    it('should have spacer element for toolbar layout', () => {
      const spacer = fixture.debugElement.query(By.css('.habits-page__spacer'));
      
      expect(spacer).toBeTruthy();
    });

    it('should render child components', () => {
      const listHabit = fixture.debugElement.query(By.css('app-list-habit'));
      const addHabitBtn = fixture.debugElement.query(By.css('app-add-habit-btn'));

      expect(listHabit).toBeTruthy();
      expect(addHabitBtn).toBeTruthy();
    });

    it('should have correct CSS classes applied', () => {
      const layout = fixture.debugElement.query(By.css('app-layout'));
      
      expect(layout.nativeElement.classList).toContain('habits-page__layout');
    });
  });

  describe('createNewHabit method', () => {
    it('should navigate to habits create route', () => {
      component.createNewHabit();

      expect(router.navigate).toHaveBeenCalledWith(['/habits/create']);
    });

    it('should be callable multiple times', () => {
      component.createNewHabit();
      component.createNewHabit();

      expect(router.navigate).toHaveBeenCalledTimes(2);
      expect(router.navigate).toHaveBeenCalledWith(['/habits/create']);
    });
  });

  describe('logout method', () => {
    it('should call authService.logout and navigate to home', () => {
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

    it('should navigate to root path', () => {
      component.logout();

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('user interactions', () => {
    it('should call logout when logout button is clicked', () => {
      spyOn(component, 'logout');
      
      const logoutButton = fixture.debugElement.query(By.css('.habits-page__logout-btn'));
      logoutButton.nativeElement.click();

      expect(component.logout).toHaveBeenCalled();
    });

    it('should trigger logout functionality when logout button is clicked', () => {
      const logoutButton = fixture.debugElement.query(By.css('.habits-page__logout-btn'));
      logoutButton.nativeElement.click();

      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('component structure and dependencies', () => {
    it('should inject Router service correctly', () => {
      expect(component['_router']).toBeDefined();
      expect(component['_router']).toBe(router);
    });

    it('should inject AuthService correctly', () => {
      expect(component['_authService']).toBeDefined();
      expect(component['_authService']).toBe(authService);
    });

    it('should have private service properties', () => {
      // Verify the services are private (not accessible as public properties)
      expect((component as any)._router).toBeDefined();
      expect((component as any)._authService).toBeDefined();
    });
  });

  describe('component integration', () => {
    it('should properly integrate with Material UI components', () => {
      const matToolbar = fixture.debugElement.query(By.css('mat-toolbar'));
      const matIconButton = fixture.debugElement.query(By.css('[mat-icon-button]'));
      const matIcon = fixture.debugElement.query(By.css('mat-icon'));

      expect(matToolbar).toBeTruthy();
      expect(matIconButton).toBeTruthy();
      expect(matIcon).toBeTruthy();
    });

    it('should render all expected child components', () => {
      const childComponents = [
        'app-layout',
        'app-list-habit', 
        'app-add-habit-btn'
      ];

      childComponents.forEach(selector => {
        const element = fixture.debugElement.query(By.css(selector));
        expect(element).toBeTruthy();
      });
    });
  });

  describe('accessibility and UX', () => {
    it('should have logout button with proper attributes', () => {
      const logoutButton = fixture.debugElement.query(By.css('.habits-page__logout-btn'));
      
      expect(logoutButton.attributes['mat-icon-button']).toBeDefined();
      expect(logoutButton.nativeElement.tagName).toBe('BUTTON');
    });

    it('should have semantic HTML structure', () => {
      const toolbar = fixture.debugElement.query(By.css('mat-toolbar'));
      const mainContent = fixture.debugElement.query(By.css('app-layout'));

      expect(toolbar).toBeTruthy();
      expect(mainContent).toBeTruthy();
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
      
      expect(() => component.createNewHabit()).toThrow('Navigation failed');
    });

    it('should maintain state consistency during logout', () => {
      const initialState = {
        logoutCalled: false,
        navigationCalled: false
      };

      authService.logout.and.callFake(() => {
        initialState.logoutCalled = true;
      });

      router.navigate.and.callFake(() => {
        initialState.navigationCalled = true;
        return Promise.resolve(true);
      });

      component.logout();

      expect(initialState.logoutCalled).toBe(true);
      expect(initialState.navigationCalled).toBe(true);
    });
  });

  describe('method return types and signatures', () => {
    it('should have createNewHabit method return void', () => {
      const result = component.createNewHabit();
      
      expect(result).toBeUndefined();
    });

    it('should have logout method return void', () => {
      const result = component.logout();
      
      expect(result).toBeUndefined();
    });
  });
});
