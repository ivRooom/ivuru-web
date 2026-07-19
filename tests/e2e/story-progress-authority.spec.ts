import { expect, test } from '@playwright/test';

const prepareHome = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'dark');
    localStorage.setItem('ivuru-locale', 'ja');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

const scrollToProgress = async (page: import('@playwright/test').Page, progress: number) => {
  await page.evaluate((targetProgress) => {
    const root = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
    if (!root) throw new Error('story root is missing');
    const spacer = root.parentElement?.classList.contains('pin-spacer') ? root.parentElement : root;
    const start = spacer.getBoundingClientRect().top + window.scrollY;
    const distance = Math.max(window.innerHeight * 5.7, spacer.scrollHeight - window.innerHeight);
    window.scrollTo({ top: start + distance * targetProgress, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
  }, progress);
};

test.describe('Story Progress Authority', () => {
  test('実スクロールで01→02→03へ切り替わり逆方向にも戻れる', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toHaveAttribute('data-story-progress-authority', 'ready', {
      timeout: 10_000,
    });
    await expect(story).toHaveAttribute('data-story-chapter', '01');

    await scrollToProgress(page, 0.42);
    await expect(story).toHaveAttribute('data-story-chapter', '02', { timeout: 8_000 });
    await expect(story).toHaveAttribute('data-story-authority-chapter', '02');
    await expect(story.locator('[data-anime-story-scene][data-active="true"]')).toHaveAttribute(
      'data-anime-story-scene',
      '1',
    );

    await scrollToProgress(page, 0.82);
    await expect(story).toHaveAttribute('data-story-chapter', '03', { timeout: 8_000 });
    await expect(story.locator('[data-anime-story-scene][data-active="true"]')).toHaveAttribute(
      'data-anime-story-scene',
      '2',
    );

    const rift = story.locator('[data-omega-world-rift]');
    await expect(rift).toHaveCount(1);
    await expect(rift).toHaveAttribute('data-omega-chapter', '03');
    await expect(rift.locator('[data-omega-title]')).toHaveText('NEXUS ASCENSION');

    await scrollToProgress(page, 0.45);
    await expect(story).toHaveAttribute('data-story-chapter', '02', { timeout: 8_000 });

    await scrollToProgress(page, 0.08);
    await expect(story).toHaveAttribute('data-story-chapter', '01', { timeout: 8_000 });
  });

  test('Reduced MotionではProgress AuthorityとOmega Riftを停止する', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await prepareHome(page);
    await page.goto('/');

    const story = page.locator('[data-anime-scroll-story]');
    await expect(story).toHaveAttribute('data-story-transition-engine', 'static');
    await expect(story).not.toHaveAttribute('data-story-progress-authority', 'ready');
    await expect(story.locator('[data-omega-world-rift]')).toBeHidden();
  });
});
