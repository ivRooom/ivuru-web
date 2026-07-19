import { expect, test } from '@playwright/test';

const prepareHome = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'dark');
    localStorage.setItem('ivuru-locale', 'ja');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

test.describe('Singularity Overdrive', () => {
  test('スクロールで収束から爆発・光速トンネルへ移行する', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toHaveAttribute('data-story-overdrive', 'singularity-overdrive', {
      timeout: 8_000,
    });
    await expect(story).toHaveAttribute('data-overdrive-ready', 'true');
    await expect(story).toHaveAttribute('data-overdrive-phase', 'charge');

    const overlay = story.locator('[data-singularity-overdrive]');
    await expect(overlay).toHaveCount(1);
    await expect(overlay.locator('.anime-singularity-ray')).toHaveCount(24);
    await expect(overlay.locator('.anime-singularity-fragment')).toHaveCount(12);
    await expect(overlay.locator('.anime-singularity-title-main')).toHaveText('OVERDRIVE');

    await testInfo.attach('singularity-charge', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight * 0.76, behavior: 'instant' });
    });
    await expect
      .poll(() =>
        story.evaluate((element) =>
          Number(getComputedStyle(element).getPropertyValue('--singularity-progress')),
        ),
      )
      .toBeGreaterThan(0.5);
    await expect(story).toHaveAttribute('data-overdrive-phase', 'burst');
    await page.waitForTimeout(120);
    await testInfo.attach('singularity-burst', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight * 1.07, behavior: 'instant' });
    });
    await expect
      .poll(() =>
        story.evaluate((element) =>
          Number(getComputedStyle(element).getPropertyValue('--singularity-progress')),
        ),
      )
      .toBeGreaterThan(0.82);
    await expect(story).toHaveAttribute('data-overdrive-phase', 'tunnel');
    await page.waitForTimeout(120);
    await testInfo.attach('singularity-tunnel', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
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
