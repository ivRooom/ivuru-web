import { expect, test } from '@playwright/test';

test('keeps the page released after the intro loader finishes', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-locale', 'ja');
    localStorage.setItem('ivuru-theme', 'light');
    sessionStorage.removeItem('ivuru-intro-seen');
  });
  await page.goto('/');

  const loader = page.locator('.anime-intro-loader');
  await expect(loader).toBeHidden({ timeout: 4_000 });
  await expect(page.locator('html')).toHaveAttribute('data-loader-released', 'true');
  await page.waitForTimeout(800);
  await expect(page.locator('body')).not.toHaveClass(/site-loading/);
  await expect(loader).toBeHidden();
});

test('emits an absolute local profile image URL in Person JSON-LD', async ({ page }) => {
  await page.goto('/profile');

  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonLd).not.toBeNull();
  const person = JSON.parse(jsonLd ?? '{}') as { image?: string };
  expect(person.image).toBe(
    'https://ivurugg.ivrm.jp/assets/visuals/blue-anime/ivuru-profile-blue.svg',
  );
});
