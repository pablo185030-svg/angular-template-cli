import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';
import { decodeToken, encodeToken } from './decode-token';
import { SignInResult } from './models/sign-in-result.model';
import { TokenClaims } from './models/token-claims.model';

const REQUEST_TIMEOUT_MS = 5000;
const TOKEN_TTL_SECONDS = 8 * 60 * 60;
const INVALID_CREDENTIALS = 'Usuario o contraseña incorrectos.';
const FAILED = 'No se pudo iniciar sesión. Intentá de nuevo.';

interface SeedUser {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  id: number;
}

/**
 * Demo-mode authentication without Keycloak (the default until Keycloak is configured, see
 * `npm run configure:keycloak`, and the e2e configuration). Nobody is signed in at start: the
 * app shows its own login screen and `signIn()` checks the seeded users.
 *
 * With the mock API as data source the credentials are checked by `POST {apiBaseUrl}/auth/login`
 * and the token comes from it. With the JSON data source (no server) they are checked in the
 * browser against `mock/users.json` and a local unsigned token is built. The token is held in
 * memory only, so a reload signs the user out.
 */
@Injectable()
export class MockAuthService extends AuthService {
  private readonly router = inject(Router);
  private readonly token = signal<string | null>(null);
  private readonly claims = signal<TokenClaims | null>(null);

  readonly isDemo = true;
  readonly hasLoginPage = true;
  readonly isAuthenticated = computed(() => this.claims() !== null);
  readonly userName = computed(() => this.claims()?.name ?? '');

  /** @inheritdoc */
  async init(): Promise<void> {
    // Nothing to restore: the session lives in memory only.
  }

  /** @inheritdoc */
  login(targetUrl?: string): void {
    const returnUrl = targetUrl && targetUrl !== '/' ? targetUrl : undefined;
    void this.router.navigate(['/login'], { queryParams: returnUrl ? { returnUrl } : {} });
  }

  /** @inheritdoc */
  override async signIn(username: string, password: string): Promise<SignInResult> {
    try {
      const token =
        environment.api.mode === 'json'
          ? await this.localToken(username, password)
          : await this.apiToken(username, password);
      if (token === null) return { ok: false, message: INVALID_CREDENTIALS };

      const claims = decodeToken(token);
      if (!claims) return { ok: false, message: FAILED };

      this.token.set(token);
      this.claims.set(claims);
      return { ok: true };
    } catch (error) {
      console.warn('Demo mode: sign-in failed.', error);
      return { ok: false, message: FAILED };
    }
  }

  /** @inheritdoc */
  logout(): void {
    this.token.set(null);
    this.claims.set(null);
    void this.router.navigate(['/login']);
  }

  /** @inheritdoc */
  getAccessToken(): string | null {
    return this.token();
  }

  /** Asks the mock API for a token. Returns null for wrong credentials. */
  private async apiToken(username: string, password: string): Promise<string | null> {
    // `fetch` and not `HttpClient`: the interceptor asks this service for the token.
    const response = await fetch(`${environment.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.status === 401) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const accessToken = (await response.json())?.access_token;
    if (typeof accessToken !== 'string') throw new Error('The response has no access token');
    return accessToken;
  }

  /** Checks the seeded users in the browser and builds a local token. Null for wrong credentials. */
  private async localToken(username: string, password: string): Promise<string | null> {
    const response = await fetch('mock/users.json', {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const users: SeedUser[] = await response.json();

    const user = users.find((u) => u.username === username && u.password === password);
    if (!user) return null;

    return encodeToken({
      sub: String(user.id),
      name: `${user.firstName} ${user.lastName}`,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    });
  }
}
