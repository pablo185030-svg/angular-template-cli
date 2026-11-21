import { expect, test } from '@playwright/test';

// The toggle exists only when `theme.darkMode` is true in the environment (see
// `npm run configure:theme`); otherwise the app must stay light.
test('theme: the toggle switches themes when enabled, and the app stays light otherwise', async ({
  page,
}) => {
  await page.goto('/');
  const html = page.locator('html');
  const toggle = page.getByTestId('theme-toggle');

  if ((await toggle.count()) === 0) {
    await expect(html).not.toHaveClass(/coto-dark-theme/);
    return;
  }

  await expect(html).not.toHaveClass(/coto-dark-theme/);
  await toggle.click();
  await expect(html).toHaveClass(/coto-dark-theme/);

  await page.reload();
  await expect(html).toHaveClass(/coto-dark-theme/);

  await page.getByTestId('theme-toggle').click();
  await expect(html).not.toHaveClass(/coto-dark-theme/);
});
