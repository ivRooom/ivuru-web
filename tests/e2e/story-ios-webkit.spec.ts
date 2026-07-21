import { expect, test, type Page } from '@playwright/test';

const prepare = async (page: Page) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('ivuru-intro-seen', '1');
    localStorage.setItem('ivuru-locale', 'ja');
    localStorage.setItem('ivuru-theme', 'dark');
  });
};

const scrollTo = async (page: Page, top: number) => {
  const expectedTop = Math.round(top);
  await page.evaluate((targetTop) => window.scrollTo(0, Number(targetTop)), expectedTop);
  await expect
    .poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 5_000 })
    .toBe(expectedTop);
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
};

const revealStory = async (page: Page) => {
  const top = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
    if (!root) throw new Error('story root is missing');
    return Math.max(0, root.getBoundingClientRect().top + window.scrollY + 1);
  });
  await scrollTo(page, top);
};

const scrollToProgress = async (page: Page, progress: number) => {
  const top = await page.locator('[data-anime-scroll-story]').evaluate((root, target) => {
    const start = Number((root as HTMLElement).dataset.storyScrollStart);
    const end = Number((root as HTMLElement).dataset.storyScrollEnd);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      throw new Error(`invalid story range: ${start} - ${end}`);
    }
    return start + (end - start) * Number(target);
  }, progress);
  await scrollTo(page, top);
};

const expectChapter = async (page: Page, chapter: '01' | '02' | '03') => {
  const story = page.locator('[data-anime-scroll-story]');
  const scene = story.locator(`[data-anime-story-scene="${Number(chapter) - 1}"]`);

  await expect(story).toHaveAttribute('data-story-chapter', chapter, { timeout: 10_000 });
  await expect(story).toHaveAttribute('data-story-authority-chapter', chapter, {
    timeout: 10_000,
  });
  await expect(scene).toHaveAttribute('data-active', 'true');
  await expect(scene).toHaveAttribute('aria-hidden', 'false');
  await expect(scene).not.toHaveAttribute('inert', '');
  await expect(story.locator('[data-anime-story-scene][aria-hidden="false"]')).toHaveCount(1);

  await expect
    .poll(async () => scene.evaluate((element) => Number(getComputedStyle(element).opacity)))
    .toBeGreaterThan(0.05);
};

test.describe('iOS WebKit story stability', () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ browserName, page }) => {
    test.skip(browserName !== 'webkit', 'iOS WebKit専用の回帰テスト');
    await prepare(page);
  });

  test('Heroで待機後もfallbackへ落ちず01→02→03→02→01を維持する', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toHaveAttribute('data-story-platform', 'ios-webkit');

    await page.waitForTimeout(5_200);
    await expect(story).not.toHaveAttribute('data-story-mode', 'static');
    await expect(story).not.toHaveAttribute('data-story-runtime', 'fallback');
    await expect(story).not.toHaveAttribute('data-story-runtime-reason', 'motion-boot-timeout');

    await revealStory(page);
    await expect(story).toHaveAttribute('data-story-director', 'ready', { timeout: 15_000 });
    await expect(story).toHaveAttribute('data-story-runtime', 'ready', { timeout: 15_000 });
    await expect(story).toHaveAttribute('data-story-mobile-stability', 'ready', {
      timeout: 15_000,
    });

    await scrollToProgress(page, 0.05);
    await expectChapter(page, '01');
    await scrollToProgress(page, 0.4);
    await expectChapter(page, '02');
    await scrollToProgress(page, 0.8);
    await expectChapter(page, '03');
    await expect(page.locator('[data-omega-world-rift]')).toHaveAttribute(
      'data-omega-chapter',
      '03',
    );
    await scrollToProgress(page, 0.42);
    await expectChapter(page, '02');
    await scrollToProgress(page, 0.08);
    await expectChapter(page, '01');
  });

  test('アドレスバー相当の高さ変化と画面回転後もready状態を維持する', async ({ page }) => {
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await revealStory(page);
    await expect(story).toHaveAttribute('data-story-runtime', 'ready', { timeout: 15_000 });

    await scrollToProgress(page, 0.42);
    await expectChapter(page, '02');

    await page.setViewportSize({ width: 390, height: 720 });
    await page.waitForTimeout(700);
    await expect(story).toHaveAttribute('data-story-runtime', 'ready');
    await expect(story).toHaveAttribute('data-story-mode', 'motion');

    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(900);
    await expect(story).toHaveAttribute('data-story-runtime', 'ready', { timeout: 12_000 });
    await expect(story).toHaveAttribute('data-story-mobile-stability', 'ready', {
      timeout: 12_000,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(900);
    await expect(story).toHaveAttribute('data-story-runtime', 'ready', { timeout: 12_000 });

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      ),
    ).toBe(false);
  });
});
