import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('iOS story director recovery contract', () => {
  it('HomeはストーリーDOM直後にAstro Recoveryを実行する', () => {
    const source = readSource('src/components/pages/HomePageV2.astro');
    const storyIndex = source.indexOf('<AnimeScrollStory locale={locale} />');
    const recoveryIndex = source.indexOf('<IOSStoryDirectorRecovery />');

    expect(source).toContain(
      "import IOSStoryDirectorRecovery from '@/components/effects/IOSStoryDirectorRecovery.astro'",
    );
    expect(storyIndex).toBeGreaterThan(-1);
    expect(recoveryIndex).toBeGreaterThan(storyIndex);
    expect(source).not.toContain('<IOSStoryDirectorRecovery client:load />');
  });

  it('RecoveryはHydrationに依存せず章・ARIA・画面回転を同期する', () => {
    const source = readSource('src/components/effects/IOSStoryDirectorRecovery.astro');

    expect(source).toContain('<script is:inline>');
    expect(source).toContain('const recoveryDelay = 0');
    expect(source).toContain('const recoveryHeartbeatMs = 120');
    expect(source).toContain("root.dataset.storyNativeRecovery = 'true'");
    expect(source).toContain("setData('storyDirector', 'ready')");
    expect(source).toContain("setData('storyRuntime', 'ready')");
    expect(source).toContain("setData('storyMobileStability', 'ready')");
    expect(source).toContain("setData('storyTransitionEngine', 'ios-inline-recovery')");
    expect(source).toContain("setData('storyScrollStart'");
    expect(source).toContain("setData('storyScrollEnd'");
    expect(source).toContain("scene.setAttribute('aria-hidden', ariaHidden)");
    expect(source).toContain("scene.toggleAttribute('inert', !active)");
    expect(source).toContain("source: 'ios-inline-recovery'");
    expect(source).toContain("window.addEventListener('orientationchange'");
    expect(source).toContain('new MutationObserver');
    expect(source).toContain('window.setInterval(sync, recoveryHeartbeatMs)');
  });
});
