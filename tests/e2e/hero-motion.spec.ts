import { expect, test } from '@playwright/test';

const prepareHome = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'dark');
    localStorage.setItem('ivuru-locale', 'ja');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

const moveToChapter = async (
  page: import('@playwright/test').Page,
  chapter: '01' | '02' | '03' | '04',
) => {
  const chapterIndex = Number(chapter) - 1;
  const story = page.locator('[data-anime-scroll-story]');
  await expect(story).toHaveAttribute('data-story-mode', 'motion', { timeout: 6_000 });
  await page.evaluate((index) => {
    window.scrollTo({ top: window.innerHeight * (index * 1.16 + 0.3), behavior: 'instant' });
  }, chapterIndex);
  await expect(story).toHaveAttribute('data-story-chapter', chapter, { timeout: 4_000 });
};

test.describe('anime scroll story', () => {
  test('opens as a four-chapter transform-only anime world', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toBeVisible();
    await expect(story).toHaveAttribute('data-story-mode', 'motion', { timeout: 6_000 });
    await expect(story).toHaveAttribute('data-story-performance', 'transform-only');
    await expect(story).toHaveAttribute(
      'data-story-snap',
      testInfo.project.use.isMobile ? 'disabled-mobile' : 'labels-directional',
    );
    await expect(story).toHaveAttribute('data-story-mask', 'active');
    await expect(story.locator('[data-anime-story-scene]')).toHaveCount(4);
    await expect(story.locator('[data-story-progress-dot]')).toHaveCount(4);
    await expect(story.locator('[data-story-progress-line]')).toHaveCount(1);
    await expect(story).toHaveAttribute('data-story-chapter', '01');
    await expect(story.locator('[data-story-flight-path]')).toHaveCount(1);
    await expect(story.locator('[data-blue-orbit]')).toBeVisible();
    await expect(story.locator('[data-cinematic-ring]')).toHaveCount(3);
    await expect(story.locator('[data-cinematic-shard]')).toHaveCount(8);
    await expect(story.locator('.signal-key-frame')).toBeVisible();
    await expect(story.locator('[data-hero-video]')).toHaveCount(0);
    await expect(story.getByRole('link', { name: /Works|制作|작업/i }).first()).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'observer');
  });

  test('switches scenes using compositor-friendly properties', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await moveToChapter(page, '02');
    const buildScene = story.locator('[data-anime-story-scene="1"]');
    await expect(buildScene).toHaveAttribute('data-active', 'true');
    await expect(buildScene).toHaveCSS('clip-path', 'none');
    await expect(buildScene).toHaveCSS('filter', 'none');
    await expect(story.locator('.anime-build-device')).toBeVisible();

    await moveToChapter(page, '03');
    await expect(story.locator('[data-anime-story-scene="2"]')).toHaveAttribute(
      'data-active',
      'true',
    );
    await expect(story.locator('.anime-game-portal')).toBeVisible();
    await expect(story.locator('.anime-game-portal')).toHaveCSS('clip-path', 'none');
    await expect(story.locator('.anime-portal-card')).toHaveCount(3);
    await expect(page.locator('body')).toHaveAttribute('data-anime-scene', 'deep');

    await moveToChapter(page, '04');
    await expect(story.locator('[data-anime-story-scene="3"]')).toHaveAttribute(
      'data-active',
      'true',
    );
    await expect(story.locator('.anime-community-emblem')).toBeVisible();
  });

  test('updates the transform progress rail and visible card tilt', async ({ page }, testInfo) => {
    test.skip(Boolean(testInfo.project.use.isMobile), 'Fine pointer only');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    const progressLine = story.locator('[data-story-progress-line]');
    const initialTransform = await progressLine.evaluate((element) => getComputedStyle(element).transform);

    await moveToChapter(page, '02');
    await expect
      .poll(() => progressLine.evaluate((element) => getComputedStyle(element).transform))
      .not.toBe(initialTransform);

    await moveToChapter(page, '03');
    const card = story.locator('[data-cinematic-card]').first();
    await expect(card).toBeVisible();
    const surface = card.locator('.cinematic-card-surface');
    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();
    if (!cardBox) return;

    await card.dispatchEvent('pointerenter', {
      clientX: cardBox.x + cardBox.width * 0.5,
      clientY: cardBox.y + cardBox.height * 0.5,
      pointerType: 'mouse',
    });
    await card.dispatchEvent('pointermove', {
      clientX: cardBox.x + cardBox.width * 0.78,
      clientY: cardBox.y + cardBox.height * 0.28,
      pointerType: 'mouse',
    });
    await expect(card).toHaveAttribute('data-pointer-active', 'true');
    await expect
      .poll(() => surface.evaluate((element) => getComputedStyle(element).transform))
      .not.toBe('none');
  });

  test('stacks every chapter and disables ambient loops for reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await prepareHome(page);
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toHaveAttribute('data-story-mode', 'static');
    await expect(story).toHaveAttribute('data-story-mask', 'static');
    await expect(story).toHaveAttribute('data-story-performance', 'transform-only');
    await expect(story).not.toHaveAttribute('data-story-snap');
    await expect(story.locator('[data-anime-story-scene]')).toHaveCount(4);
    for (const scene of await story.locator('[data-anime-story-scene]').all()) {
      await expect(scene).toBeVisible();
      await expect(scene).not.toHaveAttribute('aria-hidden', 'true');
    }
    await expect(story.locator('.anime-game-ring').first()).toHaveCSS('animation-name', 'none');
    await expect(story.locator('.cinematic-signal-ring').first()).toHaveCSS(
      'animation-name',
      'none',
    );
    await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'reduced');
  });

  test('provides the same four-chapter structure in every locale', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      localStorage.setItem('ivuru-theme', 'dark');
      sessionStorage.setItem('ivuru-intro-seen', '1');
    });

    for (const route of ['/', '/en', '/ko']) {
      await page.goto(route);
      const story = page.locator('[data-anime-scroll-story]');
      await expect(story).toBeVisible();
      await expect(story).toHaveAttribute(
        'data-story-snap',
        testInfo.project.use.isMobile ? 'disabled-mobile' : 'labels-directional',
      );
      await expect(story.locator('[data-anime-story-scene]')).toHaveCount(4);
      await expect(story.locator('.signal-key-visual')).toBeVisible();
      await expect(story.locator('.anime-portal-card')).toHaveCount(3);
    }
  });
});
