import { expect, test } from '@playwright/test';

const preparePage = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'light');
    localStorage.setItem('ivuru-locale', 'ja');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

test('anime scroll story uses the brand signal visual and keeps primary actions clear', async ({
  page,
}) => {
  await preparePage(page);
  await page.goto('/');

  const story = page.locator('[data-anime-scroll-story]');
  await expect(story).toBeVisible();
  await expect(story).toHaveAttribute('data-story-mode', 'motion', { timeout: 4_000 });
  await expect(story.locator('[data-anime-story-scene]')).toHaveCount(4);
  await expect(story.locator('.signal-key-visual')).toBeVisible();
  await expect(story.locator('.signal-key-mark')).toContainText('IV');
  await expect(story.locator('.signal-key-readout')).toBeVisible();
  await expect(story.locator('.blue-media-character img')).toHaveCount(0);
  await expect(story.locator('.hero-spark-field')).toHaveCount(0);
  await expect(story.locator('.hero-petal-field')).toHaveCount(0);
  await expect(story.getByRole('link', { name: /Works|制作|작업/i }).first()).toBeVisible();
  await expect(
    story.getByRole('link', { name: /Profile|プロフィール|프로필/i }).first(),
  ).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-anime-scene', 'ice');
});

test('reduced motion keeps all story artwork available without autoplay media', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await preparePage(page);
  await page.goto('/');

  const story = page.locator('[data-anime-scroll-story]');
  await expect(story).toBeVisible();
  await expect(story).toHaveAttribute('data-story-mode', 'static');
  await expect(story.locator('[data-anime-story-scene]')).toHaveCount(4);
  await expect(story.locator('.signal-key-visual')).toBeVisible();
  await expect(story.locator('[data-hero-video]')).toHaveCount(0);
  await expect(story.locator('.hero-petal-field')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'reduced');
});

test('localized routes share the blue and white four-chapter composition', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'dark');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });

  for (const route of ['/en', '/ko']) {
    await page.goto(route);
    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toBeVisible();
    await expect(story.locator('[data-anime-story-scene]')).toHaveCount(4);
    await expect(story.locator('.signal-key-visual')).toBeVisible();
    await expect(story.locator('.signal-key-mark')).toContainText('IV');
  }
});
