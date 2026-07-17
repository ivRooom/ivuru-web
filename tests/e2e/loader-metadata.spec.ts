import { expect, test } from '@playwright/test';

test('keeps accessible loader metadata in SSR and releases the page safely', async ({ page }) => {
  const response = await page.request.get('/');
  expect(response.ok()).toBeTruthy();
  const markup = await response.text();
  expect(markup).toContain('anime-intro-loader');
  expect(markup).toContain('ORBIT &amp; PHASE');
  expect(markup).toContain('LOW-POLY DRIVE');
  expect(markup).toContain('SYSTEM.STATUS:');
  expect(markup).toContain('RENDER: CSS_3D');
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
    localStorage.setItem('ivuru-theme', 'dark');
    sessionStorage.removeItem('ivuru-intro-seen');
    sessionStorage.removeItem('ivuru-loader-theme');
  });
  await page.goto('/');

  await expect(page.locator('.anime-intro-loader')).toBeHidden({ timeout: 4_000 });
  await expect(page.locator('html')).toHaveAttribute('data-loader-released', 'true');
  await expect(page.locator('body')).not.toHaveClass(/site-loading/);
});

test('alternates Orbit and Drive themes on reload', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-locale', 'ja');
    localStorage.setItem('ivuru-theme', 'dark');
    if (sessionStorage.getItem('ivuru-loader-test-prepared') !== '1') {
      sessionStorage.removeItem('ivuru-loader-theme');
      sessionStorage.setItem('ivuru-loader-test-prepared', '1');
    }
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const firstTheme = await page.locator('html').getAttribute('data-loader-theme');
  expect(['orbit', 'drive']).toContain(firstTheme);
  await expect(page.locator('.dual-loader')).toHaveAttribute('data-theme', firstTheme ?? 'orbit');

  await page.reload({ waitUntil: 'domcontentloaded' });
  const secondTheme = await page.locator('html').getAttribute('data-loader-theme');
  expect(['orbit', 'drive']).toContain(secondTheme);
  expect(secondTheme).not.toBe(firstTheme);
  await expect(page.locator('.dual-loader')).toHaveAttribute('data-theme', secondTheme ?? 'drive');
});

test('does not render the cinematic loader on lower pages', async ({ page }) => {
  const response = await page.request.get('/profile');
  expect(response.ok()).toBeTruthy();
  const markup = await response.text();
  expect(markup).not.toContain('data-dual-loader');

  await page.goto('/profile');
  await expect(page.locator('.dual-loader')).toHaveCount(0);
  await expect(page.locator('#main-content h1')).toBeVisible();
});

test('emits an absolute local profile image URL in Person JSON-LD', async ({ page }) => {
  await page.goto('/profile');

  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonLd).not.toBeNull();
  const person = JSON.parse(jsonLd ?? '{}') as { image?: string };
  expect(person.image).toBe('https://ivuru.ivrm.jp/assets/images/ivuru-profile-fallback.png');
});
