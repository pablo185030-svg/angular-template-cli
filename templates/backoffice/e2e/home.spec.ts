import { expect, test } from '@playwright/test';

test('home page navigates to the about page inside the layout', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('home-page')).toBeVisible();
  await expect(page.getByTestId('home-ui-kit-link')).toHaveAttribute(
    'href',
    'https://bitbucket.org/cotorepo/coto-ui-kit/src/develop/',
  );

  await page.getByTestId('nav-about').click();

  await expect(page).toHaveURL(/\/acerca-de$/);
  await expect(page.getByTestId('about-page')).toBeVisible();
  await expect(page.getByTestId('header')).toBeVisible();
  await expect(page.getByTestId('footer')).toBeVisible();
});

test('unknown route shows the not-found page inside the layout', async ({ page }) => {
  await page.goto('/does-not-exist');

  await expect(page.getByTestId('not-found-page')).toBeVisible();
  await expect(page.getByTestId('header')).toBeVisible();
});
