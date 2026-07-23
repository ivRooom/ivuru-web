import { expect, test, type Page } from '@playwright/test';

const prepare = async (page: Page) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('ivuru-intro-seen', '1');
    localStorage.setItem('ivuru-locale', 'ja');
  });
};

const expectStaticStack = async (page: Page) => {
  const story = page.locator('[data-anime-scroll-story]');

  await expect(page.locator('html')).toHaveAttribute('data-story-render-mode', 'static-stack');
  await expect(story).toHaveAttribute('data-story-render-mode', 'static-stack');
  await expect(story).toHaveAttribute('data-story-scroll-mode', 'static-stack');
  await expect(story).toHaveAttribute('data-story-progress-authority', 'disabled');
  await expect(story).toHaveAttribute('data-story-mode', 'static');
  await expect(story).toHaveAttribute('data-story-chapter', 'all');
  await expect(story.locator('[data-anime-story-scene][data-active="true"]')).toHaveCount(3);
  await expect(story.locator('[data-anime-story-scene][aria-hidden="false"]')).toHaveCount(3);
  await expect(story.locator('[data-anime-story-scene][inert]')).toHaveCount(0);
};

test('モバイルはスクロール演出を使わず3章を通常フローで描画する', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page);
  await page.goto('/');

  await expectStaticStack(page);

  const story = page.locator('[data-anime-scroll-story]');
  for (const scene of await story.locator('[data-anime-story-scene]').all()) {
    await expect(scene).toBeVisible();
    await expect
      .poll(() => scene.evaluate((element) => Number(getComputedStyle(element).opacity)))
      .toBeGreaterThan(0.9);
  }

  await expect(story.locator('.signal-key-visual')).toBeHidden();
  await expect(story.locator('.anime-build-device')).toBeHidden();
  await expect(story.locator('.anime-community-emblem')).toBeHidden();
  await expect(story.locator('.anime-light-road')).toBeHidden();
  await expect(story.locator('[data-chapter-gate]')).toHaveCount(0);

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    ),
  ).toBe(false);
});

test('デスクトップは従来のフル演出を維持しreload後も操作できる', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await prepare(page);
  await page.goto('/');

  const html = page.locator('html');
  const story = page.locator('[data-anime-scroll-story]');
  await expect(html).toHaveAttribute('data-story-effects-profile', 'full', { timeout: 12_000 });
  await expect(html).not.toHaveAttribute('data-story-render-mode', 'static-stack');
  await expect(story).not.toHaveAttribute('data-story-scroll-mode', 'static-stack');
  await expect(story).toHaveAttribute('data-story-progress-authority', 'ready', {
    timeout: 12_000,
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(html).toHaveAttribute('data-story-effects-profile', 'full', { timeout: 12_000 });
  await expect(story).not.toHaveAttribute('data-story-render-mode', 'static-stack');

  const skip = page.locator('[data-story-skip]');
  await expect(skip).toBeVisible();
  await skip.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#anime-story-after')).toBeFocused({ timeout: 3_000 });
});

test('Reduced Motionは3章を順番に読める静的ストーリーへ切り替える', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await prepare(page);
  await page.goto('/');

  const story = page.locator('[data-anime-scroll-story]');
  await expect(story).toHaveAttribute('data-story-progress-authority', 'static');
  await expect(story).toHaveAttribute('data-story-mode', 'static');
  await expect(story.locator('[data-anime-story-scene][data-active="true"]')).toHaveCount(3);
  await expect(story.locator('[data-anime-story-scene][aria-hidden="true"]')).toHaveCount(0);
  await expect(story.locator('[data-anime-story-scene][inert]')).toHaveCount(0);
  await expect(story.locator('[data-story-chapter-readout]')).toHaveText('01–03 / STATIC STORY');
});

test.describe('JavaScript無効時の静的フォールバック', () => {
  test.use({ javaScriptEnabled: false });

  test('3章と後続コンテンツを読み進められる', async ({ page }) => {
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toBeVisible();
    await expect(story).not.toHaveAttribute('data-story-mode', 'motion');
    await expect(story.locator('[data-anime-story-scene]')).toHaveCount(3);
    await expect(story.locator('[data-anime-story-scene]').nth(0)).toBeVisible();
    await expect(story.locator('[data-anime-story-scene]').nth(1)).toBeVisible();
    await expect(story.locator('[data-anime-story-scene]').nth(2)).toBeVisible();
    await expect(page.locator('#anime-story-after')).toBeVisible();
    await expect(page.locator('[data-story-skip]')).toHaveAttribute('href', '#anime-story-after');
  });
});
