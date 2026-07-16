import { expect, test } from '@playwright/test';

test('keeps the page released after the intro loader finishes', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-locale', 'ja');
    localStorage.setItem('ivuru-theme', 'light');
    sessionStorage.removeItem('ivuru-intro-seen');
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const loader = page.locator('.anime-intro-loader');
  const status = loader.locator('[role="status"]');
  const progressbar = loader.locator('[role="progressbar"]');

  await expect(loader).toHaveCount(1);
  await expect(status).toHaveText('ページを読み込んでいます。');
  await expect(status).toHaveAttribute('aria-live', 'polite');
  await expect(status).toHaveAttribute('aria-atomic', 'true');
  await expect(progressbar).toHaveAttribute('aria-label', 'いゔる。を読み込んでいます');
  await expect(progressbar).toHaveAttribute('aria-valuemin', '0');
  await expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  await expect(progressbar).toHaveAttribute('aria-valuenow', /\d+/);

  await expect(loader).toHaveClass(/is-leaving/, { timeout: 3_000 });
  await page.waitForTimeout(350);
  await expect(loader).toHaveCount(1);
  await expect(loader).toHaveCount(0, { timeout: 2_000 });

  await expect(page.locator('html')).toHaveAttribute('data-loader-released', 'true');
  await page.waitForTimeout(800);
  await expect(page.locator('body')).not.toHaveClass(/site-loading/);
  await expect(loader).toHaveCount(0);
});

test('emits an absolute local profile image URL in Person JSON-LD', async ({ page }) => {
  await page.goto('/profile');

  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonLd).not.toBeNull();
  const person = JSON.parse(jsonLd ?? '{}') as { image?: string };
  expect(person.image).toBe('https://ivuru.ivrm.jp/assets/images/ivuru-profile-fallback.png');
});
