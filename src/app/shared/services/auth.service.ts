import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _isAuthenticated = signal<boolean>(false);

  constructor() {
    const authStatus = localStorage.getItem('isAuthenticated');
    this._isAuthenticated.set(authStatus === 'true');
  }

  get isAuthenticated() {
    return this._isAuthenticated.asReadonly();
  }

  login(username: string, password: string): boolean {
    if (username === 'admin' && password === 'password') {
      this._isAuthenticated.set(true);
      localStorage.setItem('isAuthenticated', 'true');
      return true;
    }
    return false;
  }

  logout(): void {
    this._isAuthenticated.set(false);
    localStorage.removeItem('isAuthenticated');
  }
}
