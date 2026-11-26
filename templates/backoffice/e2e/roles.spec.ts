import { expect, test } from '@playwright/test';
import { signIn } from './support/auth';

test('roles ABM: list, create, edit and delete', async ({ page }) => {
  const name = `e2e-rol-${Date.now()}`;
  const renamed = `${name}-v2`;

  await signIn(page, '/roles');
  await expect(page.getByTestId('roles-table')).toBeVisible();
  for (const role of ['admin', 'escritura', 'lectura']) {
    await expect(page.getByRole('row', { name: new RegExp(`^${role}\\b`) })).toBeVisible();
  }

  // Create, with a duplicate name refused first.
  await page.getByTestId('new-role').click();
  await page.getByTestId('role-name').fill('lectura');
  await page.getByTestId('role-save').click();
  await expect(page.getByTestId('role-error')).toHaveText('Ya existe un rol con ese nombre');

  await page.getByTestId('role-name').fill(name);
  await page.getByTestId('role-description').fill('Rol de prueba');
  await page.getByTestId('role-permission-write').locator('input').check();
  await page.getByTestId('role-save').click();
  await expect(page).toHaveURL(/\/roles$/);
  const row = page.getByRole('row', { name: new RegExp(name) });
  await expect(row).toBeVisible();
  await expect(row).toContainText('Crear, editar y eliminar');

  // Edit.
  await row.getByRole('link', { name: /^Editar/ }).click();
  await expect(page.getByTestId('role-name')).toHaveValue(name);
  await page.getByTestId('role-name').fill(renamed);
  await page.getByTestId('role-save').click();
  const renamedRow = page.getByRole('row', { name: new RegExp(renamed) });
  await expect(renamedRow).toBeVisible();

  // Delete: cancel keeps it, confirm removes it.
  await renamedRow.getByRole('button', { name: /^Eliminar/ }).click();
  await page.getByTestId('confirm-cancel').click();
  await expect(renamedRow).toBeVisible();
  await renamedRow.getByRole('button', { name: /^Eliminar/ }).click();
  await page.getByTestId('confirm-accept').click();
  await expect(renamedRow).toHaveCount(0);
});

test('the admin role and roles in use cannot be deleted, and admin is read-only', async ({
  page,
}) => {
  await signIn(page, '/roles');
  const adminRow = page.getByRole('row', { name: /^admin\b/ });
  await expect(adminRow.getByRole('button', { name: /^Eliminar/ })).toHaveCount(0);
  await expect(
    page.getByRole('row', { name: /^lectura\b/ }).getByRole('button', { name: /^Eliminar/ }),
  ).toHaveCount(0);

  await adminRow.getByRole('link', { name: /^Ver/ }).click();
  await expect(page.getByTestId('role-protected')).toBeVisible();
  await expect(page.getByTestId('role-save')).toHaveCount(0);
  await expect(page.getByTestId('role-name')).toHaveJSProperty('readOnly', true);
});

test('a user without manage-roles has no roles link and is sent home from /roles', async ({
  page,
}) => {
  await signIn(page, '/', 'escritura');
  await expect(page.getByTestId('nav-roles')).toHaveCount(0);

  await signIn(page, '/roles', 'escritura');
  await expect(page).toHaveURL(/localhost:4200\/$/);
  await expect(page.getByTestId('home-page')).toBeVisible();
});

test('a user with write sees the product actions', async ({ page }) => {
  await signIn(page, '/productos', 'escritura');
  await expect(page.getByTestId('new-product')).toBeVisible();
});
