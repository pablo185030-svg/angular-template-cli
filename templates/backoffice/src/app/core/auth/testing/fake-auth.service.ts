import { signal } from '@angular/core';
import { AuthService } from '../auth.service';
import { SignInResult } from '../models/sign-in-result.model';

/** Controllable AuthService for unit tests. */
export class FakeAuthService extends AuthService {
  isDemo = false;
  hasLoginPage = true;
  signInResult: SignInResult = { ok: true };
  readonly signInCalls: [string, string][] = [];
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

  override async signIn(username: string, password: string): Promise<SignInResult> {
    this.signInCalls.push([username, password]);
    return this.signInResult;
  }

  logout(): void {
    this.logoutCalls++;
  }

  getAccessToken(): string | null {
    return this.token;
  }
}
