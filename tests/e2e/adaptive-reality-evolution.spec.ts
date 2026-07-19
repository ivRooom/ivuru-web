import { expect, test } from '@playwright/test';

const prepareHome = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'dark');
    localStorage.setItem('ivuru-locale', 'ja');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

const scrollViewport = async (page: import('@playwright/test').Page, multiplier: number) => {
  await page.evaluate((value) => {
    window.scrollTo({ top: window.innerHeight * value, behavior: 'instant' });
  }, multiplier);
};

test.describe('Adaptive Reality evolution', () => {
  test('入力速度へ反応し01→02と02→03でReality variantを切り替える', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const loader = page.locator('[data-spatial-loader]');
    await expect(loader).toHaveAttribute('data-loader-evolution', 'reality-reactor', {
      timeout: 5_000,
    });
    await expect(loader).toHaveAttribute('data-loader-quality', /ultra|balanced|lite/);
    await expect(loader.locator('[data-quantum-reality-reactor]')).toHaveCount(1);
    await expect(loader.locator('.quantum-reality-reactor__plates > i')).toHaveCount(12);
    await expect(loader).toBeHidden({ timeout: 5_000 });

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toHaveAttribute('data-story-reality-engine', 'adaptive-overdrive', {
      timeout: 10_000,
    });
    await expect(story).toHaveAttribute('data-story-reality-quality', /ultra|balanced|lite/);

    const reality = story.locator('[data-adaptive-reality]');
    await expect(reality).toHaveCount(1);
    await expect(reality.locator('.anime-reality-overdrive__fractures > i')).toHaveCount(14);
    await expect(reality.locator('.anime-reality-overdrive__particles > i')).toHaveCount(24);

    await scrollViewport(page, 1.55);
    await expect(story).toHaveAttribute('data-story-transition', '01-02', { timeout: 8_000 });
    await expect(reality).toHaveAttribute('data-reality-variant', 'forge');

    await story.dispatchEvent('wheel', { deltaY: 900 });
    await expect
      .poll(() =>
        story.evaluate(
          (element) => Number.parseFloat(element.style.getPropertyValue('--reality-energy')) || 0,
        ),
      )
      .toBeGreaterThan(0.05);
    await expect(story).toHaveAttribute('data-story-reality-intensity', /charged|overdrive/);
    await expect(story).toHaveAttribute('data-story-reality-direction', 'forward');

    await scrollViewport(page, 4.45);
    await expect(story).toHaveAttribute('data-story-transition', '02-03', { timeout: 8_000 });
    await expect(reality).toHaveAttribute('data-reality-variant', 'nexus');

    await story.dispatchEvent('wheel', { deltaY: -760 });
    await expect(story).toHaveAttribute('data-story-reality-direction', 'reverse');
  });

  test('Reduced Motionでは追加Reality DOMを生成しない', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await prepareHome(page);
    await page.goto('/');

    const loader = page.locator('[data-spatial-loader]');
    await expect(loader).toHaveAttribute('data-loader-evolution', 'reality-reactor');
    await expect(loader).toHaveAttribute('data-loader-evolution-state', 'static');
    await expect(loader.locator('[data-quantum-reality-reactor]')).toHaveCount(0);

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toHaveAttribute('data-story-reality-engine', 'static');
    await expect(story.locator('[data-adaptive-reality]')).toHaveCount(0);
  });
});
