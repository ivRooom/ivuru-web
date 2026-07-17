import { expect, test } from '@playwright/test';

test('keeps accessible orbital loader metadata in SSR and releases the page safely', async ({
  page,
}) => {
  const response = await page.request.get('/');
  expect(response.ok()).toBeTruthy();
  const markup = await response.text();
  expect(markup).toContain('anime-intro-loader');
  expect(markup).toContain('IVURU / ORBITAL CORE');
  expect(markup).toContain('SYSTEM.STATUS:');
  expect(markup).toContain('RENDER: TRANSFORM / OPACITY');
  expect(markup).toContain('role="status"');
  expect(markup).toContain('ページを読み込んでいます。');
  expect(markup).toContain('aria-live="polite"');
  expect(markup).toContain('aria-atomic="true"');
  expect(markup).toContain('role="progressbar"');
  expect(markup).toContain('aria-label="いゔる。を読み込んでいます"');
  expect(markup).toContain('aria-valuemin="0"');
  expect(markup).toContain('aria-valuemax="100"');
  expect(markup).not.toContain('LOW-POLY DRIVE');
  expect(markup).not.toContain('low-poly-car');

  await page.addInitScript(() => {
    localStorage.setItem('ivuru-locale', 'ja');
    localStorage.setItem('ivuru-theme', 'dark');
    sessionStorage.removeItem('ivuru-intro-seen');
  });
  await page.goto('/');

  await expect(page.locator('.orbital-loader')).toBeHidden({ timeout: 4_000 });
  await expect(page.locator('html')).toHaveAttribute('data-loader-released', 'true');
  await expect(page.locator('body')).not.toHaveClass(/site-loading/);
});

test('renders a single restrained orbital visual without theme switching', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-locale', 'ja');
    localStorage.setItem('ivuru-theme', 'dark');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.orbital-loader')).toHaveCount(1);
  await expect(page.locator('.orbital-system')).toHaveCount(1);
  await expect(page.locator('.orbital-core')).toHaveCount(1);
  await expect(page.locator('.orbital-ring')).toHaveCount(3);
  await expect(page.locator('.low-poly-car')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveAttribute('data-loader-theme', /orbit|drive/);
});

test('does not render the cinematic loader on lower pages', async ({ page }) => {
  const response = await page.request.get('/profile');
  expect(response.ok()).toBeTruthy();
  const markup = await response.text();
  expect(markup).not.toContain('data-orbital-loader');

  await page.goto('/profile');
  await expect(page.locator('.orbital-loader')).toHaveCount(0);
  await expect(page.locator('#main-content h1')).toBeVisible();
});

test('emits an absolute local profile image URL in Person JSON-LD', async ({ page }) => {
  await page.goto('/profile');

  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonLd).not.toBeNull();
  const person = JSON.parse(jsonLd ?? '{}') as { image?: string };
  expect(person.image).toBe('https://ivuru.ivrm.jp/assets/images/ivuru-profile-fallback.png');
});
