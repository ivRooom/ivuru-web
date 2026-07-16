import { expect, test } from '@playwright/test';

const transparentPixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+q4n7WQAAAABJRU5ErkJggg==',
  'base64',
);

const prepareProfile = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'dark');
    localStorage.setItem('ivuru-locale', 'ja');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

test.describe('X profile identity', () => {
  test('X APIのプロフィールをヒーローとパスポートへ反映する', async ({ page }) => {
    await prepareProfile(page);
    await page.route('https://pbs.twimg.com/profile_images/test_400x400.jpg', async (route) => {
      await route.fulfill({ status: 200, contentType: 'image/png', body: transparentPixel });
    });
    await page.route('**/api/x-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          source: 'x',
          username: 'ivuruGG',
          name: 'いゔる。 from X',
          description: 'Developer / Gamer / Community',
          profileImageUrl: 'https://pbs.twimg.com/profile_images/test_400x400.jpg',
          profileBannerUrl: null,
          profileUrl: 'https://x.com/ivuruGG',
          verified: false,
          fetchedAt: new Date().toISOString(),
        }),
      });
    });

    await page.goto('/profile');

    const identities = page.locator('.x-profile-identity[data-x-profile-source="x"]');
    await expect(identities).toHaveCount(2);
    await expect(identities.first().locator('.x-profile-source-badge')).toHaveText('LIVE FROM X');
    await expect(identities.first().locator('.x-profile-avatar')).toHaveAttribute(
      'src',
      'https://pbs.twimg.com/profile_images/test_400x400.jpg',
    );
    await expect(page.getByText('いゔる。 from X')).toBeVisible();
  });

  test('API障害時はローカルPNGへフォールバックする', async ({ page }) => {
    await prepareProfile(page);
    await page.route('**/api/x-profile', async (route) => {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/profile');

    const identities = page.locator('.x-profile-identity[data-x-profile-source="fallback"]');
    await expect(identities).toHaveCount(2);
    await expect(identities.first().locator('.x-profile-source-badge')).toHaveText(
      'LOCAL FALLBACK',
    );
    await expect(identities.first().locator('.x-profile-avatar')).toHaveAttribute(
      'src',
      '/assets/images/ivuru-profile-fallback.png',
    );
  });
});
