import { test } from '@playwright/test';

test('profile overflow diagnostics', async ({ page }) => {
  for (const viewport of [
    { width: 1365, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/profile');
    await page.locator('.world-loader').waitFor({ state: 'hidden', timeout: 3000 });
    const result = await page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      const offenders = [...document.querySelectorAll<HTMLElement>('body *')]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            className: element.className?.toString().slice(0, 120) ?? '',
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        })
        .filter((item) => item.width > 0 && (item.left < -1 || item.right > width + 1))
        .slice(0, 20);
      return {
        clientWidth: width,
        scrollWidth: document.documentElement.scrollWidth,
        offenders,
      };
    });
    console.log(`PROFILE_OVERFLOW ${viewport.width}x${viewport.height} ${JSON.stringify(result)}`);
  }
});

test('mobile panel position diagnostics', async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 720 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/works');
    await page.locator('.world-loader').waitFor({ state: 'hidden', timeout: 3000 });
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.waitForTimeout(500);
    const box = await page.locator('.mobile-menu-panel').boundingBox();
    console.log(`MENU_BOX ${viewport.width}x${viewport.height} ${JSON.stringify(box)}`);
    await page.keyboard.press('Escape');
  }
});
