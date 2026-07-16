import { expect, test } from '@playwright/test';

const preparePage = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'light');
    localStorage.setItem('ivuru-locale', 'ja');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

test('anime home hero keeps the original character and primary actions clear', async ({ page }) => {
  await preparePage(page);
  await page.goto('/');

  const hero = page.locator('[data-anime-hero]');
  await expect(hero).toBeVisible();
  await expect(hero.locator('.home-anime-character img')).toHaveAttribute(
    'src',
    '/assets/visuals/anime/ivuru-hero-girl.svg',
  );
  await expect(hero.locator('.hero-spark-field')).toHaveCount(0);
  await expect(hero.locator('.hero-petal-field')).toHaveCount(0);
  await expect(hero.getByRole('link', { name: /Works|制作|작업/i }).first()).toBeVisible();
  await expect(
    hero.getByRole('link', { name: /Profile|プロフィール|프로필/i }).first(),
  ).toBeVisible();
});

test('reduced motion keeps the anime artwork available without autoplay media', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await preparePage(page);
  await page.goto('/');

  await expect(page.locator('[data-anime-hero]')).toBeVisible();
  await expect(page.locator('.home-anime-character')).toBeVisible();
  await expect(page.locator('[data-hero-video]')).toHaveCount(0);
  await expect(page.locator('.hero-petal-field')).toHaveCount(0);
});

test('localized routes share the cute anime composition', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'dark');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });

  for (const route of ['/en', '/ko']) {
    await page.goto(route);
    await expect(page.locator('[data-anime-hero]')).toBeVisible();
    await expect(page.locator('.home-anime-character img')).toBeVisible();
  }
});
