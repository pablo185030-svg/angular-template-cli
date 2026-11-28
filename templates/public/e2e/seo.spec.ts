import { existsSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test('each page sets its own title, description and canonical link', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/^Inicio \| /);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/$/);

  await page.getByTestId('nav-about').click();
  await expect(page).toHaveTitle(/^Acerca de \| /);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/acerca-de$/);
});

test('structured data belongs to the home page only', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);

  await page.getByTestId('nav-about').click();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
});

test('an unknown path is answered with HTTP 404 and is not indexable', async ({
  request,
  page,
}) => {
  // Only a server can set the status: SSG and SPA hosts answer unknown paths with the app shell.
  test.skip(!existsSync('src/server.ts'), 'the HTTP status needs server-side rendering');

  const response = await request.get('/does-not-exist');
  expect(response.status()).toBe(404);
  expect(await response.text()).toContain('data-testid="not-found-page"');

  await page.goto('/does-not-exist');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

for (const file of ['robots.txt', 'sitemap.xml', 'llms.txt']) {
  test(`/${file} is served`, async ({ request }) => {
    const response = await request.get(`/${file}`);

    expect(response.status()).toBe(200);
    expect((await response.text()).length).toBeGreaterThan(0);
  });
}

test('responses carry the baseline security headers and pages are not cached', async ({
  request,
}) => {
  test.skip(!existsSync('src/server.ts'), 'the headers are set by the Node server');

  const response = await request.get('/');

  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(response.headers()['x-frame-options']).toBe('SAMEORIGIN');
  expect(response.headers()['cache-control']).toBe('no-cache');
});
