import { Location } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { OAuthEvent, OAuthService } from 'angular-oauth2-oidc';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';
import { decodePayload } from './decode-token';

/** OAuth events that mean the session is over and the user must be signed out. */
const SESSION_END_EVENTS = new Set<OAuthEvent['type']>([
  'logout',
  'session_terminated',
  'token_refresh_error',
  'silent_refresh_error',
]);

/** Authenticates against Keycloak with the Authorization Code flow and PKCE. */
@Injectable()
export class KeycloakAuthService extends AuthService {
  private readonly oauth = inject(OAuthService);
  private readonly location = inject(Location);

  private readonly authenticated = signal(false);
  private readonly name = signal('');

  readonly isDemo = false;
  readonly hasLoginPage = false;
  readonly isAuthenticated = this.authenticated.asReadonly();
  readonly userName = this.name.asReadonly();

  constructor() {
    super();
    this.oauth.events.subscribe((event) => {
      // `token_expires` only triggers the silent refresh; it is not the end of the session.
      if (SESSION_END_EVENTS.has(event.type)) this.endSession();
    });
  }

  /** @inheritdoc */
  async init(): Promise<void> {
    this.oauth.configure(environment.auth.authConfig);

    await this.oauth.loadDiscoveryDocumentAndTryLogin();
    this.oauth.setupAutomaticSilentRefresh();
    this.refreshState();

    // Back from Keycloak: restore the route the user originally asked for, before the router
    // runs its first navigation.
    if (this.authenticated() && this.oauth.state) {
      this.location.replaceState(decodeURIComponent(this.oauth.state));
    }
  }

  /** @inheritdoc */
  login(targetUrl = '/'): void {
    this.oauth.initCodeFlow(encodeURIComponent(targetUrl));
  }

  /** @inheritdoc */
  logout(): void {
    this.endSession();
  }

  /** @inheritdoc */
  getAccessToken(): string | null {
    return this.authenticated() ? this.oauth.getAccessToken() : null;
  }

  /** Decoded payload of the access token (not verified), or null without a readable token. */
  getPayloadToken(): Record<string, unknown> | null {
    const token = this.getAccessToken();
    return token ? decodePayload(token) : null;
  }

  /** Roles granted to this app's client in the access token; empty when there are none. */
  getRoles(): string[] {
    const access = this.getPayloadToken()?.['resource_access'] as
      | Record<string, { roles?: string[] }>
      | undefined;
    return access?.[environment.auth.authConfig.clientId]?.roles ?? [];
  }

  private endSession(): void {
    this.authenticated.set(false);
    this.name.set('');
    this.oauth.revokeTokenAndLogout();
  }

  private refreshState(): void {
    const valid = this.oauth.hasValidAccessToken();
    this.authenticated.set(valid);
    const claims = this.oauth.getIdentityClaims();
    this.name.set(valid ? (claims?.['name'] ?? claims?.['preferred_username'] ?? '') : '');
  }
}
