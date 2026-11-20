import { expect, test } from '@playwright/test';

test('products CRUD: list, create, edit and delete', async ({ page }) => {
  const name = `E2E Tea ${Date.now()}`;
  const renamed = `${name} XL`;

  // List: seeded products come from the mock API.
  await page.goto('/products');
  await expect(page.getByTestId('products-table')).toBeVisible();
  await expect(page.getByTestId('product-row').first()).toBeVisible();

  // Create.
  await page.getByTestId('new-product').click();
  await page.getByTestId('product-name').fill(name);
  await page.getByTestId('product-price').fill('3.5');
  await page.getByTestId('product-stock').fill('10');
  await page.getByTestId('product-save').click();
  await expect(page).toHaveURL(/\/products$/);
  const row = page.getByRole('row', { name: new RegExp(name) });
  await expect(row).toBeVisible();

  // Edit.
  await row.getByRole('link', { name: /^Edit/ }).click();
  await expect(page.getByTestId('product-name')).toHaveValue(name);
  await page.getByTestId('product-name').fill(renamed);
  await page.getByTestId('product-save').click();
  await expect(page.getByRole('row', { name: new RegExp(renamed) })).toBeVisible();

  // Delete: cancelling keeps the product, confirming removes it.
  const renamedRow = page.getByRole('row', { name: new RegExp(renamed) });
  await renamedRow.getByRole('button', { name: /^Delete/ }).click();
  await page.getByTestId('confirm-cancel').click();
  await expect(renamedRow).toBeVisible();

  await renamedRow.getByRole('button', { name: /^Delete/ }).click();
  await page.getByTestId('confirm-accept').click();
  await expect(renamedRow).toHaveCount(0);
});

test('product form shows a validation message and does not save an empty name', async ({
  page,
}) => {
  await page.goto('/products/new');
  await page.getByTestId('product-save').click();

  await expect(page.getByText('Enter a name')).toBeVisible();
  await expect(page).toHaveURL(/\/products\/new$/);
});

test('the signed-in user name and the layout are shown', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('user-name')).toHaveText('Demo User');
  await expect(page.getByTestId('header')).toBeVisible();
  await expect(page.getByTestId('footer')).toBeVisible();
});
