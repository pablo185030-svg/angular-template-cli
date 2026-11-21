import { expect, test } from '@playwright/test';

const noHorizontalScroll = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test.describe('mobile', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('shows the hamburger instead of the inline navigation', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('menu-toggle')).toBeVisible();
    await expect(page.getByTestId('nav-about')).toBeHidden();
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('page content stays clickable while the drawer is closed', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('home-ui-kit-link').click({ trial: true });
  });

  test('opens the drawer, navigates and closes it', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByTestId('menu-toggle');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('drawer')).toBeVisible();

    await page.getByTestId('drawer-nav-about').click();
    await expect(page).toHaveURL(/\/acerca-de$/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('drawer')).toBeHidden();
  });

  test('closes the drawer with Escape and keeps the page free of horizontal scroll', async ({
    page,
  }) => {
    await page.goto('/acerca-de');

    await page.getByTestId('menu-toggle').click();
    await expect(page.getByTestId('drawer')).toBeVisible();
    await page.keyboard.press('Escape');

    await expect(page.getByTestId('drawer')).toBeHidden();
    expect(await noHorizontalScroll(page)).toBe(true);
  });
});

test.describe('desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('shows the inline navigation and no hamburger', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('nav-about')).toBeVisible();
    await expect(page.getByTestId('menu-toggle')).toBeHidden();
  });
});
