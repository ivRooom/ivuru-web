import { expect, test } from '@playwright/test';

const worldRoutes = [
  '/news',
  '/games',
  '/favorites',
  '/en/news',
  '/en/games',
  '/en/favorites',
  '/ko/news',
  '/ko/games',
  '/ko/favorites',
];

test('new immersive worlds render in every locale', async ({ page }) => {
  for (const route of worldRoutes) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBeTruthy();
    await expect(page.locator('.immersive-page-hero')).toBeVisible();
    await expect(page.locator('main h1')).toBeVisible();
  }
});

test('home exposes News, Games, and Favorites gateways and anime hero media', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.world-loader')).toBeHidden({ timeout: 3000 });
  await expect(
    page.locator('video source[src="/assets/video/hero-anime-op-loop.webm"]'),
  ).toHaveCount(1);
  await expect(page.locator('.world-portal-card[href="/news"]')).toBeVisible();
  await expect(page.locator('.world-portal-card[href="/games"]')).toBeVisible();
  await expect(page.locator('.world-portal-card[href="/favorites"]')).toBeVisible();
  await expect(page.locator('.media-tile-live')).toHaveCount(4);
});

test('games page presents original clips from alternating sides', async ({ page }) => {
  await page.goto('/games');
  await expect(page.locator('.game-cinematic-card')).toHaveCount(3);
  await expect(page.locator('.game-card-left')).toHaveCount(2);
  await expect(page.locator('.game-card-right')).toHaveCount(1);
  await expect(page.locator('.game-card-video source[type="video/webm"]')).toHaveCount(3);
  await expect(page.getByText('ORIGINAL CONCEPT FOOTAGE').first()).toBeVisible();
});

test('Spotify stays unloaded until the visitor explicitly requests it', async ({ page }) => {
  await page.goto('/favorites');
  await expect(page.locator('iframe[src*="open.spotify.com"]')).toHaveCount(0);
  const consent = page.locator('[data-spotify-loaded="false"]');
  await expect(consent).toBeVisible();
  await consent.getByRole('button').click();
  await expect(page.locator('iframe[src*="open.spotify.com/embed/playlist"]')).toHaveCount(1);
  await expect(page.locator('[data-spotify-loaded="true"]')).toBeVisible();
});

test('reduced motion keeps generated media as static posters', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/games');
  await expect(page.locator('.adaptive-loop-video[data-media-state="poster"]')).toHaveCount(4);
  await expect(page.locator('.adaptive-loop-video video')).toHaveCount(0);
  await expect(page.locator('.game-cinematic-card')).toHaveCount(3);
});

test('immersive pages remain viewport-bound on desktop, tablet, and mobile', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of ['/news', '/games', '/favorites']) {
      await page.goto(route);
      await expect(page.locator('.immersive-page-hero')).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        ),
        `${route} at ${viewport.width}px`,
      ).toBeTruthy();
    }
  }
});
