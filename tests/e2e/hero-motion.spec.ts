import { expect, test } from '@playwright/test';

const prepareHome = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'dark');
    localStorage.setItem('ivuru-locale', 'ja');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

test.describe('anime scroll motion', () => {
  test('reveals the anime hero without the retired cinematic layers', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const hero = page.locator('[data-anime-hero]');
    await expect(hero).toBeVisible();
    await expect(page.locator('[data-cinematic-intro]')).toHaveCount(0);
    await expect(page.locator('[data-hero-depth="orbit"]')).toHaveCount(0);
    await expect(page.locator('[data-hero-depth="grain"]')).toHaveCount(0);
    await expect(page.locator('[data-hero-video]')).toHaveCount(0);

    const works = hero.getByRole('link', { name: /Works|制作|작업/i }).first();
    await expect(works).toBeVisible();
    await expect(works).toHaveCSS('pointer-events', 'auto');
    await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'true');
  });

  test('keeps every scene visible for reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await prepareHome(page);
    await page.goto('/');

    await expect(page.locator('[data-anime-hero]')).toBeVisible();
    await expect(page.locator('[data-hero-video]')).toHaveCount(0);
    await expect(page.locator('.home-anime-character')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'reduced');
    await expect(
      page
        .locator('[data-anime-hero]')
        .getByRole('link', { name: /Works|制作|작업/i })
        .first(),
    ).toBeVisible();
  });

  test('changes the ambient scene while scrolling through portal cards', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const portal = page.locator('.anime-portal-section');
    await portal.scrollIntoViewIfNeeded();
    await expect(portal).toBeVisible();
    await expect(portal.locator('.anime-portal-card')).toHaveCount(3);
    await expect(page.locator('body')).toHaveAttribute('data-anime-scene', 'blue');
  });

  test('provides the same anime motion structure in every locale', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      localStorage.setItem('ivuru-theme', 'dark');
      sessionStorage.setItem('ivuru-intro-seen', '1');
    });

    for (const route of ['/', '/en', '/ko']) {
      await page.goto(route);
      await expect(page.locator('[data-anime-hero]')).toBeVisible();
      await expect(page.locator('.home-anime-character img')).toBeVisible();
      await expect(page.locator('.anime-portal-card')).toHaveCount(3);
    }
  });
});
