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
    '/customer-harassment',
    '/en',
    '/en/customer-harassment',
    '/ko',
    '/ko/customer-harassment',
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

test('chapter cut shows the destination chapter without replaying the intro loader', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.world-loader')).toBeHidden({ timeout: 3000 });
  const chapterCut = page.locator('.chapter-cut');
  await page.locator('.desktop-nav a[href="/profile"]').click();
  await expect(chapterCut).toHaveAttribute('data-active', 'true');
  await expect(chapterCut).toContainText('CHARACTER PROFILE');
  await expect(page).toHaveURL(/\/profile\/?$/);
  await expect(page.locator('.character-sheet')).toBeVisible();
  await expect(page.locator('.world-loader')).toBeHidden();
  await expect(chapterCut).toHaveAttribute('data-active', 'false', { timeout: 2000 });
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

test('mobile menu remains viewport-bound and reachable at mobile and tablet widths', async ({ page }) => {
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
    await expect(panel.locator('nav a[href$="/contact"]')).toBeVisible();
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

test('header stays visible while scrolling down', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 768 });
  await page.goto('/profile');
  await expect(page.locator('.world-loader')).toBeHidden({ timeout: 3000 });
  const header = page.locator('[data-site-header]');
  await page.evaluate(() => window.scrollTo(0, 1200));
  await expect(header).toHaveClass(/scrolled/);
  await expect(header).not.toHaveClass(/hidden/);
  const box = await header.boundingBox();
  expect(box?.y).toBeGreaterThanOrEqual(0);
});

test('profile passport keeps image and data within the character sheet', async ({ page }) => {
  for (const viewport of [
    { width: 1365, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/profile');
    await expect(page.locator('.world-loader')).toBeHidden({ timeout: 3000 });
    const sheet = page.locator('.profile-passport');
    const portrait = page.locator('.profile-avatar-stage');
    const data = page.locator('.profile-passport .character-data');
    await sheet.scrollIntoViewIfNeeded();
    const sheetBox = await sheet.boundingBox();
    const portraitBox = await portrait.boundingBox();
    const dataBox = await data.boundingBox();
    expect(sheetBox).not.toBeNull();
    expect(portraitBox).not.toBeNull();
    expect(dataBox).not.toBeNull();
    expect((portraitBox?.x ?? 0) + (portraitBox?.width ?? 0)).toBeLessThanOrEqual((sheetBox?.x ?? 0) + (sheetBox?.width ?? 0) + 1);
    expect((dataBox?.x ?? 0) + (dataBox?.width ?? 0)).toBeLessThanOrEqual((sheetBox?.x ?? 0) + (sheetBox?.width ?? 0) + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  }
});

test('detail routes keep their parent navigation active and shared transition names', async ({ page }) => {
  await page.goto('/works/ivrm-community');
  await expect(page.locator('.desktop-nav a[href="/works"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.mission-briefing-hero')).toBeVisible();
});

test('works filter and blog search work', async ({ page }) => {
  await page.goto('/works');
  await page.getByRole('button', { name: 'Community', exact: true }).click();
  await expect(page.locator('[data-work-card]:visible')).toHaveCount(1);
  await page.goto('/blog');
  await page.getByPlaceholder('記録を検索').fill('not-found-query');
  await expect(page.getByText('一致する項目がありません。')).toBeVisible();
});

test('portfolio is removed from main navigation but reachable from works and footer', async ({ page }) => {
  await page.goto('/works');
  await expect(page.locator('.desktop-nav a[href="/portfolio"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Developer Consoleを開く/ })).toHaveAttribute('href', '/portfolio');
  await expect(page.locator('footer a[href="/portfolio"]').first()).toBeVisible();
  await expect(page.locator('.developer-stack-matrix')).toBeVisible();
});

test('developer portfolio stays within the viewport and links to Contact', async ({ page }) => {
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
    { width: 768, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/portfolio');
    await expect(page.locator('.world-loader')).toBeHidden({ timeout: 3000 });
    await expect(page.locator('.console-module-grid article')).toHaveCount(6);
    await expect(page.locator('.console-contact-cta a[href="/contact"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  }
});

test('profile renders X avatar, social nodes, contact email, and game clip archive', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.locator('.profile-avatar-frame img')).toHaveAttribute('src', /unavatar\.io\/x\/ivuruGG/);
  await expect(page.locator('.social-node-grid a[href="https://x.com/ivuruGG"]')).toBeVisible();
  await expect(page.locator('.social-node-grid a[href="mailto:contact@ivrm.jp"]')).toBeVisible();
  await expect(page.locator('.game-clip-archive')).toBeVisible();
  await expect(page.getByText('NO REPLAY DATA')).toBeVisible();
});

test('social embeds require an explicit action before third-party scripts load', async ({ page }) => {
  await page.route('https://platform.x.com/**', (route) => route.abort());
  await page.route('https://platform.twitter.com/**', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('.world-loader')).toBeHidden({ timeout: 3000 });
  const socialDock = page.locator('.social-dock');
  await socialDock.scrollIntoViewIfNeeded();
  await expect(page.locator('#x-widgets-script')).toHaveCount(0);
  await expect(page.locator('#instagram-embed-script')).toHaveCount(0);
  const loadX = page.getByRole('button', { name: 'Xタイムラインを読み込む' });
  await expect(loadX).toBeVisible();
  await loadX.click();
  await expect(page.locator('#x-widgets-script')).toHaveCount(1);
  await expect(page.locator('a.twitter-timeline')).toHaveAttribute('href', /x\.com\/ivuruGG/);
});

test('brand OGP and Twitter fallback metadata are present', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute('content', 'いゔる。 / ivuru');
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute('content', /\/assets\/og\/ivuru-brand-og\.svg$/);
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', /\/assets\/og\/og-background\.png$/);
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', /いゔる。 \/ ivuru/);
});

test('customer harassment policy preserves legitimate feedback and response measures', async ({ page }) => {
  await page.goto('/customer-harassment');
  await expect(page.getByRole('heading', { name: 'カスタマーハラスメント等への対応方針' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '正当なご意見・ご要望について' })).toBeVisible();
  await expect(page.getByText(/警察、弁護士/)).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-chapter', '90');
});

test('scroll position updates the world time state', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.locator('.world-loader')).toBeHidden({ timeout: 3000 });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator('html')).toHaveAttribute('data-world-time', 'night');
});

test('reduced motion keeps content available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.world-loader')).toBeHidden({ timeout: 1000 });
  await expect(page.getByRole('heading', { name: /いゔる。/ }).first()).toBeVisible();
  await expect(page.getByText('Featured Works')).toBeVisible();
});
