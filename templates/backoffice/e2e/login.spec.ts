import { expect, test } from '@playwright/test';
import { signIn } from './support/auth';

test('an unauthenticated visit goes to the login screen without the layout', async ({ page }) => {
  await page.goto('/productos');

  await expect(page).toHaveURL(/\/login\?returnUrl=%2Fproductos$/);
  await expect(page.getByTestId('login-page')).toBeVisible();
  await expect(page.getByTestId('header')).toHaveCount(0);
});

test('empty fields show validation messages', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-submit').click();

  await expect(page.getByText('Ingresá tu usuario')).toBeVisible();
  await expect(page.getByText('Ingresá tu contraseña')).toBeVisible();
});

test('wrong credentials show an error and keep the user signed out', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-username').fill('admin');
  await page.getByTestId('login-password').fill('wrong');
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('login-error')).toHaveText('Usuario o contraseña incorrectos.');
  await expect(page).toHaveURL(/\/login$/);
});

test('login returns to the requested route, logout and reload return to the login', async ({
  page,
}) => {
  await signIn(page, '/productos');
  await expect(page).toHaveURL(/\/productos$/);
  await expect(page.getByTestId('user-name')).toHaveText('Admin Coto');
  await expect(page.getByTestId('demo-badge')).toBeVisible();

  await page.getByTestId('logout').click();
  await expect(page).toHaveURL(/\/login$/);

  await signIn(page);
  await page.reload();
  await expect(page).toHaveURL(/\/login/);
});

test('a signed-in user opening /login goes to the home page', async ({ page }) => {
  await signIn(page);

  await page.getByTestId('nav-products').click();
  // In-app navigation keeps the session; /login redirects away.
  await page.evaluate(() => {
    history.pushState({}, '', '/login');
    dispatchEvent(new PopStateEvent('popstate'));
  });

  await expect(page).toHaveURL(/localhost:4200\/$/);
});

test('a signed-in user sees products with the write actions', async ({ page }) => {
  await signIn(page, '/productos');

  await expect(page.getByTestId('products-table')).toBeVisible();
  await expect(page.getByTestId('new-product')).toBeVisible();
  await expect(page.getByTestId('nav-roles')).toHaveCount(0);
});
