import { expect, test } from '@playwright/test';

const prepareLocale = async (page: import('@playwright/test').Page, seen = false) => {
  await page.addInitScript(
    ({ seen }) => {
      localStorage.setItem('ivuru-locale', 'ja');
      localStorage.setItem('ivuru-theme', 'light');
      if (seen) sessionStorage.setItem('ivuru-intro-seen', '1');
      else sessionStorage.removeItem('ivuru-intro-seen');
    },
    { seen },
  );
};

test.describe('blue signal loading experience', () => {
  test('shows the title sequence without a placeholder mascot and then releases the page', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareLocale(page, false);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const loader = page.locator('.anime-intro-loader');
    await expect(loader).toBeVisible();
    await expect(loader).toHaveClass(/signal-title-loader/);
    await expect(loader.locator('.anime-loader-mascot')).toHaveCount(0);
    await expect(loader.locator('.signal-loader-core')).toBeVisible();
    await expect(loader.locator('.signal-loader-copy strong')).toHaveText('いゔる。');
    await expect(loader.locator('.blue-loader-signal')).toBeVisible();
    await expect(loader.locator('.anime-loader-meter')).toBeVisible();

    await page.waitForLoadState('load');
    await expect(loader).toBeHidden({ timeout: 4_000 });
    await expect(page.locator('body')).not.toHaveClass(/site-loading/);
  });

  test('uses the compact loader after the first visit', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareLocale(page, true);
    await page.goto('/');

    const loader = page.locator('.anime-intro-loader');
    await expect(loader).toHaveClass(/is-compact/);
    await expect(loader).toBeHidden({ timeout: 2_000 });
  });

  test('localizes the accessible loading status', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      localStorage.setItem('ivuru-theme', 'light');
      sessionStorage.removeItem('ivuru-intro-seen');
    });

    for (const [route, label, status] of [
      ['/', 'いゔる。を読み込んでいます', 'ページを読み込んでいます。'],
      ['/en', 'Loading ivuru', 'Loading the page.'],
      ['/ko', 'ivuru를 불러오는 중입니다', '페이지를 불러오는 중입니다.'],
    ]) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });

      const statusRegion = page.getByRole('status');
      await expect(statusRegion).toHaveCount(1);
      await expect(statusRegion).toHaveText(status);
      await expect(statusRegion).toHaveAttribute('aria-live', 'polite');
      await expect(statusRegion).toHaveAttribute('aria-atomic', 'true');

      const progressbar = page.getByRole('progressbar', { name: label });
      await expect(progressbar).toBeVisible();
      await expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      await expect(progressbar).toHaveAttribute('aria-valuemax', '100');
      await expect(progressbar).toHaveAttribute('aria-valuenow', /\d+/);
    }
  });

  test('keeps the main content reachable when JavaScript is disabled', async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      baseURL: 'http://127.0.0.1:4321',
    });
    const page = await context.newPage();

    try {
      await page.goto('/');
      await expect(page.locator('.anime-intro-loader')).toBeHidden();
      const main = page.locator('#main-content');
      await expect(main).toBeVisible();
      await expect(main.getByRole('link', { name: /Works|制作|작업/i }).first()).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('reduced motion completes quickly and leaves content accessible', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await prepareLocale(page, false);
    await page.goto('/');

    await expect(page.locator('.anime-intro-loader')).toBeHidden({ timeout: 1_000 });
    await expect(page.locator('[data-anime-hero]')).toBeVisible();
    await expect(page.locator('.anime-portal-card')).toHaveCount(3);
  });
});
