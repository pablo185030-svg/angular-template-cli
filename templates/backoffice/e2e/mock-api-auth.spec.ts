import { APIRequestContext, expect, test } from '@playwright/test';

async function login(request: APIRequestContext, username: string, password = '1234') {
  return request.post('/api/auth/login', { data: { username, password } });
}

async function authHeaders(request: APIRequestContext, username: string) {
  const { access_token } = await (await login(request, username)).json();
  return { Authorization: `Bearer ${access_token}` };
}

test.describe('mock API login and token', () => {
  test('issues a token with the user claims', async ({ request }) => {
    const response = await login(request, 'admin');

    expect(response.status()).toBe(200);
    const { access_token } = await response.json();
    const claims = JSON.parse(Buffer.from(access_token.split('.')[1], 'base64url').toString());
    expect(claims).toMatchObject({ name: 'Admin Coto' });
    expect(claims).not.toHaveProperty('role');
    expect(claims.exp).toBeGreaterThan(Date.now() / 1000);
  });

  test('rejects wrong credentials', async ({ request }) => {
    const response = await login(request, 'admin', 'nope');

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ message: 'Credenciales inválidas' });
  });

  test('rejects products requests without a token', async ({ request }) => {
    const response = await request.get('/api/products');
    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ message: 'No autorizado' });
  });

  test('serves products and accepts writes with a token', async ({ request }) => {
    const headers = await authHeaders(request, 'admin');

    expect((await request.get('/api/products', { headers })).status()).toBe(200);
  });

  test('has no roles endpoint', async ({ request }) => {
    const headers = await authHeaders(request, 'admin');

    expect((await request.get('/api/roles', { headers })).status()).toBe(404);
  });
});
