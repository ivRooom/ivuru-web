import { expect, test } from '@playwright/test';

test('Story Runtime smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-anime-scroll-story]')).toBeVisible();
});
