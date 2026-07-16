import { expect, test } from '@playwright/test';

const profileRoutes = ['/profile', '/en/profile', '/ko/profile'];

for (const route of profileRoutes) {
  test(`${route} uses the local blue profile artwork`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ivuru-theme', 'dark');
      sessionStorage.setItem('ivuru-intro-seen', '1');
    });
    await page.goto(route);

    const avatar = page.locator('.profile-editorial-avatar img');
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveAttribute(
      'src',
      '/assets/visuals/blue-anime/ivuru-profile-blue.svg',
    );
    await expect
      .poll(() =>
        avatar.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true);
  });
}
