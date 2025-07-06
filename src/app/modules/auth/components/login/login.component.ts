import { Component, inject, signal } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTabsModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private _authService = inject(AuthService);
  private _router = inject(Router);

  public loginForm: FormGroup;
  public registerForm: FormGroup;
  public loginError = signal<string>('');
  public registerError = signal<string>('');
  public registerSuccess = signal<string>('');
  public isLoading = signal<boolean>(false);
  public selectedTabIndex = signal<number>(0);

  constructor() {
    this.loginForm = new FormGroup({
      username: new FormControl('', [Validators.required, Validators.minLength(3)]),
      password: new FormControl('', [Validators.required, Validators.minLength(4)]),
    });

    this.registerForm = new FormGroup({
      username: new FormControl('', [Validators.required, Validators.minLength(3)]),
      name: new FormControl('', [Validators.required, Validators.minLength(2)]),
      password: new FormControl('', [Validators.required, Validators.minLength(4)]),
      confirmPassword: new FormControl('', [Validators.required]),
    });

    this.registerForm
      .get('confirmPassword')
      ?.setValidators([Validators.required, this.passwordMatchValidator.bind(this)]);

    if (this._authService.isAuthenticated()) {
      this._router.navigate(['/habits']);
    }
  }

  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.loginError.set('');

    const { username, password } = this.loginForm.value;

    try {
      const success = await this._authService.login(username, password);

      if (success) {
        await this._router.navigate(['/habits']);
      } else {
        this.loginError.set('Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.loginError.set('Login failed. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onRegister(): Promise<void> {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.registerError.set('');
    this.registerSuccess.set('');

    const { username, name, password } = this.registerForm.value;

    try {
      const success = await this._authService.register(username, password, name);

      if (success) {
        this.registerSuccess.set('Registration successful! You can now login.');
        this.registerForm.reset();
        setTimeout(() => {
          this.selectedTabIndex.set(0);
        }, 1000);
      } else {
        this.registerError.set('Username already exists. Please choose a different one.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.registerError.set('Registration failed. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private passwordMatchValidator(control: FormControl): { [key: string]: boolean } | null {
    const password = this.registerForm?.get('password')?.value;
    const confirmPassword = control.value;

    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  get loginUsernameError(): string {
    const control = this.loginForm.get('username');
    if (control?.hasError('required')) return 'Username is required';
    if (control?.hasError('minlength')) return 'Username must be at least 3 characters';
    return '';
  }

  get loginPasswordError(): string {
    const control = this.loginForm.get('password');
    if (control?.hasError('required')) return 'Password is required';
    if (control?.hasError('minlength')) return 'Password must be at least 4 characters';
    return '';
  }

  get registerUsernameError(): string {
    const control = this.registerForm.get('username');
    if (control?.hasError('required')) return 'Username is required';
    if (control?.hasError('minlength')) return 'Username must be at least 3 characters';
    return '';
  }

  get registerNameError(): string {
    const control = this.registerForm.get('name');
    if (control?.hasError('required')) return 'Name is required';
    if (control?.hasError('minlength')) return 'Name must be at least 2 characters';
    return '';
  }

  get registerPasswordError(): string {
    const control = this.registerForm.get('password');
    if (control?.hasError('required')) return 'Password is required';
    if (control?.hasError('minlength')) return 'Password must be at least 4 characters';
    return '';
  }

  get confirmPasswordError(): string {
    const control = this.registerForm.get('confirmPassword');
    if (control?.hasError('required')) return 'Please confirm your password';
    if (control?.hasError('passwordMismatch')) return 'Passwords do not match';
    return '';
  }
}
