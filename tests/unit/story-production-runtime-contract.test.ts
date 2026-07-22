import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('story production runtime contract', () => {
  it('Homeは旧Progress Authorityではなく本番Runtimeを一度だけ遅延起動する', () => {
    const home = readSource('src/components/pages/HomePageV2.astro');
    const bootstrap = readSource('src/components/effects/StoryEffectsRuntime.tsx');

    expect(home).toContain(
      "import StoryEffectsRuntime from '@/components/effects/StoryEffectsRuntime'",
    );
    expect(home).toContain('<StoryEffectsRuntime client:load />');
    expect(bootstrap).toContain('const StoryProductionRuntime = lazy(');
    expect(bootstrap).toContain("() => import('@/components/effects/StoryProductionRuntime')");
    expect(bootstrap.match(/<StoryProductionRuntime \/>/g)).toHaveLength(1);
    expect(home).not.toContain('StoryProgressAuthority');
  });

  it('RuntimeはScrollTriggerの実progressを参照しGSAPタイムラインを強制更新しない', () => {
    const source = readSource('src/components/effects/StoryProductionRuntime.tsx');

    expect(source).toContain('currentTrigger.progress');
    expect(source).toContain('storyScrollStart');
    expect(source).toContain('storyScrollEnd');
    expect(source).not.toContain('animation.progress(');
    expect(source).not.toContain('pinned.animation');
    expect(source).toContain("window.addEventListener('pageshow'");
    expect(source).toContain("document.addEventListener('visibilitychange'");
    expect(source).toContain('window.visualViewport');
    expect(source).toContain("applyStaticStory(elements, 'motion-boot-timeout')");
  });

  it('iOS viewport・Safe Area・Reduced Motion・スキップ導線を持つ', () => {
    const css = readSource('src/styles/story-production-runtime.css');
    const skipLink = readSource('src/components/home/StorySkipLink.astro');

    expect(css).toContain('100svh');
    expect(css).toContain('100dvh');
    expect(css).toContain('env(safe-area-inset-top)');
    expect(css).toContain('touch-action: pan-y pinch-zoom');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(skipLink).toContain('data-story-skip');
    expect(skipLink).toContain('#anime-story-after');
    expect(skipLink).toContain('스크롤 연출을 건너뛰고');
  });
});
