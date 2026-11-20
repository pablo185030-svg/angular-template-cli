import { signal } from '@angular/core';
import { AuthService } from '../auth.service';

/** Controllable AuthService for unit tests. */
export class FakeAuthService extends AuthService {
  readonly authenticated = signal(false);
  readonly name = signal('');
  readonly loginCalls: (string | undefined)[] = [];
  logoutCalls = 0;
  token: string | null = null;

  readonly isAuthenticated = this.authenticated.asReadonly();
  readonly userName = this.name.asReadonly();

  async init(): Promise<void> {
    // Nothing to initialize.
  }

  login(targetUrl?: string): void {
    this.loginCalls.push(targetUrl);
  }

  logout(): void {
    this.logoutCalls++;
  }

  getAccessToken(): string | null {
    return this.token;
  }
}
