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
  await expect(story).toHaveAttribute('data-story-mode', 'motion', { timeout: 4_000 });
  await page.evaluate((index) => {
    window.scrollTo({ top: window.innerHeight * (index * 1.22 + 0.35), behavior: 'instant' });
  }, chapterIndex);
  await expect(story).toHaveAttribute('data-story-chapter', chapter, { timeout: 4_000 });
};

test.describe('anime scroll story', () => {
  test('opens as a four-chapter anime world with layered artwork', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toBeVisible();
    await expect(story).toHaveAttribute('data-story-mode', 'motion', { timeout: 4_000 });
    await expect(story.locator('[data-anime-story-scene]')).toHaveCount(4);
    await expect(story.locator('[data-story-progress-dot]')).toHaveCount(4);
    await expect(story).toHaveAttribute('data-story-chapter', '01');
    await expect(story.locator('[data-blue-path]')).toHaveCount(1);
    await expect(story.locator('[data-blue-orbit]')).toBeVisible();
    await expect(story.locator('[data-cinematic-ring]')).toHaveCount(3);
    await expect(story.locator('[data-cinematic-shard]')).toHaveCount(8);
    await expect(story.locator('.anime-scene-sky')).toBeVisible();
    await expect(story.locator('.signal-key-frame')).toBeVisible();
    await expect(story.locator('[data-hero-video]')).toHaveCount(0);
    await expect(story.getByRole('link', { name: /Works|制作|작업/i }).first()).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'true');
  });

  test('switches scenes and makes foreground objects fly toward the viewer', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await moveToChapter(page, '02');
    await expect(story.locator('[data-anime-story-scene="1"]')).toHaveAttribute(
      'data-active',
      'true',
    );
    await expect(story.locator('.anime-build-device')).toBeVisible();

    await moveToChapter(page, '03');
    await expect(story.locator('[data-anime-story-scene="2"]')).toHaveAttribute(
      'data-active',
      'true',
    );
    await expect(story.locator('.anime-game-portal')).toBeVisible();
    await expect(story.locator('.anime-portal-card')).toHaveCount(3);
    await expect(story.locator('.anime-portal-section img')).toHaveCount(0);
    await expect(page.locator('body')).toHaveAttribute('data-anime-scene', 'deep');

    await moveToChapter(page, '04');
    await expect(story.locator('[data-anime-story-scene="3"]')).toHaveAttribute(
      'data-active',
      'true',
    );
    await expect(story.locator('.anime-community-emblem')).toBeVisible();
  });

  test('responds to a fine pointer with depth and chapter-three card tilt', async (
    { page },
    testInfo,
  ) => {
    test.skip(Boolean(testInfo.project.use.isMobile), 'Fine pointer only');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    const stage = story.locator('[data-anime-scroll-stage]');
    await expect(story).toHaveAttribute('data-cinematic-pointer', 'active');
    const stageBox = await stage.boundingBox();
    expect(stageBox).not.toBeNull();
    if (!stageBox) return;

    await stage.dispatchEvent('pointermove', {
      clientX: stageBox.x + stageBox.width * 0.82,
      clientY: stageBox.y + stageBox.height * 0.24,
      pointerType: 'mouse',
    });
    await expect
      .poll(() =>
        story.evaluate((element) =>
          getComputedStyle(element).getPropertyValue('--story-pointer-x').trim(),
        ),
      )
      .not.toBe('0px');

    await moveToChapter(page, '03');
    const card = story.locator('[data-cinematic-card]').first();
    await expect(card).toBeVisible();
    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();
    if (!cardBox) return;

    await card.dispatchEvent('pointermove', {
      clientX: cardBox.x + cardBox.width * 0.78,
      clientY: cardBox.y + cardBox.height * 0.28,
      pointerType: 'mouse',
    });
    await expect
      .poll(() =>
        card.evaluate((element) =>
          getComputedStyle(element).getPropertyValue('--card-tilt-y').trim(),
        ),
      )
      .not.toBe('0deg');
  });

  test('stacks every chapter and disables ambient loops for reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await prepareHome(page);
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toHaveAttribute('data-story-mode', 'static');
    await expect(story.locator('[data-anime-story-scene]')).toHaveCount(4);
    for (const scene of await story.locator('[data-anime-story-scene]').all()) {
      await expect(scene).toBeVisible();
      await expect(scene).not.toHaveAttribute('aria-hidden', 'true');
    }
    await expect(story).not.toHaveAttribute('data-cinematic-pointer', 'active');
    await expect(story.locator('.anime-game-ring').first()).toHaveCSS('animation-name', 'none');
    await expect(story.locator('.cinematic-signal-ring').first()).toHaveCSS(
      'animation-name',
      'none',
    );
    await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'reduced');
  });

  test('provides the same four-chapter structure in every locale', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      localStorage.setItem('ivuru-theme', 'dark');
      sessionStorage.setItem('ivuru-intro-seen', '1');
    });

    for (const route of ['/', '/en', '/ko']) {
      await page.goto(route);
      const story = page.locator('[data-anime-scroll-story]');
      await expect(story).toBeVisible();
      await expect(story.locator('[data-anime-story-scene]')).toHaveCount(4);
      await expect(story.locator('.signal-key-visual')).toBeVisible();
      await expect(story.locator('.anime-portal-card')).toHaveCount(3);
    }
  });
});
