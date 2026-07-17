import { expect, test, type Page } from '@playwright/test';

const prepareMediaCapablePage = async (page: Page) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      configurable: true,
      value: 8,
    });
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: {
        saveData: false,
        effectiveType: '4g',
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      },
    });
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

test('News and Games render in every locale', async ({ page }) => {
  for (const route of ['/news', '/en/news', '/ko/news']) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBeTruthy();
    await expect(page.locator('.immersive-page-hero')).toBeVisible();
  }

  for (const route of ['/games', '/en/games', '/ko/games']) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBeTruthy();
    await expect(page.locator('.editorial-page-hero')).toBeVisible();
    await expect(page.locator('.editorial-game-card')).toHaveCount(3);
  }
});

test('home exposes the focused Works, Profile, Journal, and ivRm destinations', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => sessionStorage.setItem('ivuru-intro-seen', '1'));
  await page.goto('/');
  await expect(page.locator('.world-loader')).toBeHidden({ timeout: 4_000 });
  const story = page.locator('[data-anime-scroll-story]');
  await expect(story).toBeVisible();
  await expect(story).toHaveAttribute('data-story-mode', 'static');
  const portals = page.locator('.home-portals');
  await portals.scrollIntoViewIfNeeded();
  await expect(portals.locator('a[href="/works"]')).toBeVisible();
  await expect(portals.locator('a[href="/profile"]')).toBeVisible();
  await expect(portals.locator('a[href="/blog"]')).toBeVisible();
  await expect(portals.locator('a[href="https://ivrm.jp"]')).toBeVisible();
});

test('games page presents three restrained motion studies', async ({ page }) => {
  await prepareMediaCapablePage(page);
  await page.goto('/games');

  const cards = page.locator('.editorial-game-card');
  await expect(cards).toHaveCount(3);

  for (let index = 0; index < 3; index += 1) {
    const card = cards.nth(index);
    await card.scrollIntoViewIfNeeded();
    await expect(card.locator('.editorial-game-video source[type="video/webm"]')).toHaveCount(1);
  }

  await expect(page.getByText('ORIGINAL MOTION STUDY').first()).toBeVisible();
});

test('Favorites lives inside Profile and Spotify stays deferred', async ({ page }) => {
  await page.goto('/profile#favorites');
  const favorites = page.locator('#favorites');
  await expect(favorites).toBeVisible();
  await expect(favorites.locator('.profile-favorite-card')).toHaveCount(4);
  await expect(page.locator('iframe[src*="open.spotify.com"]')).toHaveCount(0);

  const consent = favorites.locator('[data-spotify-loaded="false"]');
  await expect(consent).toBeVisible();
  await consent.getByRole('button').click();
  await expect(page.locator('iframe[src*="open.spotify.com/embed/playlist"]')).toHaveCount(1);
  await expect(favorites.locator('[data-spotify-loaded="true"]')).toBeVisible();
});

test('legacy Favorites URLs move to the matching Profile section', async ({ page }) => {
  for (const [route, target] of [
    ['/favorites', '/profile#favorites'],
    ['/en/favorites', '/en/profile#favorites'],
    ['/ko/favorites', '/ko/profile#favorites'],
  ]) {
    await page.goto(route);
    await expect
      .poll(() => page.evaluate(() => `${window.location.pathname}${window.location.hash}`))
      .toBe(target);
    await expect(page.locator('#favorites')).toBeVisible();
  }
});

test('reduced motion keeps Games media as static posters', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/games');
  await expect(page.locator('.adaptive-loop-video[data-media-state="poster"]')).toHaveCount(3);
  await expect(page.locator('.adaptive-loop-video video')).toHaveCount(0);
  await expect(page.locator('.editorial-game-card')).toHaveCount(3);
});

test('editorial pages remain viewport-bound on desktop, tablet, and mobile', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of ['/games', '/profile#favorites']) {
      await page.goto(route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        ),
        `${route} at ${viewport.width}px`,
      ).toBeTruthy();
    }
  }
});
