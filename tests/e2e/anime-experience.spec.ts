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

const fetchMarkup = async (page: import('@playwright/test').Page, route: string) => {
  const response = await page.request.get(route);
  expect(response.ok(), route).toBeTruthy();
  return response.text();
};

test.describe('blue signal loading experience', () => {
  test('ships the title sequence without a placeholder mascot and then releases the page', async ({
    page,
  }) => {
    const markup = await fetchMarkup(page, '/');
    expect(markup).toContain('anime-intro-loader');
    expect(markup).toContain('signal-title-loader');
    expect(markup).toContain('signal-loader-core');
    expect(markup).toContain('signal-loader-copy');
    expect(markup).toContain('いゔる。');
    expect(markup).toContain('blue-loader-signal');
    expect(markup).toContain('anime-loader-meter');
    expect(markup).not.toContain('anime-loader-mascot');

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareLocale(page, false);
    await page.goto('/');

    await expect(page.locator('.anime-intro-loader')).toBeHidden({ timeout: 4_000 });
    await expect(page.locator('html')).toHaveAttribute('data-loader-released', 'true');
    await expect(page.locator('body')).not.toHaveClass(/site-loading/);
  });

  test('uses the shortened loader timing after the first visit', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareLocale(page, true);
    await page.goto('/');

    await expect(page.locator('.anime-intro-loader')).toBeHidden({ timeout: 3_500 });
    await expect
      .poll(() => page.evaluate(() => sessionStorage.getItem('ivuru-intro-seen')))
      .toBe('1');
  });

  test('localizes the accessible loading metadata in SSR output', async ({ page }) => {
    for (const [route, label, status] of [
      ['/', 'いゔる。を読み込んでいます', 'ページを読み込んでいます。'],
      ['/en', 'Loading ivuru', 'Loading the page.'],
      ['/ko', 'ivuru를 불러오는 중입니다', '페이지를 불러오는 중입니다.'],
    ]) {
      const markup = await fetchMarkup(page, route);
      expect(markup).toContain(`aria-label="${label}"`);
      expect(markup).toContain(status);
      expect(markup).toContain('role="status"');
      expect(markup).toContain('aria-live="polite"');
      expect(markup).toContain('aria-atomic="true"');
      expect(markup).toContain('role="progressbar"');
      expect(markup).toContain('aria-valuemin="0"');
      expect(markup).toContain('aria-valuemax="100"');
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
    await expect(page.locator('[data-anime-scroll-story]')).toBeVisible();
    await expect(page.locator('.anime-portal-card')).toHaveCount(3);
  });
});
