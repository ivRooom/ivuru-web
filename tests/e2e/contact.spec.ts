import { expect, test } from '@playwright/test';

for (const [route, heading] of [
  ['/contact', 'お問い合わせ'],
  ['/en/contact', 'Contact'],
  ['/ko/contact', '문의하기'],
] as const) {
  test(`${route} renders the contact terminal`, async ({ page }) => {
    await page.route('**/api/contact', (request) => request.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ready: false, turnstileSiteKey: null, recipient: 'contact@ivrm.jp', discordEnabled: false }),
    }));
    const response = await page.goto(route);
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await expect(page.locator('.contact-terminal')).toBeVisible();
    await expect(page.getByRole('link', { name: /メール|email|이메일/i })).toHaveAttribute('href', 'mailto:contact@ivrm.jp');
    await expect(page.locator('html')).toHaveAttribute('data-chapter', '05');
  });
}

test('footer exposes Contact without adding it to the main navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.world-loader')).toBeHidden({ timeout: 3000 });
  await expect(page.locator('.desktop-nav a[href="/contact"]')).toHaveCount(0);
  await expect(page.locator('footer a[href="/contact"]').first()).toBeVisible();
});
