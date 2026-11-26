import { Page, expect } from '@playwright/test';

/** Seeded users (see `public/mock/users.json`); all share the password `1234`. */
export type SeededUser = 'admin' | 'escritura' | 'lectura';

/**
 * Signs in through the login form and lands on `path`. The session lives in memory only, so a
 * full page load (`page.goto`, `page.reload`) signs the user out: go through this helper, then
 * navigate with in-app links.
 * @param {Page} page - Playwright page.
 * @param {string} [path] - Route to land on after the login.
 * @param {SeededUser} [username] - Seeded user to sign in as.
 */
export async function signIn(page: Page, path = '/', username: SeededUser = 'admin') {
  await page.goto(`/login?returnUrl=${encodeURIComponent(path)}`);
  await page.getByTestId('login-username').fill(username);
  await page.getByTestId('login-password').fill('1234');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('login-page')).toHaveCount(0);
}
