import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

// The sitemap is tied to the route table by a unit test, so scanning its URLs covers every page.
// The not-found page is not in the sitemap and is scanned too.
const sitemap = readFileSync('public/sitemap.xml', 'utf8');
const PATHS = [
  ...[...sitemap.matchAll(/<loc>https?:\/\/[^/<]+(\/[^<]*)<\/loc>/g)].map((match) => match[1]),
  '/ruta-inexistente',
];

const VIEWPORTS = [
  { name: 'mobile', width: 320, height: 640 },
  { name: 'desktop', width: 1280, height: 800 },
];

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

for (const viewport of VIEWPORTS) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const path of PATHS) {
      test(`${path} has no WCAG 2.2 AA violations`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator('h1')).toHaveCount(1);

        await expectNoViolations(page);
      });
    }
  });
}

test.describe('mobile drawer', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('has no WCAG 2.2 AA violations while open', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('menu-toggle').click();
    await expect(page.getByTestId('drawer')).toBeVisible();

    await expectNoViolations(page);
  });
});

test('the first Tab stop is the skip link, and it moves the focus to the main content', async ({
  page,
}) => {
  await page.goto('/');
  const skipLink = page.getByTestId('skip-link');
  await expect(skipLink).toBeAttached();

  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();

  await page.keyboard.press('Enter');
  await expect(page.locator('main#main-content')).toBeFocused();
  // Before hydration the native link only adds the fragment: the page itself never changes.
  await expect(page).toHaveURL(/\/(#main-content)?$/);
});
