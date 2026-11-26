import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { encodeToken } from './decode-token';
import { MockAuthService } from './mock-auth.service';

const claims = {
  sub: '1',
  name: 'Ana Demo',
  role: 'escritura',
  permissions: ['read' as const, 'write' as const],
  exp: 4_000_000_000,
};
const apiToken = encodeToken(claims);

describe('MockAuthService', () => {
  const originalMode = environment.api.mode;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    environment.api.mode = 'http';
    navigate = vi.fn(() => Promise.resolve(true));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [MockAuthService, { provide: Router, useValue: { navigate } }],
    });
  });

  afterEach(() => {
    environment.api.mode = originalMode;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const create = () => TestBed.inject(MockAuthService);

  function stubFetch(...responses: (Response | Error)[]) {
    const fetchSpy = vi.fn(() => {
      const response = responses.length > 1 ? responses.shift()! : responses[0];
      return response instanceof Error ? Promise.reject(response) : Promise.resolve(response);
    });
    vi.stubGlobal('fetch', fetchSpy);
    return fetchSpy;
  }

  it('starts in demo mode with nobody signed in', () => {
    const service = create();

    expect(service.isDemo).toBe(true);
    expect(service.hasLoginPage).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getAccessToken()).toBeNull();
    expect(service.permissions()).toEqual([]);
  });

  it('sends the user to the login page keeping the requested route', () => {
    create().login('/productos');

    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/productos' } });
  });

  it('signs in with the token and claims from the mock API', async () => {
    const fetchSpy = stubFetch(Response.json({ access_token: apiToken }));
    const service = create();

    const result = await service.signIn('escritura', '1234');

    expect(result).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      `${environment.apiBaseUrl}/auth/login`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'escritura', password: '1234' }),
      }),
    );
    expect(service.isAuthenticated()).toBe(true);
    expect(service.userName()).toBe('Ana Demo');
    expect(service.getAccessToken()).toBe(apiToken);
    expect(service.hasPermission('write')).toBe(true);
    expect(service.hasPermission('manage-roles')).toBe(false);
  });

  it('stays signed out on wrong credentials', async () => {
    stubFetch(new Response('{}', { status: 401 }));
    const service = create();

    const result = await service.signIn('admin', 'nope');

    expect(result).toEqual({ ok: false, message: 'Usuario o contraseña incorrectos.' });
    expect(service.isAuthenticated()).toBe(false);
  });

  it.each([
    ['a network error', new Error('offline')],
    ['a server error', new Response('x', { status: 500 })],
    ['a body without a token', Response.json({})],
    ['an invalid token', Response.json({ access_token: 'garbage' })],
  ])('reports a failure on %s', async (_name, response) => {
    stubFetch(response);
    const service = create();

    const result = await service.signIn('admin', '1234');

    expect(result.ok).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
  });

  describe('with the JSON data source', () => {
    const users = [
      {
        id: 1,
        username: 'admin',
        password: '1234',
        firstName: 'Admin',
        lastName: 'Coto',
        roleId: 1,
      },
    ];
    const roles = [{ id: 1, name: 'admin', permissions: ['read', 'write', 'manage-roles'] }];

    beforeEach(() => {
      environment.api.mode = 'json';
    });

    it('checks the seeded users in the browser without calling the API', async () => {
      const fetchSpy = stubFetch(Response.json(users), Response.json(roles));
      const service = create();

      const result = await service.signIn('admin', '1234');

      expect(result).toEqual({ ok: true });
      expect(fetchSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.anything(),
      );
      expect(service.userName()).toBe('Admin Coto');
      expect(service.permissions()).toEqual(['read', 'write', 'manage-roles']);
    });

    it('rejects wrong credentials', async () => {
      stubFetch(Response.json(users), Response.json(roles));
      const service = create();

      expect(await service.signIn('admin', 'x')).toEqual({
        ok: false,
        message: 'Usuario o contraseña incorrectos.',
      });
    });
  });

  it('discards the session on logout and goes back to the login page', async () => {
    stubFetch(Response.json({ access_token: apiToken }));
    const service = create();
    await service.signIn('escritura', '1234');

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.getAccessToken()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
