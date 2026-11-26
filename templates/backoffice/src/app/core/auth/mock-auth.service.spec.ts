import { environment } from '@env/environment';
import { MockAuthService } from './mock-auth.service';

function encode(value: unknown): string {
  return btoa(JSON.stringify(value)).replace(/=+$/, '');
}

const claims = { sub: 'demo-user', name: 'Ana Demo', roles: ['admin'], exp: 4_000_000_000 };
const apiToken = `${encode({ alg: 'none' })}.${encode(claims)}.`;

describe('MockAuthService', () => {
  const originalMode = environment.api.mode;

  beforeEach(() => {
    environment.api.mode = 'http';
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    environment.api.mode = originalMode;
    vi.restoreAllMocks();
  });

  function stubFetch(response: Response | Error) {
    const fetchSpy = vi.fn(() =>
      response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
    );
    vi.stubGlobal('fetch', fetchSpy);
    return fetchSpy;
  }

  it('runs in demo mode with a signed-in demo user and a local token before init', () => {
    const service = new MockAuthService();

    expect(service.isDemo).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.userName()).toBe('Usuario demo');
    expect(service.getAccessToken()).toBe('mock-token');
  });

  it('keeps the demo user signed in after logout, since there is no session to end', () => {
    const service = new MockAuthService();

    service.logout();

    expect(service.isAuthenticated()).toBe(true);
  });

  it('takes the token and the user name from the mock API', async () => {
    const fetchSpy = stubFetch(Response.json({ access_token: apiToken }));
    const service = new MockAuthService();

    await service.init();

    expect(fetchSpy).toHaveBeenCalledWith(
      `${environment.apiBaseUrl}/auth/token`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(service.getAccessToken()).toBe(apiToken);
    expect(service.userName()).toBe('Ana Demo');
  });

  it('does not ask the mock API when the products data source is JSON', async () => {
    environment.api.mode = 'json';
    const fetchSpy = stubFetch(Response.json({ access_token: apiToken }));
    const service = new MockAuthService();

    await service.init();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(service.getAccessToken()).toBe('mock-token');
  });

  it.each([
    ['a network error', new Error('offline')],
    ['a non-2xx response', new Response('nope', { status: 500 })],
    ['an invalid body', new Response('<html></html>')],
    ['a body without a valid token', Response.json({ access_token: 'garbage' })],
  ])('falls back to the local fake token on %s', async (_name, response) => {
    stubFetch(response);
    const service = new MockAuthService();

    await service.init();

    expect(service.getAccessToken()).toBe('mock-token');
    expect(service.userName()).toBe('Usuario demo');
    expect(service.isAuthenticated()).toBe(true);
    expect(console.warn).toHaveBeenCalled();
  });
});
