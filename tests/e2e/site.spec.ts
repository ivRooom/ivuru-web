import { expect, test } from '@playwright/test';

test('core routes and language variants render', async ({ page }) => {
  for (const route of [
    '/',
    '/profile',
    '/works',
    '/portfolio',
    '/blog',
    '/privacy',
    '/terms',
    '/en',
    '/ko',
  ]) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBeTruthy();
    await expect(page.locator('main')).toBeVisible();
  }
});

test('world loader appears on access and clears safely', async ({ page }) => {
  await page.goto('/');
  const loader = page.locator('.world-loader');
  await expect(loader).toBeVisible();
  await expect(loader).toBeHidden({ timeout: 3000 });
  await expect(page.getByRole('heading', { name: /いゔる。/ }).first()).toBeVisible();

  await page.reload();
  await expect(page.locator('.world-loader')).toBeVisible();
  await expect(page.locator('.world-loader')).toBeHidden({ timeout: 2000 });
});

test('custom animated 404 renders recovery routes', async ({ page }) => {
  const response = await page.goto('/not-a-world');
  expect(response?.status()).toBe(404);
  await expect(page.locator('.error-code')).toContainText('404');
  await expect(page.getByRole('heading', { name: 'ワールド接続が失われました' })).toBeVisible();
  await expect(page.getByRole('link', { name: '作品を見る' })).toHaveAttribute('href', '/works');
});

test('theme selection persists', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.world-loader')).toBeHidden({ timeout: 3000 });
  const button = page.getByRole('button', { name: /^Theme:/ });
  await button.click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('ivuru-theme'))).toBe('light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('mobile menu remains viewport-bound and reachable at mobile and tablet widths', async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 720 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/works');
    await expect(page.locator('.world-loader')).toBeHidden({ timeout: 3000 });

    const trigger = page.getByRole('button', { name: 'Open menu' });
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Navigation' });
    const layer = page.locator('.mobile-menu-layer');
    const panel = page.locator('.mobile-menu-panel');
    const links = panel.locator('nav a');

    await expect(dialog).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/menu-open/);
    await expect(layer).toHaveCSS('position', 'fixed');
    await expect(links).toHaveCount(5);

    const layerBox = await layer.boundingBox();
    const panelBox = await panel.boundingBox();
    expect(layerBox?.width).toBeGreaterThanOrEqual(viewport.width - 1);
    expect(layerBox?.height).toBeGreaterThanOrEqual(viewport.height - 1);
    expect(panelBox?.height).toBeGreaterThanOrEqual(viewport.height - 24);
    expect((panelBox?.y ?? -1) >= 0).toBeTruthy();
    expect((panelBox?.y ?? 0) + (panelBox?.height ?? 0)).toBeLessThanOrEqual(viewport.height + 1);

    await links.last().scrollIntoViewIfNeeded();
    await expect(links.last()).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close menu' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.locator('body')).not.toHaveClass(/menu-open/);
  }
});

test('menu closes when viewport switches to desktop navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/');
  await expect(page.locator('.world-loader')).toBeHidden({ timeout: 3000 });
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/menu-open/);
});

test('detail routes keep their parent navigation active', async ({ page }) => {
  await page.goto('/works/ivrm-community');
  await expect(page.locator('.desktop-nav a[href="/works"]')).toHaveAttribute('aria-current', 'page');
});

test('works filter and blog search work', async ({ page }) => {
  await page.goto('/works');
  await page.getByRole('button', { name: 'Community', exact: true }).click();
  await expect(page.locator('[data-work-card]:visible')).toHaveCount(1);
  await page.goto('/blog');
  await page.getByPlaceholder('記事を検索').fill('not-found-query');
  await expect(page.getByText('一致する項目がありません。')).toBeVisible();
});

test('reduced motion keeps content available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.world-loader')).toBeHidden({ timeout: 1000 });
  await expect(page.getByRole('heading', { name: /いゔる。/ }).first()).toBeVisible();
  await expect(page.getByText('Featured Works')).toBeVisible();
});
