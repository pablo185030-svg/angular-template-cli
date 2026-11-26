import { expect, test } from '@playwright/test';
import { signIn } from './support/auth';

const noHorizontalScroll = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test.describe('mobile', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('moves the navigation and the user area into the drawer', async ({ page }) => {
    await signIn(page, '/');

    await expect(page.getByTestId('menu-toggle')).toBeVisible();
    await expect(page.getByTestId('nav-products')).toBeHidden();
    await expect(page.getByTestId('user-name')).toBeHidden();

    await page.getByTestId('menu-toggle').click();

    await expect(page.getByTestId('drawer-nav-products')).toBeVisible();
    await expect(page.getByTestId('drawer-user-name')).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('navigates from the drawer and closes it', async ({ page }) => {
    await signIn(page, '/');

    await page.getByTestId('menu-toggle').click();
    await page.getByTestId('drawer-nav-products').click();

    await expect(page).toHaveURL(/\/productos$/);
    await expect(page.getByTestId('drawer')).toBeHidden();
  });

  test('page content stays clickable while the drawer is closed', async ({ page }) => {
    await signIn(page, '/productos');

    await page.getByTestId('new-product').click();

    await expect(page).toHaveURL(/\/productos\/nuevo$/);
  });

  test('edit and delete work from the product cards', async ({ page }) => {
    await signIn(page, '/productos');
    const firstCard = page.getByTestId('product-row').first();

    await firstCard.getByRole('button', { name: /^Eliminar/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    await firstCard.getByRole('link', { name: /^Editar/ }).click();
    await expect(page).toHaveURL(/\/productos\/.+\/editar$/);
  });

  test('shows the products as cards without horizontal scroll', async ({ page }) => {
    await signIn(page, '/productos');
    await expect(page.getByTestId('products-table')).toBeVisible();

    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('login screen fits the viewport', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-form')).toBeVisible();

    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('roles list and form fit the viewport', async ({ page }) => {
    await signIn(page, '/roles');
    await expect(page.getByTestId('roles-table')).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);

    await page.getByTestId('new-role').click();
    await expect(page.getByTestId('role-form')).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('product form fits the viewport', async ({ page }) => {
    await signIn(page, '/productos/nuevo');
    await expect(page.getByTestId('product-form')).toBeVisible();

    expect(await noHorizontalScroll(page)).toBe(true);
  });
});

test.describe('desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('shows the inline navigation and user area without hamburger', async ({ page }) => {
    await signIn(page, '/');

    await expect(page.getByTestId('nav-products')).toBeVisible();
    await expect(page.getByTestId('user-name')).toBeVisible();
    await expect(page.getByTestId('menu-toggle')).toBeHidden();
  });
});
