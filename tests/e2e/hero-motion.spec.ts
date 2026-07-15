import { expect, test } from '@playwright/test';

const prepareHome = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'dark');
    localStorage.setItem('ivuru-locale', 'ja');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

test.describe('restrained home motion', () => {
  test('keeps the local movie without decorative cinematic layers', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const hero = page.locator('[data-editorial-hero]');
    await expect(hero).toBeVisible();
    await expect(page.locator('[data-cinematic-intro]')).toHaveCount(0);
    await expect(page.locator('[data-hero-depth="orbit"]')).toHaveCount(0);
    await expect(page.locator('[data-hero-depth="grain"]')).toHaveCount(0);

    const works = hero.getByRole('link', { name: /Works|制作|작업/i }).first();
    await expect(works).toBeVisible();
    await expect(works).toHaveCSS('pointer-events', 'auto');
  });

  test('keeps a static accessible hero for reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await prepareHome(page);
    await page.goto('/');

    await expect(page.locator('[data-editorial-hero]')).toBeVisible();
    await expect(page.locator('[data-hero-video]')).toHaveCount(0);
    await expect(page.locator('.home-editorial-sketch')).toBeVisible();
    await expect(
      page.locator('[data-editorial-hero]').getByRole('link', { name: /Works|制作|작업/i }).first(),
    ).toBeVisible();
  });

  test('provides the same restrained composition in every locale', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      localStorage.setItem('ivuru-theme', 'dark');
      sessionStorage.setItem('ivuru-intro-seen', '1');
    });

    for (const route of ['/', '/en', '/ko']) {
      await page.goto(route);
      await expect(page.locator('[data-editorial-hero]')).toBeVisible();
      await expect(page.locator('.home-editorial-sketch img')).toBeVisible();
    }
  });
});
