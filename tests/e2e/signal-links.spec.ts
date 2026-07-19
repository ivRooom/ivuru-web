import { expect, test } from '@playwright/test';

test('Spotify remains deferred on Profile while Home V2 stays focused', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.world-loader')).toBeHidden({ timeout: 4_000 });
  await expect(page.locator('iframe[src*="open.spotify.com"]')).toHaveCount(0);
  const portals = page.locator('.home-portals');
  await portals.scrollIntoViewIfNeeded();
  await expect(portals.locator('.home-portal-link')).toHaveCount(4);
  await expect(portals.locator('a[href="/profile"]')).toBeVisible();

  await page.goto('/profile#favorites');
  const favorites = page.locator('#favorites');
  await expect(favorites).toBeVisible();
  await expect(favorites.locator('iframe')).toHaveCount(0);
  const consent = favorites.locator('[data-spotify-loaded="false"]');
  await expect(consent).toBeVisible();
  await consent.getByRole('button').click();
  await expect(page.locator('iframe[src*="open.spotify.com/embed/playlist"]')).toHaveCount(1);
  await expect(favorites.locator('[data-spotify-loaded="true"]')).toBeVisible();
});
