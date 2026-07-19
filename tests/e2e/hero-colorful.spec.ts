import { expect, test } from '@playwright/test';

const preparePage = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'light');
    localStorage.setItem('ivuru-locale', 'ja');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

test('Home V2 uses the brand signal visual and keeps primary actions clear', async ({ page }) => {
  await preparePage(page);
  await page.goto('/');

  const story = page.locator('[data-anime-scroll-story]');
  await expect(story).toBeVisible();
  await expect(story).toHaveAttribute('data-story-mode', 'motion', { timeout: 10_000 });
  await expect(story.locator('[data-anime-story-scene]')).toHaveCount(3);
  await expect(story.locator('.signal-key-visual')).toBeVisible();
  await expect(story.locator('.signal-key-mark')).toContainText('IV');
  await expect(story.locator('.signal-key-readout')).toBeHidden();
  await expect(story.locator('.signal-key-orbit')).toHaveCount(3);
  await expect(story.locator('.signal-key-scan')).toBeVisible();
  await expect(story.locator('[data-story-camera-rig]')).toHaveCount(1);
  await expect(story.locator('[data-story-flyby]')).toHaveCount(5);
  await expect(story.getByRole('link', { name: /Works|制作|작업/i }).first()).toBeVisible();
  await expect(
    story.getByRole('link', { name: /Profile|プロフィール|프로필/i }).first(),
  ).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-anime-scene', 'ice');
});

test('reduced motion keeps all three story scenes available without autoplay motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await preparePage(page);
  await page.goto('/');

  const story = page.locator('[data-anime-scroll-story]');
  await expect(story).toBeVisible();
  await expect(story).toHaveAttribute('data-story-mode', 'static', { timeout: 10_000 });
  await expect(story).toHaveAttribute('data-story-camera', 'static');
  await expect(story.locator('[data-anime-story-scene]')).toHaveCount(3);
  await expect(story.locator('.signal-key-visual')).toBeVisible();
  await expect(story.locator('.anime-depth-flybys')).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'reduced');
});

test('localized routes share the blue and white three-scene composition', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'dark');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });

  for (const route of ['/en', '/ko']) {
    await page.goto(route);
    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toBeVisible();
    await expect(story.locator('[data-anime-story-scene]')).toHaveCount(3);
    await expect(story.locator('[data-story-flyby]')).toHaveCount(5);
    await expect(story.locator('.signal-key-visual')).toBeVisible();
    await expect(story.locator('.signal-key-mark')).toContainText('IV');
    await expect(page.locator('.home-portal-link')).toHaveCount(4);
  }
});
