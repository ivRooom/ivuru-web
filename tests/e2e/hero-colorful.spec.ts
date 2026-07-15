import { expect, test } from '@playwright/test';

test('colorful anime hero layers render without blocking actions', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('[data-colorful-anime-hero]');
  await expect(hero).toBeVisible();
  await expect(hero.locator('.hero-anime-bloom img')).toHaveAttribute(
    'src',
    '/assets/visuals/hero-anime-bloom.svg',
  );
  await expect(hero.locator('.hero-spark-field i')).toHaveCount(12);
  await expect(hero.locator('.hero-petal-field i')).toHaveCount(8);
  await expect(hero.getByRole('link', { name: /Works|制作|작업/i }).first()).toBeVisible();
});

test('reduced motion keeps the colorful key visual but stops decorative motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.hero-anime-bloom')).toBeVisible();
  await expect(page.locator('.hero-petal-field')).toBeHidden();
});

test('localized routes share the colorful hero composition', async ({ page }) => {
  for (const route of ['/en', '/ko']) {
    await page.goto(route);
    await expect(page.locator('[data-colorful-anime-hero]')).toBeVisible();
    await expect(page.locator('.hero-anime-bloom img')).toBeVisible();
  }
});
