import { expect, test } from '@playwright/test';

test('keeps accessible spatial loader metadata in SSR and releases the page safely', async ({
  page,
}) => {
  const response = await page.request.get('/');
  expect(response.ok()).toBeTruthy();
  const markup = await response.text();
  expect(markup).toContain('anime-intro-loader');
  expect(markup).toContain('IVURU / SPATIAL ENGINE');
  expect(markup).toContain('CSS PERSPECTIVE · 12 FACES');
  expect(markup).toContain('SYSTEM.STATUS:');
  expect(markup).toContain('RENDER: CSS_3D / PRESERVE_3D');
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

  await expect(page.locator('.spatial-loader')).toBeHidden({ timeout: 4_000 });
  await expect(page.locator('html')).toHaveAttribute('data-loader-released', 'true');
  await expect(page.locator('body')).not.toHaveClass(/site-loading/);
});

test('hard releases the loader even when requestAnimationFrame does not advance', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-locale', 'ja');
    localStorage.setItem('ivuru-theme', 'dark');
    sessionStorage.removeItem('ivuru-intro-seen');
    window.requestAnimationFrame = () => 0;
    window.cancelAnimationFrame = () => undefined;
  });

  await page.goto('/');
  await expect(page.locator('.spatial-loader')).toBeHidden({ timeout: 4_000 });
  await expect(page.locator('html')).toHaveAttribute('data-loader-released', 'true');
  await expect(page.locator('body')).not.toHaveClass(/site-loading/);
});

test('releases a stalled loader as soon as the user attempts to scroll', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-locale', 'ja');
    localStorage.setItem('ivuru-theme', 'dark');
    sessionStorage.removeItem('ivuru-intro-seen');
    window.requestAnimationFrame = () => 0;
    window.cancelAnimationFrame = () => undefined;
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.mouse.wheel(0, 400);
  await expect(page.locator('.spatial-loader')).toBeHidden({ timeout: 1_500 });
  await expect(page.locator('html')).toHaveAttribute('data-loader-released', 'true');
});

test('renders a real 3D cube hierarchy and three gyroscope planes', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-locale', 'ja');
    localStorage.setItem('ivuru-theme', 'dark');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.spatial-loader')).toHaveCount(1);
  await expect(page.locator('.spatial-scene')).toHaveCount(1);
  await expect(page.locator('.glass-cube > .cube-face')).toHaveCount(6);
  await expect(page.locator('.energy-cube > .energy-face')).toHaveCount(6);
  await expect(page.locator('.gyro')).toHaveCount(3);
  await expect(page.locator('.depth-particle')).toHaveCount(4);
  await expect(page.locator('.low-poly-car')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveAttribute('data-loader-theme', /orbit|drive/);
});

test('does not render the cinematic loader on lower pages', async ({ page }) => {
  const response = await page.request.get('/profile');
  expect(response.ok()).toBeTruthy();
  const markup = await response.text();
  expect(markup).not.toContain('data-spatial-loader');

  await page.goto('/profile');
  await expect(page.locator('.spatial-loader')).toHaveCount(0);
  await expect(page.locator('#main-content h1')).toBeVisible();
});

test('emits an absolute local profile image URL in Person JSON-LD', async ({ page }) => {
  await page.goto('/profile');

  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonLd).not.toBeNull();
  const person = JSON.parse(jsonLd ?? '{}') as { image?: string };
  expect(person.image).toBe('https://ivuru.ivrm.jp/assets/images/ivuru-profile-fallback.png');
});
