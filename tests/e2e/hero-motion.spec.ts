import { expect, test } from '@playwright/test';

const prepareHome = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'dark');
    localStorage.setItem('ivuru-locale', 'ja');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

test.describe('cinematic motion', () => {
  test('renders the cinematic layers without blocking hero actions', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    await expect(page.locator('[data-cinematic-intro]')).toHaveCount(1);
    await expect(page.locator('[data-hero-depth="orbit"]')).toBeVisible();
    await expect(page.locator('[data-hero-depth="grain"]')).toBeVisible();

    const works = page.locator('.hero-actions .primary-button');
    await expect(works).toBeVisible();
    await expect(works).toHaveCSS('pointer-events', 'auto');

    await expect(page.locator('[data-cinematic-intro]')).toBeHidden({ timeout: 5_000 });
  });

  test('keeps a static accessible hero for reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await prepareHome(page);
    await page.goto('/');

    await expect(page.locator('[data-cinematic-intro]')).toBeHidden();
    await expect(page.locator('[data-hero-depth="orbit"]')).toBeVisible();
    await expect(page.locator('.hero-actions .primary-button')).toBeVisible();
  });

  test('provides localized title cards', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      localStorage.setItem('ivuru-theme', 'dark');
      sessionStorage.setItem('ivuru-intro-seen', '1');
    });
    await page.goto('/en');
    await expect(page.locator('.hero-cinematic-title-card')).toContainText(
      'Two worlds become one.',
    );
  });
});
