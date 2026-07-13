import { expect, test } from '@playwright/test';

test('profile passport stays single-column between 861px and 1040px', async ({ page }) => {
  for (const width of [900, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/profile');
    await expect(page.locator('.world-loader')).toBeHidden({ timeout: 3000 });

    const passport = page.locator('.profile-passport');
    const header = passport.locator('.character-sheet-bar');
    const avatar = passport.locator('.profile-avatar-stage');
    const data = passport.locator('.character-data');

    await expect(passport).toBeVisible();

    const [passportBox, headerBox, avatarBox, dataBox] = await Promise.all([
      passport.boundingBox(),
      header.boundingBox(),
      avatar.boundingBox(),
      data.boundingBox(),
    ]);

    expect(passportBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    expect(avatarBox).not.toBeNull();
    expect(dataBox).not.toBeNull();

    expect(Math.abs((headerBox?.width ?? 0) - (passportBox?.width ?? 0))).toBeLessThanOrEqual(2);
    expect(avatarBox?.y ?? 0).toBeGreaterThanOrEqual((headerBox?.y ?? 0) + (headerBox?.height ?? 0) - 1);
    expect(dataBox?.y ?? 0).toBeGreaterThanOrEqual((avatarBox?.y ?? 0) + (avatarBox?.height ?? 0) - 1);

    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
  }
});
