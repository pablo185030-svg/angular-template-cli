import { Signal } from '@angular/core';
import { Permission } from './models/permission.model';
import { SignInResult } from './models/sign-in-result.model';

/**
 * Authentication contract used by the guards, the interceptor and the header. The app provides
 * `KeycloakAuthService` in real environments and `MockAuthService` in demo mode and the e2e
 * configuration; unit tests provide their own fake.
 */
export abstract class AuthService {
  /** True when no real identity provider is used (demo mode with the seeded users). */
  abstract readonly isDemo: boolean;

  /** True when the app shows its own login screen (`/login`) instead of redirecting elsewhere. */
  abstract readonly hasLoginPage: boolean;

  /** True while the user holds a valid access token. */
  abstract readonly isAuthenticated: Signal<boolean>;

  /** Display name of the signed-in user, or an empty string when signed out. */
  abstract readonly userName: Signal<string>;

  /** Name of the signed-in user's role, or an empty string when unknown or signed out. */
  abstract readonly roleName: Signal<string>;

  /** Permissions of the signed-in user (empty when signed out). */
  abstract readonly permissions: Signal<Permission[]>;

  /** Runs once at startup, before the first navigation. Resolves when the auth state is known. */
  abstract init(): Promise<void>;

  /**
   * Starts the login flow.
   * @param {string} [targetUrl] - App route to return to after a successful login.
   */
  abstract login(targetUrl?: string): void;

  /**
   * Signs in with a username and password. Only services with a login page (`hasLoginPage`)
   * implement it; the others report that passwords are not used.
   */
  signIn(...credentials: [username: string, password: string]): Promise<SignInResult> {
    void credentials;
    return Promise.resolve({ ok: false, message: 'Este modo de autenticación no usa contraseña.' });
  }

  /** Ends the session. */
  abstract logout(): void;

  /** Returns the current access token, or null when signed out. */
  abstract getAccessToken(): string | null;

  /**
   * Tells whether the signed-in user holds a permission.
   * @param {Permission} permission - Permission to check.
   */
  hasPermission(permission: Permission): boolean {
    return this.permissions().includes(permission);
  }
}
