import { expect, test, type Page } from '@playwright/test';

const prepare = async (page: Page, locale = 'ja') => {
  await page.addInitScript(
    ({ locale }) => {
      localStorage.setItem('ivuru-theme', 'dark');
      localStorage.setItem('ivuru-locale', locale);
      sessionStorage.setItem('ivuru-intro-seen', '1');
    },
    { locale },
  );
};

test.describe('site-wide navigation experience', () => {
  test('主要ページ遷移・戻る・遷移後フォーカスが成立する', async ({ page }) => {
    await prepare(page);
    await page.goto('/profile');

    await page.locator('.desktop-nav a[href="/works"]').click();
    await expect(page).toHaveURL(/\/works\/?$/);
    await expect(page.locator('#main-content h1')).toBeFocused();
    await expect(page.locator('body')).toHaveAttribute('data-route-state', 'idle');
    await expect(page.locator('body')).not.toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('.desktop-nav a[href="/works"]')).toHaveAttribute(
      'aria-current',
      'page',
    );

    await page.goBack();
    await expect(page).toHaveURL(/\/profile\/?$/);
    await expect(page.locator('.desktop-nav a[href="/profile"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('アンカーリンクと外部リンク契約を維持する', async ({ page }) => {
    await prepare(page);
    await page.goto('/profile');

    await page.locator('a[href="#favorites"]').click();
    await expect(page).toHaveURL(/\/profile\/?#favorites$/);
    await expect(page.locator('#favorites')).toBeVisible();

    const external = page.locator('a[target="_blank"]').first();
    await expect(external).toHaveAttribute('rel', /noopener/);
    await expect(external).toHaveAttribute('rel', /noreferrer/);
    await expect(external).toHaveAttribute('data-ui-external', 'true');
  });

  test('aria-disabledリンクをTab順と遷移対象から除外する', async ({ page }) => {
    await prepare(page);
    await page.goto('/profile');

    await page.evaluate(() => {
      const disabled = document.createElement('a');
      disabled.href = '/works';
      disabled.textContent = 'Disabled route';
      disabled.setAttribute('aria-disabled', 'true');
      disabled.dataset.testDisabledRoute = 'true';
      document.body.append(disabled);
      document.dispatchEvent(new Event('astro:page-load'));
    });

    const disabled = page.locator('[data-test-disabled-route="true"]');
    await expect(disabled).toHaveAttribute('tabindex', '-1');
    await disabled.click({ force: true });
    await expect(page).toHaveURL(/\/profile\/?$/);
  });

  test('Reduced Motionでは共通モーション時間を無効化する', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await prepare(page);
    await page.goto('/works');

    const cinematicDuration = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--motion-cinematic').trim(),
    );
    expect(cinematicDuration).toBe('1ms');
  });

  test('JavaScript無効でも通常リンクで主要ページへ移動できる', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, locale: 'ja-JP' });
    const page = await context.newPage();

    await page.goto('/works');
    await expect(page.locator('#main-content h1')).toBeVisible();
    await page.locator('.desktop-nav a[href="/profile"]').click();
    await expect(page).toHaveURL(/\/profile\/?$/);
    await expect(page.locator('#main-content h1')).toBeVisible();

    await context.close();
  });
});
