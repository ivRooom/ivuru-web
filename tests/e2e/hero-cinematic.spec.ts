import { expect, test, type Page } from '@playwright/test';

const prepareHome = async (
  page: Page,
  connection: { saveData: boolean; effectiveType: string },
) => {
  await page.addInitScript(
    ({ connection }) => {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        configurable: true,
        value: 8,
      });
      Object.defineProperty(navigator, 'connection', {
        configurable: true,
        value: {
          ...connection,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        },
      });
      localStorage.setItem('ivuru-theme', 'dark');
      localStorage.setItem('ivuru-locale', 'ja');
      sessionStorage.setItem('ivuru-intro-seen', '1');
    },
    { connection },
  );
};

test.describe('cinematic home hero', () => {
  test('loads local movie sources and exposes a pause control', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page, { saveData: false, effectiveType: '4g' });
    await page.goto('/');

    const media = page.locator('[data-hero-cinematic]');
    const video = page.locator('[data-hero-video]');
    const toggle = page.getByRole('button', { name: '背景ムービーを一時停止' });

    await expect(media).toBeVisible();
    await expect(video).toHaveCount(1);
    await expect(video).toHaveAttribute('poster', '/assets/video/hero-anime-op-poster.webp');
    await expect(video.locator('source[type="video/webm"]')).toHaveAttribute(
      'src',
      '/assets/video/hero-anime-op-loop.webm',
    );
    await expect(video.locator('source[type="video/mp4"]')).toHaveAttribute(
      'src',
      '/assets/video/hero-anime-op-loop.mp4',
    );
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    const properties = await video.evaluate((element) => {
      const node = element as HTMLVideoElement;
      return { muted: node.muted, loop: node.loop, playsInline: node.playsInline };
    });
    expect(properties).toEqual({ muted: true, loop: true, playsInline: true });

    await toggle.click();
    await expect(media).toHaveAttribute('data-state', 'paused');
    await expect(page.getByRole('button', { name: '背景ムービーを再生' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('does not create a video request when Data Saver is enabled', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    let videoRequests = 0;
    page.on('request', (request) => {
      if (/hero-anime-op-loop\.(webm|mp4)$/.test(new URL(request.url()).pathname)) {
        videoRequests += 1;
      }
    });
    await prepareHome(page, { saveData: true, effectiveType: '4g' });
    await page.goto('/');

    await expect(page.locator('[data-hero-cinematic]')).toHaveAttribute('data-state', 'poster');
    await expect(page.locator('[data-hero-video]')).toHaveCount(0);
    expect(videoRequests).toBe(0);
  });
});

test('uses the static poster for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await prepareHome(page, { saveData: false, effectiveType: '4g' });
  await page.goto('/');

  await expect(page.locator('[data-hero-cinematic]')).toHaveAttribute('data-state', 'poster');
  await expect(page.locator('[data-hero-video]')).toHaveCount(0);
  await expect(page.locator('.hero-motion-toggle')).toHaveCount(0);
});