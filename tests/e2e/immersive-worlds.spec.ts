import { expect, test } from '@playwright/test';

const routes = [
  { path: '/news', root: '.scene-news' },
  { path: '/games', root: '.scene-games' },
  { path: '/profile', root: '.character-sheet' },
];

test.describe('immersive scene routes', () => {
  for (const route of routes) {
    test(`${route.path} renders its immersive scene without overflow`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.addInitScript(() => sessionStorage.setItem('ivuru-intro-seen', '1'));
      await page.goto(route.path);
      await expect(page.locator('.world-loader')).toBeHidden({ timeout: 3000 });
      await expect(page.locator(route.root)).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        ),
      ).toBeTruthy();
    });
  }
});

test('news exposes a transmission list and active chapter navigation', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('ivuru-intro-seen', '1'));
  await page.goto('/news');
  await expect(page.locator('.scene-news')).toBeVisible();
  await expect(page.locator('.transmission-list article')).toHaveCount(4);
  await expect(page.locator('html')).toHaveAttribute('data-chapter', '03');
  await expect(page.locator('.desktop-nav a[href="/news"]')).toHaveAttribute('aria-current', 'page');
});

test('games exposes playable-looking mission cards', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('ivuru-intro-seen', '1'));
  await page.goto('/games');
  await expect(page.locator('.scene-games')).toBeVisible();
  await expect(page.locator('.game-mission-grid article')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: /Game Worlds|ゲームワールド/ })).toBeVisible();
});

test('home exposes anime scenes to News, Games, and Profile Favorites', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => sessionStorage.setItem('ivuru-intro-seen', '1'));
  await page.goto('/');
  await expect(page.locator('.world-loader')).toBeHidden({ timeout: 4_000 });
  await expect(page.locator('[data-anime-scroll-story]')).toHaveAttribute(
    'data-story-mode',
    'static',
  );
  await expect(page.locator('.anime-portal-card[href="/news"]')).toBeVisible();
  await expect(page.locator('.anime-portal-card[href="/games"]')).toBeVisible();
  await expect(page.locator('.anime-portal-card[href="/profile#favorites"]')).toBeVisible();
});

test('profile exposes Favorites as an in-page scene', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('ivuru-intro-seen', '1'));
  await page.goto('/profile#favorites');
  await expect(page.locator('#favorites')).toBeVisible();
  await expect(page.locator('#favorites .profile-favorite-card')).toHaveCount(4);
});

test('news, games, and profile preserve language prefixes', async ({ page }) => {
  for (const path of ['/en/news', '/en/games', '/en/profile', '/ko/news', '/ko/games', '/ko/profile']) {
    const response = await page.goto(path);
    expect(response?.ok(), path).toBeTruthy();
    await expect(page.locator('main')).toBeVisible();
  }
});

test('news filter exposes all channels and an empty state', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('ivuru-intro-seen', '1'));
  await page.goto('/news');
  await expect(page.locator('.news-filter-bar [data-news-filter]')).toHaveCount(5);
  await page.locator('[data-news-filter="maintenance"]').click();
  await expect(page.locator('[data-news-item]:visible')).toHaveCount(0);
  await expect(page.locator('[data-news-empty]')).toBeVisible();
});

test('games filter can isolate game worlds', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('ivuru-intro-seen', '1'));
  await page.goto('/games');
  await expect(page.locator('.game-filter-bar [data-game-filter]')).toHaveCount(4);
  await page.locator('[data-game-filter="sandbox"]').click();
  await expect(page.locator('[data-game-card]:visible')).toHaveCount(1);
});

test('profile favorite filters expose visual categories', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('ivuru-intro-seen', '1'));
  await page.goto('/profile#favorites');
  await expect(page.locator('.favorite-filter-bar [data-favorite-filter]')).toHaveCount(5);
  await page.locator('[data-favorite-filter="game"]').click();
  await expect(page.locator('[data-favorite-card]:visible')).toHaveCount(1);
});
