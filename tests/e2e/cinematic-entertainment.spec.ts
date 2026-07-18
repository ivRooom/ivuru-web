import { expect, test } from '@playwright/test';

const prepareHome = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'dark');
    localStorage.setItem('ivuru-locale', 'ja');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

test.describe('Home V2 cinematic entertainment', () => {
  test('adds deterministic warp, impact-cut, and kinetic-type motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toHaveAttribute('data-story-entertainment', 'cinematic-impact', {
      timeout: 6_000,
    });
    await expect(story).toHaveAttribute('data-entertainment-ready', 'true', {
      timeout: 4_000,
    });
    await expect(story.locator('[data-entertainment-ring]')).toHaveCount(6);
    await expect(story.locator('[data-entertainment-comet]')).toHaveCount(6);
    await expect(story.locator('[data-entertainment-slice]')).toHaveCount(3);
    await expect(story.locator('[data-entertainment-word]')).toHaveCount(3);
    await expect(story.locator('.anime-device-orbits')).toHaveCount(1);
    await expect(story.locator('.anime-community-satellites')).toHaveCount(1);

    const initialProgress = await story.evaluate((element) =>
      getComputedStyle(element).getPropertyValue('--entertainment-progress'),
    );
    await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.35, behavior: 'instant' }));
    await expect
      .poll(() =>
        story.evaluate((element) =>
          getComputedStyle(element).getPropertyValue('--entertainment-progress'),
        ),
      )
      .not.toBe(initialProgress);
  });

  test('keeps the extra entertainment layer static for reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await prepareHome(page);
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toHaveAttribute('data-story-entertainment', 'static', {
      timeout: 6_000,
    });
    await expect(story.locator('.anime-entertainment-layer')).toBeHidden();
    await expect(story.locator('.anime-cinematic-curtain')).toBeHidden();
    await expect(story.getByRole('heading', { name: /いゔる。/ }).first()).toBeVisible();
  });
});
