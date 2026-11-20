import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { OAuthService } from 'angular-oauth2-oidc';
import { environment } from '@env/environment';
import { KeycloakAuthService } from './keycloak-auth.service';

class FakeOAuthService {
  config: Record<string, unknown> | undefined;
  state: string | undefined;
  validToken = false;
  claims: Record<string, string> = {};
  readonly codeFlowStates: string[] = [];
  logOutCalls = 0;
  silentRefreshCalls = 0;

  configure(config: Record<string, unknown>): void {
    this.config = config;
  }
  async loadDiscoveryDocumentAndTryLogin(): Promise<boolean> {
    return this.validToken;
  }
  setupAutomaticSilentRefresh(): void {
    this.silentRefreshCalls++;
  }
  hasValidAccessToken(): boolean {
    return this.validToken;
  }
  getIdentityClaims(): Record<string, string> {
    return this.claims;
  }
  getAccessToken(): string {
    return 'real-token';
  }
  initCodeFlow(state: string): void {
    this.codeFlowStates.push(state);
  }
  logOut(): void {
    this.logOutCalls++;
  }
}

describe('KeycloakAuthService', () => {
  function setup(oauth: FakeOAuthService) {
    const location = { replaceState: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        KeycloakAuthService,
        { provide: OAuthService, useValue: oauth },
        { provide: Location, useValue: location },
      ],
    });
    return { service: TestBed.inject(KeycloakAuthService), location };
  }

  it('configures the code flow from the environment Keycloak settings', async () => {
    const oauth = new FakeOAuthService();
    const { service } = setup(oauth);

    await service.init();

    const { url, realm, clientId } = environment.auth.keycloak;
    expect(oauth.config).toMatchObject({
      issuer: `${url}/realms/${realm}`,
      clientId,
      responseType: 'code',
    });
    expect(oauth.silentRefreshCalls).toBe(1);
  });

  it('is signed out when there is no valid token', async () => {
    const { service } = setup(new FakeOAuthService());

    await service.init();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.userName()).toBe('');
    expect(service.getAccessToken()).toBeNull();
  });

  it('exposes the user name and token when signed in', async () => {
    const oauth = new FakeOAuthService();
    oauth.validToken = true;
    oauth.claims = { name: 'Ana Pérez', preferred_username: 'ana' };
    const { service } = setup(oauth);

    await service.init();

    expect(service.isAuthenticated()).toBe(true);
    expect(service.userName()).toBe('Ana Pérez');
    expect(service.getAccessToken()).toBe('real-token');
  });

  it('falls back to preferred_username when the name claim is missing', async () => {
    const oauth = new FakeOAuthService();
    oauth.validToken = true;
    oauth.claims = { preferred_username: 'ana' };
    const { service } = setup(oauth);

    await service.init();

    expect(service.userName()).toBe('ana');
  });

  it('restores the originally requested route after the Keycloak redirect', async () => {
    const oauth = new FakeOAuthService();
    oauth.validToken = true;
    oauth.state = encodeURIComponent('/products/3/edit?tab=1');
    const { service, location } = setup(oauth);

    await service.init();

    expect(location.replaceState).toHaveBeenCalledWith('/products/3/edit?tab=1');
  });

  it('does not touch the URL when there is no saved route', async () => {
    const oauth = new FakeOAuthService();
    oauth.validToken = true;
    const { service, location } = setup(oauth);

    await service.init();

    expect(location.replaceState).not.toHaveBeenCalled();
  });

  it('starts the code flow remembering the target route', () => {
    const oauth = new FakeOAuthService();
    const { service } = setup(oauth);

    service.login('/products');

    expect(oauth.codeFlowStates).toEqual([encodeURIComponent('/products')]);
  });

  it('ends the session on logout', () => {
    const oauth = new FakeOAuthService();
    const { service } = setup(oauth);

    service.logout();

    expect(oauth.logOutCalls).toBe(1);
  });
});
