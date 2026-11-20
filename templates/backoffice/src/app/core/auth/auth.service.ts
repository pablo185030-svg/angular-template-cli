import { Signal } from '@angular/core';

/**
 * Authentication contract used by the guard, the interceptor and the header. The app provides
 * `KeycloakAuthService` in real environments and `MockAuthService` in the e2e configuration;
 * unit tests provide their own fake.
 */
export abstract class AuthService {
  /** True while the user holds a valid access token. */
  abstract readonly isAuthenticated: Signal<boolean>;

  /** Display name of the signed-in user, or an empty string when signed out. */
  abstract readonly userName: Signal<string>;

  /** Runs once at startup, before the first navigation. Resolves when the auth state is known. */
  abstract init(): Promise<void>;

  /**
   * Starts the login flow.
   * @param {string} [targetUrl] - App route to return to after a successful login.
   */
  abstract login(targetUrl?: string): void;

  /** Ends the session. */
  abstract logout(): void;

  /** Returns the current access token, or null when signed out. */
  abstract getAccessToken(): string | null;
}
