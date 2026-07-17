import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('scroll performance contract', () => {
  it('共通表示演出はIntersectionObserverを使用しscroll listenerを持たない', () => {
    const source = readSource('src/components/effects/ScrollEffects.tsx');

    expect(source).toContain('IntersectionObserver');
    expect(source).not.toMatch(/addEventListener\(\s*['"]scroll['"]/);
    expect(source).not.toContain('ScrollTrigger');
    expect(source).not.toContain('clipPath');
    expect(source).not.toContain('filter:');
  });

  it('ストーリーGSAPは必要時に動的読込しtransformとopacityだけを更新する', () => {
    const source = readSource('src/components/effects/AnimeScrollDirector.tsx');

    expect(source).toContain("import('gsap')");
    expect(source).toContain("import('gsap/ScrollTrigger')");
    expect(source).not.toMatch(/^import .* from ['"]gsap/m);
    expect(source).not.toContain('clipPath');
    expect(source).not.toContain('filter:');
    expect(source).not.toMatch(/addEventListener\(\s*['"]scroll['"]/);
    expect(source).toContain("data.storyPerformance = 'transform-only'");
  });

  it('ポインター演出はrequestAnimationFrameと可視領域監視で集約する', () => {
    const source = readSource('src/components/effects/CinematicPointerEffects.tsx');

    expect(source).toContain('requestAnimationFrame');
    expect(source).toContain('IntersectionObserver');
    expect(source).toContain('ResizeObserver');
    expect(source).not.toMatch(/addEventListener\(\s*['"]scroll['"]/);
  });
});
