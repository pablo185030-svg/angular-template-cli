import { Injectable, computed, signal } from '@angular/core';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';
import { decodeToken } from './decode-token';
import { TokenClaims } from './models/token-claims.model';

const LOCAL_TOKEN = 'mock-token';
const LOCAL_USER_NAME = 'Usuario demo';
const TOKEN_REQUEST_TIMEOUT_MS = 2000;

/**
 * Signs in a fake user without contacting Keycloak. Used in demo mode (the default until Keycloak
 * is configured, see `npm run configure:keycloak`) and by the e2e configuration.
 *
 * `init()` asks the mock API for a fake token (`POST {apiBaseUrl}/auth/token`) so the demo
 * exercises the real token path. When the products data source is JSON, or the mock API does not
 * answer, the service keeps a local fake token instead and the app still works. The token is held
 * in memory only.
 */
@Injectable()
export class MockAuthService extends AuthService {
  private readonly authenticated = signal(true);
  private readonly token = signal(LOCAL_TOKEN);
  private readonly claims = signal<TokenClaims | null>(null);

  readonly isDemo = true;
  readonly isAuthenticated = this.authenticated.asReadonly();
  readonly userName = computed(() =>
    this.authenticated() ? (this.claims()?.name ?? LOCAL_USER_NAME) : '',
  );

  /** @inheritdoc */
  async init(): Promise<void> {
    // The JSON data source means there is no mock API to ask.
    if (environment.api.mode === 'json') return;

    try {
      // `fetch` and not `HttpClient`: the interceptor asks this service for the token.
      const response = await fetch(`${environment.apiBaseUrl}/auth/token`, {
        method: 'POST',
        signal: AbortSignal.timeout(TOKEN_REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const body = await response.json();
      const accessToken = body?.access_token;
      const claims = typeof accessToken === 'string' ? decodeToken(accessToken) : null;
      if (!claims) throw new Error('The response has no valid access token');

      this.token.set(accessToken);
      this.claims.set(claims);
    } catch (error) {
      console.warn(
        'Demo mode: could not get a token from the mock API, using a local fake token.',
        error,
      );
    }
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
    return this.authenticated() ? this.token() : null;
  }
}
