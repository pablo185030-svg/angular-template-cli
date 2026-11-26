import { expect, test } from '@playwright/test';

test.describe('mock API token', () => {
  test('issues a token with the demo user claims', async ({ request }) => {
    const response = await request.post('/api/auth/token');

    expect(response.status()).toBe(200);
    const { access_token } = await response.json();
    const claims = JSON.parse(Buffer.from(access_token.split('.')[1], 'base64url').toString());
    expect(claims).toMatchObject({ name: 'Usuario demo', roles: expect.any(Array) });
    expect(claims.exp).toBeGreaterThan(Date.now() / 1000);
  });

  test('rejects products requests without a token', async ({ request }) => {
    const response = await request.get('/api/products');

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ message: 'No autorizado' });
  });

  test('serves products to requests with a token', async ({ request }) => {
    const { access_token } = await (await request.post('/api/auth/token')).json();

    const response = await request.get('/api/products', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(expect.any(Array));
  });
});
