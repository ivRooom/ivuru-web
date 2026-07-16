import { expect, test } from '@playwright/test';

const profileRoutes = ['/profile', '/en/profile', '/ko/profile'];

for (const route of profileRoutes) {
  test(`${route} uses the X profile identity with a brand fallback`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ivuru-theme', 'dark');
      sessionStorage.setItem('ivuru-intro-seen', '1');
    });
    await page.route('**/api/x-profile', async (route) => {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
    });
    await page.goto(route);

    const identity = page.locator('.profile-editorial-avatar .x-profile-identity');
    await expect(identity).toHaveAttribute('data-x-profile-visual', 'brand');
    await expect(identity.locator('.x-profile-avatar')).toHaveCount(0);
    await expect(identity.locator('.x-profile-avatar-fallback')).toBeVisible();
    await expect(identity.locator('.x-profile-avatar-fallback')).toContainText('IV');
    await expect(identity.locator('.x-profile-source-badge')).toHaveText('BRAND FALLBACK');
  });
}
