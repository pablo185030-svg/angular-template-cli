import { expect, test } from '@playwright/test';
import { signIn } from './support/auth';

test('products CRUD: list, create, edit and delete', async ({ page }) => {
  const name = `E2E Galletitas ${Date.now()}`;
  const renamed = `${name} XL`;

  // List: seeded products come from the mock API.
  await signIn(page, '/productos');
  await expect(page.getByTestId('products-table')).toBeVisible();
  await expect(page.getByTestId('product-row').first()).toBeVisible();

  // Create.
  await page.getByTestId('new-product').click();
  await page.getByTestId('product-name').fill(name);
  await page.getByTestId('product-price').fill('3.5');
  await page.getByTestId('product-stock').fill('10');
  await page.getByTestId('product-save').click();
  await expect(page).toHaveURL(/\/productos$/);
  const row = page.getByRole('row', { name: new RegExp(name) });
  await expect(row).toBeVisible();

  // Edit.
  await row.getByRole('link', { name: /^Editar/ }).click();
  await expect(page.getByTestId('product-name')).toHaveValue(name);
  await page.getByTestId('product-name').fill(renamed);
  await page.getByTestId('product-save').click();
  await expect(page.getByRole('row', { name: new RegExp(renamed) })).toBeVisible();

  // Delete: cancelling keeps the product, confirming removes it.
  const renamedRow = page.getByRole('row', { name: new RegExp(renamed) });
  await renamedRow.getByRole('button', { name: /^Eliminar/ }).click();
  await page.getByTestId('confirm-cancel').click();
  await expect(renamedRow).toBeVisible();

  await renamedRow.getByRole('button', { name: /^Eliminar/ }).click();
  await page.getByTestId('confirm-accept').click();
  await expect(renamedRow).toHaveCount(0);
});

test('product form shows a validation message and does not save an empty name', async ({
  page,
}) => {
  await signIn(page, '/productos/nuevo');
  await page.getByTestId('product-save').click();

  await expect(page.getByText('Ingresá un nombre')).toBeVisible();
  await expect(page).toHaveURL(/\/productos\/nuevo$/);
});

test('the signed-in user name and the layout are shown', async ({ page }) => {
  await signIn(page, '/');

  await expect(page.getByTestId('user-name')).toHaveText('Admin Coto');
  await expect(page.getByTestId('demo-badge')).toBeVisible();
  await expect(page.getByTestId('header')).toBeVisible();
  await expect(page.getByTestId('footer')).toBeVisible();
});
