import { expect, test } from '@playwright/test';

const prepareHome = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'dark');
    localStorage.setItem('ivuru-locale', 'ja');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

const scrollViewport = async (
  page: import('@playwright/test').Page,
  multiplier: number,
) => {
  await page.evaluate((value) => {
    window.scrollTo({ top: window.innerHeight * value, behavior: 'instant' });
  }, multiplier);
};

test.describe('World Forge chapter transitions', () => {
  test('01→02→03を同一ポータル軸のゲート演出で接続する', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toHaveAttribute(
      'data-story-transition-engine',
      'world-forge',
      {
        timeout: 10_000,
      },
    );
    await expect(story).toHaveAttribute('data-story-axis', 'portal-forward');
    await expect(story).toHaveAttribute('data-spatial-camera-ready', 'true', {
      timeout: 10_000,
    });

    const gate = story.locator('[data-chapter-gate]');
    await expect(gate).toHaveCount(1);
    await expect(gate.locator('[data-gate-blades] > i')).toHaveCount(12);
    await expect(gate.locator('[data-gate-rays] > i')).toHaveCount(18);
    await expect(gate.locator('[data-gate-shards] > i')).toHaveCount(10);

    await scrollViewport(page, 1.55);
    await expect(story).toHaveAttribute('data-story-transition', '01-02', {
      timeout: 8_000,
    });
    await expect(story).toHaveAttribute(
      'data-story-transition-phase',
      /charge|collapse|burst|reveal/,
    );

    await scrollViewport(page, 2.55);
    await expect(story).toHaveAttribute('data-story-chapter', '02', {
      timeout: 8_000,
    });

    await scrollViewport(page, 4.45);
    await expect(story).toHaveAttribute('data-story-transition', '02-03', {
      timeout: 8_000,
    });

    await scrollViewport(page, 5.65);
    await expect(story).toHaveAttribute('data-story-chapter', '03', {
      timeout: 8_000,
    });
    await expect(story).toHaveAttribute('data-story-camera', 'multi-axis');
    await expect(story).toHaveAttribute(
      'data-story-camera-path',
      'portal-forward-stabilized',
    );
  });

  test('Reduced Motionでは章間ゲートを生成せず3章を静的表示する', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await prepareHome(page);
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toHaveAttribute(
      'data-story-transition-engine',
      'static',
    );
    await expect(story).toHaveAttribute('data-story-axis', 'portal-forward');
    await expect(story.locator('[data-chapter-gate]')).toHaveCount(0);
    await expect(
      story.locator('[data-anime-story-scene][data-active="true"]'),
    ).toHaveCount(3);
  });
});
