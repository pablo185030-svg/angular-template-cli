import { Injectable, computed, signal } from '@angular/core';
import { AuthService } from './auth.service';

/** Signs in a fake user without contacting Keycloak. Used by the e2e configuration only. */
@Injectable()
export class MockAuthService extends AuthService {
  private readonly authenticated = signal(true);

  readonly isAuthenticated = this.authenticated.asReadonly();
  readonly userName = computed(() => (this.authenticated() ? 'Demo User' : ''));

  /** @inheritdoc */
  async init(): Promise<void> {
    // Nothing to initialize.
  }

  /** @inheritdoc */
  login(): void {
    this.authenticated.set(true);
  }

  /** @inheritdoc */
  logout(): void {
    this.authenticated.set(false);
  }

  /** @inheritdoc */
  getAccessToken(): string | null {
    return this.authenticated() ? 'mock-token' : null;
  }
}
