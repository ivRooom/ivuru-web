import { expect, test } from '@playwright/test';

const prepareHome = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'dark');
    localStorage.setItem('ivuru-locale', 'ja');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

test.describe('Singularity Overdrive', () => {
  test('スクロールで収束から爆発・光速トンネルへ移行する', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toHaveAttribute('data-story-overdrive', 'singularity-overdrive', {
      timeout: 8_000,
    });
    await expect(story).toHaveAttribute('data-overdrive-ready', 'true');

    const overlay = story.locator('[data-singularity-overdrive]');
    await expect(overlay).toHaveCount(1);
    await expect(overlay.locator('.anime-singularity-ray')).toHaveCount(24);
    await expect(overlay.locator('.anime-singularity-fragment')).toHaveCount(12);
    await expect(overlay.locator('.anime-singularity-title-main')).toHaveText('OVERDRIVE');

    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight * 0.72, behavior: 'instant' });
    });

    await expect
      .poll(() =>
        story.evaluate((element) =>
          Number(getComputedStyle(element).getPropertyValue('--singularity-progress')),
        ),
      )
      .toBeGreaterThan(0.35);
    await expect(story).toHaveAttribute('data-overdrive-phase', /collapse|burst|tunnel/);
  });

  test('Reduced Motionでは動的Overdriveを生成しない', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await prepareHome(page);
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toHaveAttribute('data-story-overdrive', 'static');
    await expect(story).toHaveAttribute('data-overdrive-ready', 'true');
    await expect(story.locator('[data-singularity-overdrive]')).toHaveCount(0);
  });
});
