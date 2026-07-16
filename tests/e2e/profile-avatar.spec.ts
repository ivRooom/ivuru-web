import { expect, test } from '@playwright/test';

const profileRoutes = ['/profile', '/en/profile', '/ko/profile'];

for (const route of profileRoutes) {
  test(`${route} uses the X profile identity with a local PNG fallback`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ivuru-theme', 'dark');
      sessionStorage.setItem('ivuru-intro-seen', '1');
    });
    await page.route('**/api/x-profile', async (route) => {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
    });
    await page.goto(route);

    const avatar = page.locator('.profile-editorial-avatar .x-profile-avatar');
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveAttribute('src', '/assets/images/ivuru-profile-fallback.png');
    await expect(page.locator('.profile-editorial-avatar .x-profile-source-badge')).toHaveText(
      'LOCAL FALLBACK',
    );
    await expect
      .poll(() =>
        avatar.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true);
  });
}
