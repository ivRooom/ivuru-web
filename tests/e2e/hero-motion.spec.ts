import { expect, test } from '@playwright/test';

const prepareHome = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivuru-theme', 'dark');
    localStorage.setItem('ivuru-locale', 'ja');
    sessionStorage.setItem('ivuru-intro-seen', '1');
  });
};

test.describe('blue media scroll motion', () => {
  test('reveals the cinematic blue anime hero with layered signal effects', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const hero = page.locator('[data-anime-hero]');
    await expect(hero).toBeVisible();
    await expect(hero.locator('[data-blue-path]')).toHaveCount(1);
    await expect(hero.locator('[data-blue-orbit]')).toBeVisible();
    await expect(hero.locator('[data-cinematic-field]')).toBeVisible();
    await expect(hero.locator('[data-cinematic-ring]')).toHaveCount(3);
    await expect(hero.locator('[data-cinematic-shard]')).toHaveCount(8);
    await expect(hero.locator('[data-cinematic-scan]')).toBeVisible();
    await expect(hero.locator('.cinematic-character-aura')).toBeVisible();
    await expect(page.locator('[data-cinematic-intro]')).toHaveCount(0);
    await expect(page.locator('[data-hero-depth="grain"]')).toHaveCount(0);
    await expect(page.locator('[data-hero-video]')).toHaveCount(0);

    const works = hero.getByRole('link', { name: /Works|制作|작업/i }).first();
    await expect(works).toBeVisible();
    await expect(works).toHaveCSS('pointer-events', 'auto');
    await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'true');
  });

  test('responds to a fine pointer with hero depth and card tilt', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const hero = page.locator('[data-anime-hero]');
    await expect(hero).toBeVisible();
    await expect(hero).toHaveAttribute('data-cinematic-pointer', 'active');
    const heroBox = await hero.boundingBox();
    expect(heroBox).not.toBeNull();
    if (!heroBox) return;

    await hero.dispatchEvent('pointermove', {
      clientX: heroBox.x + heroBox.width * 0.82,
      clientY: heroBox.y + heroBox.height * 0.24,
      pointerType: 'mouse',
    });
    await expect
      .poll(() =>
        hero.evaluate((element) =>
          getComputedStyle(element).getPropertyValue('--hero-shift-x').trim(),
        ),
      )
      .not.toBe('0px');

    const portal = page.locator('.anime-portal-section');
    await portal.scrollIntoViewIfNeeded();
    const card = portal.locator('[data-cinematic-card]').first();
    await expect(card).toBeVisible();
    await expect(card.locator('.cinematic-card-surface')).toHaveCount(1);
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

  test('keeps every scene visible and disables added motion for reduced motion', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await prepareHome(page);
    await page.goto('/');

    const hero = page.locator('[data-anime-hero]');
    await expect(hero).toBeVisible();
    await expect(hero).not.toHaveAttribute('data-cinematic-pointer', 'active');
    await expect(page.locator('[data-hero-video]')).toHaveCount(0);
    await expect(page.locator('.blue-media-character')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'reduced');
    await expect(page.locator('.cinematic-scan-beam')).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.cinematic-signal-ring').first()).toHaveCSS(
      'animation-name',
      'none',
    );
    await expect(hero.getByRole('link', { name: /Works|制作|작업/i }).first()).toBeVisible();
  });

  test('changes the ambient scene while scrolling through blue channel cards', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await prepareHome(page);
    await page.goto('/');

    const portal = page.locator('.anime-portal-section');
    await portal.scrollIntoViewIfNeeded();
    await expect(portal).toBeVisible();
    await expect(portal.locator('.anime-portal-card')).toHaveCount(3);
    await expect(portal.locator('[data-cinematic-card]')).toHaveCount(3);
    await expect(page.locator('body')).toHaveAttribute('data-anime-scene', 'deep');
  });

  test('provides the same cinematic blue media structure in every locale', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      localStorage.setItem('ivuru-theme', 'dark');
      sessionStorage.setItem('ivuru-intro-seen', '1');
    });

    for (const route of ['/', '/en', '/ko']) {
      await page.goto(route);
      await expect(page.locator('[data-anime-hero]')).toBeVisible();
      await expect(page.locator('.blue-media-character img')).toBeVisible();
      await expect(page.locator('[data-cinematic-ring]')).toHaveCount(3);
      await expect(page.locator('.anime-portal-card')).toHaveCount(3);
    }
  });
});
