import { expect, test } from '@playwright/test';

for (const [route, heading] of [
  ['/contact', 'お問い合わせ'],
  ['/en/contact', 'Contact'],
  ['/ko/contact', '문의하기'],
] as const) {
  test(`${route} renders the contact terminal`, async ({ page }) => {
    await page.route('**/api/contact', (request) =>
      request.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ready: false,
          turnstileSiteKey: null,
          recipient: 'contact@ivrm.jp',
          discordEnabled: false,
        }),
      }),
    );
    const response = await page.goto(route);
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await expect(page.locator('.contact-terminal')).toBeVisible();
    await expect(page.locator('.contact-terminal-unavailable a')).toHaveAttribute(
      'href',
      'mailto:contact@ivrm.jp',
    );
    await expect(page.locator('html')).toHaveAttribute('data-chapter', '05');
  });
}

test('turnstile initializes after the confirmation panel mounts', async ({ page }) => {
  await page.addInitScript(() => {
    window.turnstile = {
      render: (_target: HTMLElement, options: Record<string, unknown>) => {
        const callback = options.callback as ((token: string) => void) | undefined;
        callback?.('test-token');
        return 'widget-id';
      },
      reset: () => undefined,
      remove: () => undefined,
    };
  });
  let releaseConfig!: () => void;
  const configGate = new Promise<void>((resolve) => {
    releaseConfig = resolve;
  });
  await page.route('**/api/contact', async (request) => {
    await configGate;
    await request.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ready: true,
        turnstileSiteKey: 'test-site-key',
        recipient: 'contact@ivrm.jp',
        discordEnabled: true,
      }),
    });
  });

  await page.goto('/contact');
  const name = page.getByLabel('01 / お名前');
  await expect(name).toBeDisabled();
  releaseConfig();
  await expect(name).toBeEnabled();
  await name.fill('ivuru');
  await page.getByLabel('02 / メールアドレス').fill('test@example.com');
  await page.getByLabel('04 / 件名').fill('テスト問い合わせ');
  await page
    .getByLabel('05 / お問い合わせ内容')
    .fill('これはお問い合わせ送信確認用の十分な長さを持つテスト本文です。');
  const confirmButton = page.getByRole('button', { name: '送信内容を確認' });
  await expect(confirmButton).toBeEnabled();
  await confirmButton.click();

  await expect(page.getByText('REVIEW_PAYLOAD')).toBeVisible();
  await expect(page.getByRole('button', { name: '送信する' })).toBeEnabled();
});

test('header and footer expose Contact', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.world-loader')).toBeHidden({ timeout: 3000 });
  await expect(page.locator('.desktop-nav a[href="/contact"]')).toBeVisible();
  await expect(page.locator('footer a[href="/contact"]').first()).toBeVisible();
});
