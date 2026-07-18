import { expect, test } from '@playwright/test';

const prepareHome = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'dark');
    localStorage.setItem('ivuru-locale', 'ja');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

const waitForMotionStory = async (page: import('@playwright/test').Page) => {
  const story = page.locator('[data-anime-scroll-story]');
  await expect(story).toBeVisible();
  await expect(story).toHaveAttribute('data-story-mode', 'motion', { timeout: 10_000 });
  return story;
};

const moveToChapter = async (
  page: import('@playwright/test').Page,
  chapter: '01' | '02' | '03',
) => {
  const chapterIndex = Number(chapter) - 1;
  const story = await waitForMotionStory(page);
  await page.evaluate((index) => {
    window.scrollTo({ top: window.innerHeight * (index * 1.15 + 0.18), behavior: 'instant' });
  }, chapterIndex);
  await expect(story).toHaveAttribute('data-story-chapter', chapter, { timeout: 10_000 });
};

test.describe('Home V2 spatial scroll story', () => {
  test('opens as a three-scene transform-only 3D world', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const story = await waitForMotionStory(page);
    await expect(story).toHaveAttribute('data-story-performance', 'transform-only');
    await expect(story).toHaveAttribute(
      'data-story-snap',
      testInfo.project.use.isMobile ? 'disabled-mobile' : 'labels-directional',
    );
    await expect(story).toHaveAttribute('data-story-mask', 'active');
    await expect(story.locator('[data-anime-story-scene]')).toHaveCount(3);
    await expect(story.locator('[data-story-progress-dot]')).toHaveCount(3);
    await expect(story.locator('[data-story-progress-line]')).toHaveCount(1);
    await expect(story.locator('[data-story-camera-rig]')).toHaveCount(1);
    await expect(story.locator('[data-story-flyby]')).toHaveCount(5);
    await expect(story.locator('[data-cinematic-ring]')).toHaveCount(3);
    await expect(story.locator('[data-cinematic-shard]')).toHaveCount(6);
    await expect(story.locator('.signal-key-frame')).toBeVisible();
    await expect(story.getByRole('link', { name: /Works|制作|작업/i }).first()).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'observer');
  });

  test('switches from Build & Play to Connect using compositor-friendly transforms', async ({
    page,
  }) => {
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
    const connectScene = story.locator('[data-anime-story-scene="2"]');
    await expect(connectScene).toHaveAttribute('data-active', 'true');
    await expect(connectScene).toHaveCSS('clip-path', 'none');
    await expect(story.locator('.anime-community-emblem')).toBeVisible();
    await expect(page.locator('body')).toHaveAttribute('data-anime-scene', 'night');
  });

  test('moves the perspective camera and foreground layers as the page scrolls', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const story = await waitForMotionStory(page);
    await expect(story).toHaveAttribute('data-spatial-camera-ready', 'true', {
      timeout: 10_000,
    });
    const camera = story.locator('[data-story-camera-rig]');
    const initialTransform = await camera.evaluate(
      (element) => getComputedStyle(element).transform,
    );
    const initialPerspective = await story.evaluate((element) =>
      getComputedStyle(element).getPropertyValue('--story-perspective-x').trim(),
    );

    await moveToChapter(page, '02');
    await expect
      .poll(() => camera.evaluate((element) => getComputedStyle(element).transform), {
        timeout: 10_000,
      })
      .not.toBe(initialTransform);
    await expect
      .poll(
        () =>
          story.evaluate((element) =>
            getComputedStyle(element).getPropertyValue('--story-perspective-x').trim(),
          ),
        { timeout: 10_000 },
      )
      .not.toBe(initialPerspective);
    await expect(story.locator('[data-story-depth="front"]')).toHaveCount(3);
  });

  test('stacks every scene and disables fly-through motion for reduced motion', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await prepareHome(page);
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toBeVisible();
    await expect(story).toHaveAttribute('data-story-mode', 'static', { timeout: 10_000 });
    await expect(story).toHaveAttribute('data-story-mask', 'static');
    await expect(story).toHaveAttribute('data-story-camera', 'static');
    await expect(story.locator('[data-anime-story-scene]')).toHaveCount(3);
    for (const scene of await story.locator('[data-anime-story-scene]').all()) {
      await expect(scene).toBeVisible();
      await expect(scene).not.toHaveAttribute('aria-hidden', 'true');
    }
    await expect(story.locator('.anime-depth-flybys')).toBeHidden();
    await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'reduced');
  });

  test('provides the same three-scene structure in every locale', async ({ page }, testInfo) => {
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
        { timeout: 10_000 },
      );
      await expect(story.locator('[data-anime-story-scene]')).toHaveCount(3);
      await expect(story.locator('.signal-key-visual')).toBeVisible();
      await expect(page.locator('.home-portal-link')).toHaveCount(4);
    }
  });
});
