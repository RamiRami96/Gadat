import { Injectable, signal, computed, Signal } from '@angular/core';
import { User, StoredCredentials, AuthSession } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly AUTH_SESSION_KEY = 'auth_session';
  private readonly USER_CREDENTIALS_KEY = 'user_credentials';
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private _isAuthenticated = signal<boolean>(false);
  private _currentUser = signal<User | null>(null);
  private _sessionExpiresAt = signal<number | null>(null);

  constructor() {
    this.initializeAuthState();
  }

  get isAuthenticated() {
    return this._isAuthenticated.asReadonly();
  }

  get currentUser(): Signal<User | null> {
    return this._currentUser.asReadonly();
  }

  get sessionExpiresAt(): Signal<number | null> {
    return this._sessionExpiresAt.asReadonly();
  }

  get isSessionExpired(): Signal<boolean> {
    return computed(() => {
      const expiresAt = this._sessionExpiresAt();
      return expiresAt ? Date.now() > expiresAt : false;
    });
  }

  get timeUntilExpiry(): Signal<number> {
    return computed(() => {
      const expiresAt = this._sessionExpiresAt();
      return expiresAt ? Math.max(0, expiresAt - Date.now()) : 0;
    });
  }

  private initializeAuthState(): void {
    const session = this.getStoredSession();
    
    if (session && Date.now() < session.expiresAt) {
      this._isAuthenticated.set(true);
      this._currentUser.set(session.user);
      this._sessionExpiresAt.set(session.expiresAt);
    } else {
      this.clearAuthData();
    }
  }

  login(username: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        const credentials = this.getStoredCredentials();
        const user = credentials.find(cred => 
          cred.username === username && 
          this.decodePassword(cred.encodedPassword) === password
        );

        if (user) {
          const authUser: User = {
            id: this.generateUserId(username),
            username: user.username,
            name: user.name,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          };

          const session: AuthSession = {
            user: authUser,
            token: this.generateToken(),
            expiresAt: Date.now() + this.SESSION_DURATION,
            loginTimestamp: Date.now()
          };

          this.setAuthSession(session);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 500);
    });
  }

  register(username: string, password: string, name: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const credentials = this.getStoredCredentials();
        const existingUser = credentials.find(cred => cred.username === username);

        if (existingUser) {
          resolve(false);
        } else {
          const newCredentials: StoredCredentials = {
            username,
            encodedPassword: this.encodePassword(password),
            name
          };

          credentials.push(newCredentials);
          localStorage.setItem(this.USER_CREDENTIALS_KEY, JSON.stringify(credentials));
          resolve(true);
        }
      }, 300);
    });
  }

  logout(): void {
    this.clearAuthData();
  }

  refreshSession(): boolean {
    const session = this.getStoredSession();
    if (session && Date.now() < session.expiresAt) {
      session.expiresAt = Date.now() + this.SESSION_DURATION;
      this.setAuthSession(session);
      return true;
    } else {
      this.logout();
      return false;
    }
  }

  checkSessionValidity(): boolean {
    const session = this.getStoredSession();
    if (!session || Date.now() > session.expiresAt) {
      this.logout();
      return false;
    }
    return true;
  }

  getUserById(userId: string): User | null {
    const currentUser = this._currentUser();
    return currentUser && currentUser.id === userId ? currentUser : null;
  }

  updateUserProfile(updates: Partial<Pick<User, 'name'>>): boolean {
    const currentUser = this._currentUser();
    if (!currentUser) return false;

    const updatedUser = { ...currentUser, ...updates };
    const session = this.getStoredSession();
    
    if (session) {
      session.user = updatedUser;
      this.setAuthSession(session);
      return true;
    }
    
    return false;
  }

  private encodePassword(password: string): string {
    return btoa(password);
  }

  private decodePassword(encodedPassword: string): string {
    try {
      return atob(encodedPassword);
    } catch {
      return '';
    }
  }

  private generateToken(): string {
    return btoa(Math.random().toString(36) + Date.now().toString(36));
  }

  private generateUserId(username: string): string {
    return btoa(username + Date.now().toString()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private setAuthSession(session: AuthSession): void {
    localStorage.setItem(this.AUTH_SESSION_KEY, JSON.stringify(session));
    this._isAuthenticated.set(true);
    this._currentUser.set(session.user);
    this._sessionExpiresAt.set(session.expiresAt);
  }

  private getStoredSession(): AuthSession | null {
    try {
      const sessionJson = localStorage.getItem(this.AUTH_SESSION_KEY);
      return sessionJson ? JSON.parse(sessionJson) : null;
    } catch {
      return null;
    }
  }

  private getStoredCredentials(): StoredCredentials[] {
    try {
      const credsJson = localStorage.getItem(this.USER_CREDENTIALS_KEY);
      return credsJson ? JSON.parse(credsJson) : [];
    } catch {
      return [];
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.AUTH_SESSION_KEY);
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this._sessionExpiresAt.set(null);
  }
}
