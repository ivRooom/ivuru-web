import { expect, test, type Page } from '@playwright/test';

const prepare = async (page: Page) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('ivuru-intro-seen', '1');
    localStorage.setItem('ivuru-locale', 'ja');
    localStorage.setItem('ivuru-theme', 'dark');
  });
};

const waitForLoaderRelease = async (page: Page) => {
  const loader = page.locator('[data-spatial-loader]');
  await expect(page.locator('body')).not.toHaveClass(/site-loading/, { timeout: 8_000 });
  if ((await loader.count()) > 0) {
    await expect(loader).toHaveAttribute('aria-hidden', 'true', { timeout: 8_000 });
    await expect(loader).toHaveAttribute('data-completion-bridged', 'true', {
      timeout: 8_000,
    });
  }
};

const expectSceneRendered = async (page: Page, index: number) => {
  const scene = page.locator(`[data-anime-story-scene="${index}"]`);

  await expect(scene).toHaveAttribute('data-active', 'true');
  await expect(scene).toHaveAttribute('aria-hidden', 'false');
  await expect(scene).not.toHaveAttribute('inert', '');
  await expect
    .poll(() => scene.evaluate((element) => Number(getComputedStyle(element).opacity)))
    .toBeGreaterThan(0.9);
  await expect
    .poll(() => scene.evaluate((element) => getComputedStyle(element).visibility))
    .toBe('visible');

  const box = await scene.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.height ?? 0).toBeGreaterThan(500);
  expect(box?.width ?? 0).toBeGreaterThan(300);

  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toBeInViewport({ ratio: 0.15 });
};

test.describe('iOS WebKit static story', () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ browserName, page }) => {
    test.skip(browserName !== 'webkit', 'iOS WebKit専用の回帰テスト');
    await prepare(page);
  });

  test('ロードアニメーションが進行してからページを解放する', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.removeItem('ivuru-intro-seen'));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const loader = page.locator('[data-spatial-loader]');
    const progress = loader.locator('[role="progressbar"]');
    await expect(loader).toBeVisible();
    await expect(loader).toHaveAttribute('data-loader-evolution', 'reality-reactor');
    await expect(loader).toHaveAttribute('data-loader-animation-ran', 'true', {
      timeout: 8_000,
    });
    await expect(progress).toHaveAttribute('aria-valuenow', '100', { timeout: 8_000 });

    await waitForLoaderRelease(page);
  });

  test('スクロール連動を使わず01・02・03を通常の縦積みで描画する', async ({ page }) => {
    await page.goto('/');
    await waitForLoaderRelease(page);

    const html = page.locator('html');
    const story = page.locator('[data-anime-scroll-story]');

    await expect(html).toHaveAttribute('data-story-render-mode', 'static-stack');
    await expect(story).toHaveAttribute('data-story-render-mode', 'static-stack');
    await expect(story).toHaveAttribute('data-story-scroll-mode', 'static-stack');
    await expect(story).toHaveAttribute('data-story-mode', 'static');
    await expect(story).toHaveAttribute('data-story-director', 'static');
    await expect(story).toHaveAttribute('data-story-runtime', 'ready');
    await expect(story.locator('[data-chapter-gate]')).toHaveCount(0);
    await expect(story.locator('[data-anime-story-scene]')).toHaveCount(3);

    await expectSceneRendered(page, 0);
    await expectSceneRendered(page, 1);
    await expectSceneRendered(page, 2);

    const geometry = await story.evaluate((root) => {
      const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-anime-story-scene]'));
      const rootRect = root.getBoundingClientRect();
      const after = document.querySelector<HTMLElement>('#anime-story-after');
      const afterRect = after?.getBoundingClientRect();
      const sceneRects = scenes.map((scene) => scene.getBoundingClientRect());
      const sumSceneHeights = sceneRects.reduce((total, rect) => total + rect.height, 0);

      return {
        rootHeight: rootRect.height,
        sumSceneHeights,
        sceneTops: sceneRects.map((rect) => rect.top + window.scrollY),
        afterGap: afterRect ? afterRect.top - rootRect.bottom : Number.POSITIVE_INFINITY,
      };
    });

    expect(geometry.sceneTops[1]).toBeGreaterThan(geometry.sceneTops[0]);
    expect(geometry.sceneTops[2]).toBeGreaterThan(geometry.sceneTops[1]);
    expect(Math.abs(geometry.rootHeight - geometry.sumSceneHeights)).toBeLessThan(180);
    expect(Math.abs(geometry.afterGap)).toBeLessThan(80);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      ),
    ).toBe(false);
  });

  test('アドレスバー相当の高さ変化と画面回転後も静的3章を維持する', async ({ page }) => {
    await page.goto('/');
    await waitForLoaderRelease(page);

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toHaveAttribute('data-story-render-mode', 'static-stack');

    await page.setViewportSize({ width: 390, height: 720 });
    await page.waitForTimeout(500);
    await expect(story).toHaveAttribute('data-story-scroll-mode', 'static-stack');
    await expect(story.locator('[data-anime-story-scene][aria-hidden="false"]')).toHaveCount(3);

    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(700);
    await expect(story).toHaveAttribute('data-story-render-mode', 'static-stack');
    await expect(story.locator('[data-anime-story-scene][data-active="true"]')).toHaveCount(3);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(700);
    await expect(story).toHaveAttribute('data-story-mode', 'static');
    await expect(story.locator('[data-anime-story-scene][aria-hidden="false"]')).toHaveCount(3);

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      ),
    ).toBe(false);
  });
});
