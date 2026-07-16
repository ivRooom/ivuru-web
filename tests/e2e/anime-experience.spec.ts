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

test.describe('anime loading experience', () => {
  test('shows the original mascot and finishes after the page is ready', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareLocale(page, false);
    await page.goto('/');

    const loader = page.locator('.anime-intro-loader');
    await expect(loader).toBeVisible();
    await expect(loader.locator('.anime-loader-mascot img')).toHaveAttribute(
      'src',
      '/assets/visuals/anime/ivuru-loader-mascot.svg',
    );
    await expect(loader.locator('.anime-loader-meter')).toBeVisible();
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

  test('reduced motion completes quickly and leaves content accessible', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await prepareLocale(page, false);
    await page.goto('/');

    await expect(page.locator('.anime-intro-loader')).toBeHidden({ timeout: 1_000 });
    await expect(page.locator('[data-anime-hero]')).toBeVisible();
    await expect(page.locator('.anime-portal-card')).toHaveCount(3);
  });
});
