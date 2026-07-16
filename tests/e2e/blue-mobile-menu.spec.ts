import { expect, test } from '@playwright/test';

const prepare = async (page: import('@playwright/test').Page, locale = 'ja') => {
  await page.addInitScript(
    ({ locale }) => {
      localStorage.setItem('ivuru-theme', 'dark');
      localStorage.setItem('ivuru-locale', locale);
      sessionStorage.setItem('ivuru-intro-seen', '1');
    },
    { locale },
  );
};

test.describe('blue mobile navigation', () => {
  test('opens with the blue scene and closes with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepare(page);
    await page.goto('/');
    await expect(page.locator('.anime-intro-loader')).toBeHidden({ timeout: 2_000 });

    const trigger = page.getByRole('button', { name: 'メニューを開く' });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'モバイルナビゲーション' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/menu-open/);
    await expect(dialog.locator('.mobile-menu-visual img')).toHaveAttribute(
      'src',
      '/assets/images/ivuru-hero-character.png',
    );
    await expect(dialog.locator('nav a')).toHaveCount(6);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('body')).not.toHaveClass(/menu-open/);
    await expect(trigger).toBeFocused();
  });

  test('keeps focus inside the dialog while open', async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 900 });
    await prepare(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'メニューを開く' }).click();

    const dialog = page.getByRole('dialog', { name: 'モバイルナビゲーション' });
    const close = dialog.getByRole('button', { name: 'メニューを閉じる' });
    await expect(close).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(dialog.getByRole('link', { name: /X \/ @/ })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
  });

  test('localizes controls and respects reduced motion', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await prepare(page, 'en');
    await page.goto('/en');

    const trigger = page.getByRole('button', { name: 'Open menu' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Mobile navigation' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close menu' })).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Profile' })).toBeVisible();
  });
});
