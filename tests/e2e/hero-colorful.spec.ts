import { expect, test } from '@playwright/test';

test('editorial home hero keeps the primary actions clear', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('[data-editorial-hero]');
  await expect(hero).toBeVisible();
  await expect(hero.locator('.home-editorial-sketch img')).toHaveAttribute(
    'src',
    '/assets/visuals/editorial/home-studio-sketch.svg',
  );
  await expect(hero.locator('.hero-spark-field')).toHaveCount(0);
  await expect(hero.locator('.hero-petal-field')).toHaveCount(0);
  await expect(hero.getByRole('link', { name: /Works|制作|작업/i }).first()).toBeVisible();
  await expect(
    hero.getByRole('link', { name: /Profile|プロフィール|프로필/i }).first(),
  ).toBeVisible();
});

test('reduced motion keeps the editorial hero and static artwork available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('[data-editorial-hero]')).toBeVisible();
  await expect(page.locator('.home-editorial-sketch')).toBeVisible();
  await expect(page.locator('.hero-petal-field')).toHaveCount(0);
});

test('localized routes share the restrained editorial composition', async ({ page }) => {
  for (const route of ['/en', '/ko']) {
    await page.goto(route);
    await expect(page.locator('[data-editorial-hero]')).toBeVisible();
    await expect(page.locator('.home-editorial-sketch img')).toBeVisible();
  }
});
