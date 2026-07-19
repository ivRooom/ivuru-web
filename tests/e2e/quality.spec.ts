import { expect, test } from '@playwright/test';

test('Home V2 renders four focused destinations in all locales', async ({ page }) => {
  for (const route of ['/', '/en', '/ko']) {
    await page.goto(route);
    await expect(page.locator('.world-loader')).toBeHidden({ timeout: 4_000 });
    const portals = page.locator('.home-portals');
    await portals.scrollIntoViewIfNeeded();
    await expect(portals).toBeVisible();
    await expect(portals.locator('.home-portal-link')).toHaveCount(4);
    await expect(portals.locator('[data-analytics-event="home_portal_open"]')).toHaveCount(4);
  }
});

test('analytics bridge emits one page view and an allowlisted Home V2 event without PII', async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as unknown as { capturedAnalytics: unknown[] }).capturedAnalytics = [];
    window.addEventListener('ivuru:analytics', (event) => {
      (window as unknown as { capturedAnalytics: unknown[] }).capturedAnalytics.push(
        (event as CustomEvent).detail,
      );
    });
  });

  await page.goto('/');
  await expect(page.locator('.world-loader')).toBeHidden({ timeout: 4_000 });
  const portals = page.locator('.home-portals');
  await portals.scrollIntoViewIfNeeded();
  const worksPortal = portals.locator('a[href="/works"]');
  await expect(worksPortal).toBeVisible();
  await Promise.all([page.waitForURL(/\/works\/?$/, { timeout: 10_000 }), worksPortal.click()]);

  const events = await page.evaluate(
    () =>
      (window as unknown as { capturedAnalytics: Array<Record<string, unknown>> })
        .capturedAnalytics,
  );
  expect(events.some((event) => event.name === 'page_view')).toBeTruthy();
  expect(
    events.some((event) => event.name === 'home_portal_open' && event.target === 'works'),
  ).toBeTruthy();
  expect(JSON.stringify(events)).not.toContain('email');
  expect(JSON.stringify(events)).not.toContain('message');
});

test('contact confirmation configures Turnstile action', async ({ page }) => {
  await page.addInitScript(() => {
    window.turnstile = {
      render: (_target: HTMLElement, options: Record<string, unknown>) => {
        (window as unknown as { turnstileAction?: string }).turnstileAction = String(
          options.action ?? '',
        );
        const callback = options.callback as ((token: string) => void) | undefined;
        callback?.('test-token');
        return 'widget-id';
      },
      reset: () => undefined,
      remove: () => undefined,
    };
  });
  await page.route('**/api/contact', (request) =>
    request.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ready: true,
        turnstileSiteKey: 'test-key',
        recipient: 'contact.ivuru@ivrm.jp',
        discordEnabled: false,
      }),
    }),
  );
  await page.goto('/contact');
  await page.getByLabel('01 / お名前').fill('ivuru');
  await page.getByLabel('02 / メールアドレス').fill('test@example.com');
  await page.getByLabel('04 / 件名').fill('テスト問い合わせ');
  await page
    .getByLabel('05 / お問い合わせ内容')
    .fill('これはお問い合わせ送信確認用の十分な長さを持つテスト本文です。');
  await page.getByRole('button', { name: '送信内容を確認' }).click();
  const turnstileAction = await page.evaluate(
    () => (window as unknown as { turnstileAction?: string }).turnstileAction ?? '',
  );
  expect(turnstileAction).toBe('contact_submit');
});
