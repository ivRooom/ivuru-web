import { expect, test } from '@playwright/test';

test('JavaScriptが無効でも4章と主要ポータルを縦積み表示する', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
    colorScheme: 'dark',
    locale: 'ja-JP',
  });

  try {
    const page = await context.newPage();
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toBeVisible();
    await expect(story).not.toHaveAttribute('data-story-mode');

    const scenes = story.locator('[data-anime-story-scene]');
    await expect(scenes).toHaveCount(4);

    for (const scene of await scenes.all()) {
      await expect(scene).toBeVisible();
      await expect(scene).toHaveCSS('position', 'relative');
      await expect(scene).toHaveCSS('visibility', 'visible');
      await expect(scene).toHaveCSS('opacity', '1');
    }

    const portals = story.locator('.anime-portal-card');
    await expect(portals).toHaveCount(3);
    await expect(portals.nth(0)).toHaveAttribute('href', '/news');
    await expect(portals.nth(1)).toHaveAttribute('href', '/games');
    await expect(portals.nth(2)).toHaveAttribute('href', '/profile#favorites');

    await expect(story.locator('.anime-story-progress')).toHaveCSS('display', 'none');
    await expect(story.locator('.anime-scroll-cue')).toHaveCSS('display', 'none');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight > document.documentElement.clientHeight * 3,
      ),
    ).toBeTruthy();
  } finally {
    await context.close();
  }
});
