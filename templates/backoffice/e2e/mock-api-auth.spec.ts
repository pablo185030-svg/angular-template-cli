import { APIRequestContext, expect, test } from '@playwright/test';

async function login(request: APIRequestContext, username: string, password = '1234') {
  return request.post('/api/auth/login', { data: { username, password } });
}

async function authHeaders(request: APIRequestContext, username: string) {
  const { access_token } = await (await login(request, username)).json();
  return { Authorization: `Bearer ${access_token}` };
}

test.describe('mock API login and permissions', () => {
  test('issues a token with the user claims', async ({ request }) => {
    const response = await login(request, 'admin');

    expect(response.status()).toBe(200);
    const { access_token } = await response.json();
    const claims = JSON.parse(Buffer.from(access_token.split('.')[1], 'base64url').toString());
    expect(claims).toMatchObject({
      role: 'admin',
      permissions: ['read', 'write', 'manage-roles'],
    });
    expect(claims.exp).toBeGreaterThan(Date.now() / 1000);
  });

  test('rejects wrong credentials', async ({ request }) => {
    const response = await login(request, 'admin', 'nope');

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ message: 'Credenciales inválidas' });
  });

  test('rejects products and roles requests without a token', async ({ request }) => {
    for (const url of ['/api/products', '/api/roles']) {
      const response = await request.get(url);
      expect(response.status()).toBe(401);
      expect(await response.json()).toEqual({ message: 'No autorizado' });
    }
  });

  test('serves products to a read-only user but not writes', async ({ request }) => {
    const headers = await authHeaders(request, 'lectura');

    expect((await request.get('/api/products', { headers })).status()).toBe(200);
    const create = await request.post('/api/products', {
      headers,
      data: { name: 'x', price: 1, stock: 1 },
    });
    expect(create.status()).toBe(403);
  });

  test('forbids the roles API without manage-roles', async ({ request }) => {
    const headers = await authHeaders(request, 'escritura');

    expect((await request.get('/api/roles', { headers })).status()).toBe(403);
  });

  test('roles API rules: duplicates, protected admin and roles in use', async ({ request }) => {
    const headers = await authHeaders(request, 'admin');
    const name = `api-${Date.now()}`;

    const roles = await (await request.get('/api/roles', { headers })).json();
    const byName = (n: string) => roles.find((role: { name: string }) => role.name === n);

    const created = await request.post('/api/roles', {
      headers,
      data: { name, description: 'tmp', permissions: ['read'] },
    });
    expect(created.status()).toBe(201);
    const { id } = await created.json();

    const duplicate = await request.post('/api/roles', {
      headers,
      data: { name, description: '', permissions: ['read'] },
    });
    expect(duplicate.status()).toBe(409);

    expect((await request.delete(`/api/roles/${byName('admin').id}`, { headers })).status()).toBe(
      409,
    );
    expect((await request.delete(`/api/roles/${byName('lectura').id}`, { headers })).status()).toBe(
      409,
    );
    expect((await request.delete(`/api/roles/${id}`, { headers })).status()).toBe(204);
  });
});
