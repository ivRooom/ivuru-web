import { expect, test } from '@playwright/test';

test('keeps accessible loader metadata in SSR and releases the page safely', async ({ page }) => {
  const response = await page.request.get('/');
  expect(response.ok()).toBeTruthy();
  const markup = await response.text();
  expect(markup).toContain('anime-intro-loader');
  expect(markup).toContain('role="status"');
  expect(markup).toContain('ページを読み込んでいます。');
  expect(markup).toContain('aria-live="polite"');
  expect(markup).toContain('aria-atomic="true"');
  expect(markup).toContain('role="progressbar"');
  expect(markup).toContain('aria-label="いゔる。を読み込んでいます"');
  expect(markup).toContain('aria-valuemin="0"');
  expect(markup).toContain('aria-valuemax="100"');

  await page.addInitScript(() => {
    localStorage.setItem('ivuru-locale', 'ja');
    localStorage.setItem('ivuru-theme', 'light');
    sessionStorage.removeItem('ivuru-intro-seen');
  });
  await page.goto('/');

  await expect(page.locator('.anime-intro-loader')).toBeHidden({ timeout: 4_000 });
  await expect(page.locator('html')).toHaveAttribute('data-loader-released', 'true');
  await expect(page.locator('body')).not.toHaveClass(/site-loading/);
});

test('emits an absolute local profile image URL in Person JSON-LD', async ({ page }) => {
  await page.goto('/profile');

  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonLd).not.toBeNull();
  const person = JSON.parse(jsonLd ?? '{}') as { image?: string };
  expect(person.image).toBe('https://ivuru.ivrm.jp/assets/images/ivuru-profile-fallback.png');
});
