import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('iOS story director recovery contract', () => {
  it('Homeは通常Directorの直後にiOS Recoveryを起動する', () => {
    const source = readSource('src/components/pages/HomePageV2.astro');
    const directorIndex = source.indexOf('<AnimeScrollDirector client:load />');
    const recoveryIndex = source.indexOf('<IOSStoryDirectorRecovery client:load />');

    expect(source).toContain(
      "import IOSStoryDirectorRecovery from '@/components/effects/IOSStoryDirectorRecovery'",
    );
    expect(directorIndex).toBeGreaterThan(-1);
    expect(recoveryIndex).toBeGreaterThan(directorIndex);
  });

  it('RecoveryはiOSだけで停止したDirectorを引き継ぎ章とARIAを同期する', () => {
    const source = readSource('src/components/effects/IOSStoryDirectorRecovery.tsx');

    expect(source).toContain('const RECOVERY_DELAY_MS = 1_800');
    expect(source).toContain("root.dataset.storyDirector = 'ready'");
    expect(source).toContain("root.dataset.storyRuntime = 'ready'");
    expect(source).toContain("root.dataset.storyMobileStability = 'ready'");
    expect(source).toContain("root.dataset.storyTransitionEngine = 'ios-recovery'");
    expect(source).toContain('root.dataset.storyScrollStart');
    expect(source).toContain('root.dataset.storyScrollEnd');
    expect(source).toContain("scene.setAttribute('aria-hidden', active ? 'false' : 'true')");
    expect(source).toContain("scene.toggleAttribute('inert', !active)");
    expect(source).toContain("source: 'ios-director-recovery'");
    expect(source).toContain('realDirectorIsReady()');
  });
});
