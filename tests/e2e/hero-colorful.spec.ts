import { expect, test } from '@playwright/test';

const preparePage = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'light');
    localStorage.setItem('ivuru-locale', 'ja');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

test('blue media hero uses the brand signal visual and keeps primary actions clear', async ({
  page,
}) => {
  await preparePage(page);
  await page.goto('/');

  const hero = page.locator('[data-anime-hero]');
  await expect(hero).toBeVisible();
  await expect(hero).toHaveClass(/blue-media-hero/);
  await expect(hero.locator('.blue-media-character img')).toHaveCount(0);
  await expect(hero.locator('.signal-key-visual')).toBeVisible();
  await expect(hero.locator('.signal-key-mark')).toContainText('IV');
  await expect(hero.locator('.signal-key-readout')).toBeVisible();
  await expect(hero.locator('.hero-spark-field')).toHaveCount(0);
  await expect(hero.locator('.hero-petal-field')).toHaveCount(0);
  await expect(hero.getByRole('link', { name: /Works|制作|작업/i }).first()).toBeVisible();
  await expect(
    hero.getByRole('link', { name: /Profile|プロフィール|프로필/i }).first(),
  ).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-anime-scene', 'ice');
});

test('reduced motion keeps the signal artwork available without autoplay media', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await preparePage(page);
  await page.goto('/');

  await expect(page.locator('[data-anime-hero]')).toBeVisible();
  await expect(page.locator('.signal-key-visual')).toBeVisible();
  await expect(page.locator('[data-hero-video]')).toHaveCount(0);
  await expect(page.locator('.hero-petal-field')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'reduced');
});

test('localized routes share the blue and white signal composition', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'dark');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });

  for (const route of ['/en', '/ko']) {
    await page.goto(route);
    await expect(page.locator('[data-anime-hero]')).toBeVisible();
    await expect(page.locator('.signal-key-visual')).toBeVisible();
    await expect(page.locator('.signal-key-mark')).toContainText('IV');
  }
});
