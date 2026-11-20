import { Location } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';

/** Authenticates against Keycloak with the Authorization Code flow and PKCE. */
@Injectable()
export class KeycloakAuthService extends AuthService {
  private readonly oauth = inject(OAuthService);
  private readonly location = inject(Location);

  private readonly authenticated = signal(false);
  private readonly name = signal('');

  readonly isAuthenticated = this.authenticated.asReadonly();
  readonly userName = this.name.asReadonly();

  /** @inheritdoc */
  async init(): Promise<void> {
    const { url, realm, clientId } = environment.auth.keycloak;
    const config: AuthConfig = {
      issuer: `${url}/realms/${realm}`,
      clientId,
      redirectUri: window.location.origin,
      responseType: 'code',
      scope: 'openid profile',
      requireHttps: environment.production,
    };
    this.oauth.configure(config);

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
    this.oauth.logOut();
  }

  /** @inheritdoc */
  getAccessToken(): string | null {
    return this.authenticated() ? this.oauth.getAccessToken() : null;
  }

  private refreshState(): void {
    const valid = this.oauth.hasValidAccessToken();
    this.authenticated.set(valid);
    const claims = this.oauth.getIdentityClaims();
    this.name.set(valid ? (claims?.['name'] ?? claims?.['preferred_username'] ?? '') : '');
  }
}
