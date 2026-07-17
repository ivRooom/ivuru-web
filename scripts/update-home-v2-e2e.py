from pathlib import Path
from textwrap import dedent


def write(path: str, content: str) -> None:
    Path(path).write_text(dedent(content).lstrip(), encoding='utf-8')


fallback_path = Path('src/styles/story-static-fallback.css')
style_path = Path('src/styles/spatial-home-v2.css')
marker = '/* Home V2 static and no-JS fallback */'
if fallback_path.exists() and marker not in style_path.read_text(encoding='utf-8'):
    style_path.write_text(
        style_path.read_text(encoding='utf-8').rstrip()
        + '\n\n'
        + marker
        + '\n'
        + fallback_path.read_text(encoding='utf-8').strip()
        + '\n',
        encoding='utf-8',
    )

write(
    'tests/e2e/anime-experience.spec.ts',
    r'''
    import { expect, test } from '@playwright/test';

    const prepareLocale = async (page: import('@playwright/test').Page, seen = false) => {
      await page.addInitScript(
        ({ seen }) => {
          localStorage.setItem('ivuru-locale', 'ja');
          localStorage.setItem('ivuru-theme', 'light');
          if (seen) sessionStorage.setItem('ivuru-intro-seen', '1');
          else sessionStorage.removeItem('ivuru-intro-seen');
        },
        { seen },
      );
    };

    const fetchMarkup = async (page: import('@playwright/test').Page, route: string) => {
      const response = await page.request.get(route);
      expect(response.ok(), route).toBeTruthy();
      return response.text();
    };

    test.describe('spatial loading experience', () => {
      test('ships the spatial title sequence and then releases the page', async ({ page }) => {
        const markup = await fetchMarkup(page, '/');
        expect(markup).toContain('anime-intro-loader');
        expect(markup).toContain('IVURU / SPATIAL ENGINE');
        expect(markup).toContain('CSS PERSPECTIVE · 12 FACES');
        expect(markup).toContain('いゔる。');
        expect(markup).not.toMatch(/class="[^"]*anime-loader-mascot/);

        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await prepareLocale(page, false);
        await page.goto('/');

        await expect(page.locator('.anime-intro-loader')).toBeHidden({ timeout: 4_000 });
        await expect(page.locator('html')).toHaveAttribute('data-loader-released', 'true');
        await expect(page.locator('body')).not.toHaveClass(/site-loading/);
      });

      test('uses the shortened loader timing after the first visit', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await prepareLocale(page, true);
        await page.goto('/');

        await expect(page.locator('.anime-intro-loader')).toBeHidden({ timeout: 3_500 });
        await expect
          .poll(() => page.evaluate(() => sessionStorage.getItem('ivuru-intro-seen')))
          .toBe('1');
      });

      test('localizes the accessible loading metadata in SSR output', async ({ page }) => {
        for (const [route, label, status] of [
          ['/', 'いゔる。を読み込んでいます', 'ページを読み込んでいます。'],
          ['/en', 'Loading ivuru', 'Loading the page.'],
          ['/ko', 'ivuru를 불러오는 중입니다', '페이지를 불러오는 중입니다.'],
        ]) {
          const markup = await fetchMarkup(page, route);
          expect(markup).toContain(`aria-label="${label}"`);
          expect(markup).toContain(status);
          expect(markup).toContain('role="status"');
          expect(markup).toContain('aria-live="polite"');
          expect(markup).toContain('aria-atomic="true"');
          expect(markup).toContain('role="progressbar"');
          expect(markup).toContain('aria-valuemin="0"');
          expect(markup).toContain('aria-valuemax="100"');
        }
      });

      test('keeps the main content reachable when JavaScript is disabled', async ({ browser }) => {
        const context = await browser.newContext({
          javaScriptEnabled: false,
          baseURL: 'http://127.0.0.1:4321',
        });
        const page = await context.newPage();

        try {
          await page.goto('/');
          await expect(page.locator('.anime-intro-loader')).toBeHidden();
          const main = page.locator('#main-content');
          await expect(main).toBeVisible();
          await expect(page.locator('[data-anime-story-scene]')).toHaveCount(3);
          await expect(page.locator('.home-portal-link')).toHaveCount(4);
        } finally {
          await context.close();
        }
      });

      test('reduced motion completes quickly and leaves Home V2 accessible', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await prepareLocale(page, false);
        await page.goto('/');

        await expect(page.locator('.anime-intro-loader')).toBeHidden({ timeout: 1_000 });
        const story = page.locator('[data-anime-scroll-story]');
        await expect(story).toBeVisible();
        await expect(story).toHaveAttribute('data-story-mode', 'static');
        await expect(story.locator('[data-anime-story-scene]')).toHaveCount(3);
        await expect(page.locator('.home-portal-link')).toHaveCount(4);
      });
    });
    ''',
)

write(
    'tests/e2e/hero-colorful.spec.ts',
    r'''
    import { expect, test } from '@playwright/test';

    const preparePage = async (page: import('@playwright/test').Page) => {
      await page.addInitScript(() => {
        localStorage.setItem('ivuru-theme', 'light');
        localStorage.setItem('ivuru-locale', 'ja');
        sessionStorage.setItem('ivuru-intro-seen', '1');
      });
    };

    test('Home V2 uses the brand signal visual and keeps primary actions clear', async ({ page }) => {
      await preparePage(page);
      await page.goto('/');

      const story = page.locator('[data-anime-scroll-story]');
      await expect(story).toBeVisible();
      await expect(story).toHaveAttribute('data-story-mode', 'motion', { timeout: 6_000 });
      await expect(story.locator('[data-anime-story-scene]')).toHaveCount(3);
      await expect(story.locator('.signal-key-visual')).toBeVisible();
      await expect(story.locator('.signal-key-mark')).toContainText('IV');
      await expect(story.locator('.signal-key-readout')).toBeVisible();
      await expect(story.locator('[data-story-camera-rig]')).toHaveCount(1);
      await expect(story.locator('[data-story-flyby]')).toHaveCount(5);
      await expect(story.getByRole('link', { name: /Works|制作|작업/i }).first()).toBeVisible();
      await expect(
        story.getByRole('link', { name: /Profile|プロフィール|프로필/i }).first(),
      ).toBeVisible();
      await expect(page.locator('body')).toHaveAttribute('data-anime-scene', 'ice');
    });

    test('reduced motion keeps all three story scenes available without autoplay motion', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await preparePage(page);
      await page.goto('/');

      const story = page.locator('[data-anime-scroll-story]');
      await expect(story).toBeVisible();
      await expect(story).toHaveAttribute('data-story-mode', 'static');
      await expect(story).toHaveAttribute('data-story-camera', 'static');
      await expect(story.locator('[data-anime-story-scene]')).toHaveCount(3);
      await expect(story.locator('.signal-key-visual')).toBeVisible();
      await expect(story.locator('.anime-depth-flybys')).toBeHidden();
      await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'reduced');
    });

    test('localized routes share the blue and white three-scene composition', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('ivuru-theme', 'dark');
        sessionStorage.setItem('ivuru-intro-seen', '1');
      });

      for (const route of ['/en', '/ko']) {
        await page.goto(route);
        const story = page.locator('[data-anime-scroll-story]');
        await expect(story).toBeVisible();
        await expect(story.locator('[data-anime-story-scene]')).toHaveCount(3);
        await expect(story.locator('[data-story-flyby]')).toHaveCount(5);
        await expect(story.locator('.signal-key-visual')).toBeVisible();
        await expect(story.locator('.signal-key-mark')).toContainText('IV');
        await expect(page.locator('.home-portal-link')).toHaveCount(4);
      }
    });
    ''',
)

write(
    'tests/e2e/hero-motion.spec.ts',
    r'''
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
      chapter: '01' | '02' | '03',
    ) => {
      const chapterIndex = Number(chapter) - 1;
      const story = page.locator('[data-anime-scroll-story]');
      await expect(story).toHaveAttribute('data-story-mode', 'motion', { timeout: 6_000 });
      await page.evaluate((index) => {
        window.scrollTo({ top: window.innerHeight * (index * 1.15 + 0.18), behavior: 'instant' });
      }, chapterIndex);
      await expect(story).toHaveAttribute('data-story-chapter', chapter, { timeout: 5_000 });
    };

    test.describe('Home V2 spatial scroll story', () => {
      test('opens as a three-scene transform-only 3D world', async ({ page }, testInfo) => {
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

      test('moves the perspective camera and foreground layers as the page scrolls', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await prepareHome(page);
        await page.goto('/');

        const story = page.locator('[data-anime-scroll-story]');
        await expect(story).toHaveAttribute('data-story-camera', 'orbital-flythrough', {
          timeout: 6_000,
        });
        const camera = story.locator('[data-story-camera-rig]');
        const initialTransform = await camera.evaluate((element) => getComputedStyle(element).transform);
        const initialPerspective = await story.evaluate((element) =>
          getComputedStyle(element).getPropertyValue('--story-perspective-x'),
        );

        await moveToChapter(page, '02');
        await expect
          .poll(() => camera.evaluate((element) => getComputedStyle(element).transform))
          .not.toBe(initialTransform);
        await expect
          .poll(() =>
            story.evaluate((element) =>
              getComputedStyle(element).getPropertyValue('--story-perspective-x'),
            ),
          )
          .not.toBe(initialPerspective);
        await expect(story.locator('[data-story-depth="front"]')).toHaveCount(3);
      });

      test('stacks every scene and disables fly-through motion for reduced motion', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await prepareHome(page);
        await page.goto('/');

        const story = page.locator('[data-anime-scroll-story]');
        await expect(story).toBeVisible();
        await expect(story).toHaveAttribute('data-story-mode', 'static');
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
          );
          await expect(story.locator('[data-anime-story-scene]')).toHaveCount(3);
          await expect(story.locator('.signal-key-visual')).toBeVisible();
          await expect(page.locator('.home-portal-link')).toHaveCount(4);
        }
      });
    });
    ''',
)

write(
    'tests/e2e/quality.spec.ts',
    r'''
    import { expect, test } from '@playwright/test';

    test('Home V2 renders four focused destinations in all locales', async ({ page }) => {
      for (const route of ['/', '/en', '/ko']) {
        await page.goto(route);
        await expect(page.locator('.world-loader')).toBeHidden({ timeout: 4_000 });
        const portals = page.locator('.home-portals');
        await portals.scrollIntoViewIfNeeded();
        await expect(portals).toBeVisible();
        await expect(portals.locator('.home-portal-link')).toHaveCount(4);
        await expect(portals.locator('[data-analytics-event="home_portal_open"]')).toHaveCount(4);
      }
    });

    test('analytics bridge emits one page view and an allowlisted Home V2 event without PII', async ({
      page,
    }) => {
      await page.addInitScript(() => {
        (window as unknown as { capturedAnalytics: unknown[] }).capturedAnalytics = [];
        window.addEventListener('ivuru:analytics', (event) => {
          (window as unknown as { capturedAnalytics: unknown[] }).capturedAnalytics.push(
            (event as CustomEvent).detail,
          );
        });
      });

      await page.goto('/');
      await expect(page.locator('.world-loader')).toBeHidden({ timeout: 4_000 });
      const portals = page.locator('.home-portals');
      await portals.scrollIntoViewIfNeeded();
      await portals.locator('a').first().click();
      await expect(page).toHaveURL(/\/works\/?$/);

      const events = await page.evaluate(
        () =>
          (window as unknown as { capturedAnalytics: Array<Record<string, unknown>> })
            .capturedAnalytics,
      );
      expect(events.some((event) => event.name === 'page_view')).toBeTruthy();
      expect(
        events.some((event) => event.name === 'home_portal_open' && event.target === 'works'),
      ).toBeTruthy();
      expect(JSON.stringify(events)).not.toContain('email');
      expect(JSON.stringify(events)).not.toContain('message');
    });

    test('contact confirmation configures Turnstile action', async ({ page }) => {
      await page.addInitScript(() => {
        window.turnstile = {
          render: (_target: HTMLElement, options: Record<string, unknown>) => {
            (window as unknown as { turnstileAction?: string }).turnstileAction = String(
              options.action ?? '',
            );
            const callback = options.callback as ((token: string) => void) | undefined;
            callback?.('test-token');
            return 'widget-id';
          },
          reset: () => undefined,
          remove: () => undefined,
        };
      });
      await page.route('**/api/contact', (request) =>
        request.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ready: true,
            turnstileSiteKey: 'test-key',
            recipient: 'contact.ivuru@ivrm.jp',
            discordEnabled: false,
          }),
        }),
      );
      await page.goto('/contact');
      await page.getByLabel('01 / お名前').fill('ivuru');
      await page.getByLabel('02 / メールアドレス').fill('test@example.com');
      await page.getByLabel('04 / 件名').fill('テスト問い合わせ');
      await page
        .getByLabel('05 / お問い合わせ内容')
        .fill('これはお問い合わせ送信確認用の十分な長さを持つテスト本文です。');
      await page.getByRole('button', { name: '送信内容を確認' }).click();
      const turnstileAction = await page.evaluate(
        () => (window as unknown as { turnstileAction?: string }).turnstileAction ?? '',
      );
      expect(turnstileAction).toBe('contact_submit');
    });
    ''',
)

immersive_path = Path('tests/e2e/immersive-worlds.spec.ts')
immersive = immersive_path.read_text(encoding='utf-8')
start = immersive.index("test('home exposes anime scenes")
end = immersive.index("test('games page presents", start)
replacement = dedent(r'''
    test('home exposes the focused Works, Profile, Journal, and ivRm destinations', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript(() => sessionStorage.setItem('ivuru-intro-seen', '1'));
      await page.goto('/');
      await expect(page.locator('.world-loader')).toBeHidden({ timeout: 4_000 });
      const story = page.locator('[data-anime-scroll-story]');
      await expect(story).toBeVisible();
      await expect(story).toHaveAttribute('data-story-mode', 'static');
      const portals = page.locator('.home-portals');
      await portals.scrollIntoViewIfNeeded();
      await expect(portals.locator('a[href="/works"]')).toBeVisible();
      await expect(portals.locator('a[href="/profile"]')).toBeVisible();
      await expect(portals.locator('a[href="/blog"]')).toBeVisible();
      await expect(portals.locator('a[href="https://ivrm.jp"]')).toBeVisible();
    });

    ''')
immersive_path.write_text(immersive[:start] + replacement + immersive[end:], encoding='utf-8')

contact_path = Path('tests/e2e/contact.spec.ts')
contact = contact_path.read_text(encoding='utf-8')
start = contact.index("test('Digital Room shell")
end = contact.index("test('header and footer expose Contact", start)
replacement = dedent(r'''
    test('Home V2 destination shell is centered and uses the available desktop width', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      await expect(page.locator('.world-loader')).toBeHidden({ timeout: 4_000 });

      const section = page.locator('.home-portals');
      const shell = page.locator('.home-portals-shell');
      await shell.scrollIntoViewIfNeeded();
      await expect(shell.locator('.home-portal-link')).toHaveCount(4);

      const sectionBox = await section.boundingBox();
      const shellBox = await shell.boundingBox();
      expect(sectionBox).not.toBeNull();
      expect(shellBox).not.toBeNull();

      const leftGap = shellBox!.x - sectionBox!.x;
      const rightGap = sectionBox!.x + sectionBox!.width - (shellBox!.x + shellBox!.width);
      expect(Math.abs(leftGap - rightGap)).toBeLessThan(4);
      expect(shellBox!.width).toBeGreaterThan(sectionBox!.width * 0.65);
    });

    ''')
contact_path.write_text(contact[:start] + replacement + contact[end:], encoding='utf-8')

site_path = Path('tests/e2e/site.spec.ts')
site = site_path.read_text(encoding='utf-8')
start = site.index("test('social embeds require")
end = site.index("test('brand OGP", start)
replacement = dedent(r'''
    test('Home V2 keeps third-party social scripts unloaded and routes to focused pages', async ({ page }) => {
      await page.route('https://platform.x.com/**', (route) => route.abort());
      await page.route('https://platform.twitter.com/**', (route) => route.abort());
      await page.goto('/');
      await expect(page.locator('.world-loader')).toBeHidden({ timeout: 4_000 });
      await expect(page.locator('#x-widgets-script')).toHaveCount(0);
      await expect(page.locator('#instagram-embed-script')).toHaveCount(0);
      const portals = page.locator('.home-portals');
      await portals.scrollIntoViewIfNeeded();
      await expect(portals.locator('a[href="/profile"]')).toBeVisible();
      await expect(portals.locator('a[href="https://ivrm.jp"]')).toBeVisible();
    });

    ''')
site_path.write_text(site[:start] + replacement + site[end:], encoding='utf-8')

write(
    'tests/e2e/signal-links.spec.ts',
    r'''
    import { expect, test } from '@playwright/test';

    test('Spotify remains deferred on Profile while Home V2 stays focused', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.world-loader')).toBeHidden({ timeout: 4_000 });
      await expect(page.locator('iframe[src*="open.spotify.com"]')).toHaveCount(0);
      const portals = page.locator('.home-portals');
      await portals.scrollIntoViewIfNeeded();
      await expect(portals.locator('.home-portal-link')).toHaveCount(4);
      await expect(portals.locator('a[href="/profile"]')).toBeVisible();

      await page.goto('/profile#favorites');
      const favorites = page.locator('#favorites');
      await expect(favorites).toBeVisible();
      await expect(favorites.locator('iframe')).toHaveCount(0);
      const consent = favorites.locator('[data-spotify-loaded="false"]');
      await expect(consent).toBeVisible();
      await consent.getByRole('button').click();
      await expect(page.locator('iframe[src*="open.spotify.com/embed/playlist"]')).toHaveCount(1);
      await expect(favorites.locator('[data-spotify-loaded="true"]')).toBeVisible();
    });
    ''',
)

write(
    'tests/e2e/no-js-story.spec.ts',
    r'''
    import { expect, test } from '@playwright/test';

    test('JavaScriptが無効でも3章と主要4導線を縦積み表示する', async ({ browser }) => {
      const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width: 390, height: 844 },
        colorScheme: 'dark',
        locale: 'ja-JP',
      });

      try {
        const page = await context.newPage();
        const response = await page.goto('/');
        expect(response?.ok()).toBeTruthy();

        const story = page.locator('[data-anime-scroll-story]');
        await expect(story).toBeVisible();
        await expect(story).not.toHaveAttribute('data-story-mode');

        const scenes = story.locator('[data-anime-story-scene]');
        await expect(scenes).toHaveCount(3);
        for (const scene of await scenes.all()) {
          await expect(scene).toBeVisible();
          await expect(scene).toHaveCSS('position', 'relative');
          await expect(scene).toHaveCSS('visibility', 'visible');
          await expect(scene).toHaveCSS('opacity', '1');
        }

        const portals = page.locator('.home-portal-link');
        await expect(portals).toHaveCount(4);
        await expect(portals.nth(0)).toHaveAttribute('href', '/works');
        await expect(portals.nth(1)).toHaveAttribute('href', '/profile');
        await expect(portals.nth(2)).toHaveAttribute('href', '/blog');
        await expect(portals.nth(3)).toHaveAttribute('href', 'https://ivrm.jp');

        await expect(story.locator('.anime-story-progress')).toHaveCSS('display', 'none');
        await expect(story.locator('.anime-scroll-cue')).toHaveCSS('display', 'none');
        expect(
          await page.evaluate(
            () => document.documentElement.scrollHeight > document.documentElement.clientHeight * 3,
          ),
        ).toBeTruthy();
      } finally {
        await context.close();
      }
    });
    ''',
)
