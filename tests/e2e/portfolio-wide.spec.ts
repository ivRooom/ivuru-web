import { expect, test } from '@playwright/test';

test('portfolio CTA remains visible on wide screens', async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.goto('/portfolio');
  await expect(page.locator('.world-loader')).toBeHidden({ timeout: 3000 });

  const cta = page.locator('.console-contact-cta');
  const link = cta.locator('a[href="/contact"]');
  await cta.scrollIntoViewIfNeeded();
  await expect(cta).toBeVisible();
  await expect(link).toBeVisible();

  const ctaBox = await cta.boundingBox();
  const linkBox = await link.boundingBox();
  expect(ctaBox).not.toBeNull();
  expect(linkBox).not.toBeNull();
  expect((linkBox?.x ?? 0) >= (ctaBox?.x ?? 0)).toBeTruthy();
  expect((linkBox?.x ?? 0) + (linkBox?.width ?? 0)).toBeLessThanOrEqual(
    (ctaBox?.x ?? 0) + (ctaBox?.width ?? 0) + 1,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
});
