import { expect, test, type Page } from '@playwright/test';

const prepare = async (page: Page) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('ivuru-intro-seen', '1');
    localStorage.setItem('ivuru-locale', 'ja');
  });
};

const scrollTo = async (page: Page, progress: number) => {
  await page.locator('[data-anime-scroll-story]').evaluate((root, target) => {
    const start = Number((root as HTMLElement).dataset.storyScrollStart);
    const end = Number((root as HTMLElement).dataset.storyScrollEnd);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      throw new Error(`invalid story range: ${start} - ${end}`);
    }
    window.scrollTo({ top: start + (end - start) * Number(target), behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
  }, progress);
};

const expectChapter = async (page: Page, chapter: '01' | '02' | '03') => {
  const story = page.locator('[data-anime-scroll-story]');
  const scene = story.locator(`[data-anime-story-scene="${Number(chapter) - 1}"]`);
  await expect(story).toHaveAttribute('data-story-chapter', chapter);
  await expect(story).toHaveAttribute('data-story-authority-chapter', chapter);
  await expect(scene).toHaveAttribute('data-active', 'true');
  await expect(scene).toHaveAttribute('aria-hidden', 'false');
  await expect(scene).not.toHaveAttribute('inert', '');
  await expect(story.locator('[data-anime-story-scene][aria-hidden="false"]')).toHaveCount(1);
};

test('実ピン範囲で01→02→03→02→01を同期しモバイルでも横溢れしない', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page);
  await page.goto('/');

  const story = page.locator('[data-anime-scroll-story]');
  await expect(story).toHaveAttribute('data-story-progress-authority', 'ready', {
    timeout: 12_000,
  });

  await scrollTo(page, 0.05);
  await expectChapter(page, '01');
  await scrollTo(page, 0.36);
  await expectChapter(page, '02');
  await scrollTo(page, 0.78);
  await expectChapter(page, '03');
  await expect(page.locator('[data-omega-world-rift]')).toHaveAttribute('data-omega-chapter', '03');
  await scrollTo(page, 0.4);
  await expectChapter(page, '02');
  await scrollTo(page, 0.08);
  await expectChapter(page, '01');

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    ),
  ).toBe(false);
});

test('途中reloadとキーボードスキップ後も利用可能な状態を維持する', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await prepare(page);
  await page.goto('/');
  await expect(page.locator('[data-anime-scroll-story]')).toHaveAttribute(
    'data-story-progress-authority',
    'ready',
    { timeout: 12_000 },
  );

  await scrollTo(page, 0.44);
  await expectChapter(page, '02');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-anime-scroll-story]')).toHaveAttribute(
    'data-story-progress-authority',
    'ready',
    { timeout: 12_000 },
  );
  await expectChapter(page, '02');

  const skip = page.locator('[data-story-skip]');
  await skip.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#anime-story-after')).toBeFocused({ timeout: 3_000 });
});

test('Reduced Motionは3章を順番に読める静的ストーリーへ切り替える', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await prepare(page);
  await page.goto('/');

  const story = page.locator('[data-anime-scroll-story]');
  await expect(story).toHaveAttribute('data-story-progress-authority', 'static');
  await expect(story).toHaveAttribute('data-story-mode', 'static');
  await expect(story.locator('[data-anime-story-scene][data-active="true"]')).toHaveCount(3);
  await expect(story.locator('[data-anime-story-scene][aria-hidden="true"]')).toHaveCount(0);
  await expect(story.locator('[data-anime-story-scene][inert]')).toHaveCount(0);
  await expect(story.locator('[data-story-chapter-readout]')).toHaveText('01–03 / STATIC STORY');
});
