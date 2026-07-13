import { expect, test } from '@playwright/test';

test('core routes and language variants render', async ({ page }) => {
  for (const route of [
    '/',
    '/profile',
    '/works',
    '/portfolio',
    '/blog',
    '/privacy',
    '/terms',
    '/en',
    '/ko',
  ]) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBeTruthy();
    await expect(page.locator('main')).toBeVisible();
  }
});

test('custom 404 renders', async ({ page }) => {
  const response = await page.goto('/not-a-world');
  expect(response?.status()).toBe(404);
  await expect(page.getByText('WORLD NOT FOUND')).toBeVisible();
});

test('theme selection persists', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: /^Theme:/ });
  await button.click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('ivuru-theme'))).toBe('light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('mobile menu opens and closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeHidden();
});

test('works filter and blog search work', async ({ page }) => {
  await page.goto('/works');
  await page.getByRole('button', { name: 'Community', exact: true }).click();
  await expect(page.locator('[data-work-card]:visible')).toHaveCount(1);
  await page.goto('/blog');
  await page.getByPlaceholder('記事を検索').fill('not-found-query');
  await expect(page.getByText('一致する項目がありません。')).toBeVisible();
});

test('reduced motion keeps content available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /ivuruGG/i }).first()).toBeVisible();
  await expect(page.getByText('Featured Works')).toBeVisible();
});
