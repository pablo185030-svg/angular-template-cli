import { Injectable, computed, signal } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Signs in a fake user without contacting Keycloak. Used in demo mode (the default until Keycloak
 * is configured, see `npm run configure:keycloak`) and by the e2e configuration.
 */
@Injectable()
export class MockAuthService extends AuthService {
  private readonly authenticated = signal(true);

  readonly isDemo = true;
  readonly isAuthenticated = this.authenticated.asReadonly();
  readonly userName = computed(() => (this.authenticated() ? 'Usuario demo' : ''));

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
    // Demo mode has no session to end: the fake user stays signed in.
  }

  /** @inheritdoc */
  getAccessToken(): string | null {
    return this.authenticated() ? 'mock-token' : null;
  }
}
