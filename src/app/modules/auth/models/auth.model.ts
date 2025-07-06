export interface User {
  id: string;
  username: string;
  name: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface StoredCredentials {
  username: string;
  encodedPassword: string;
  name: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
  loginTimestamp: number;
}
