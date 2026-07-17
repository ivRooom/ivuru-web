import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('multi-axis spatial scroll motion contract', () => {
  it('4章それぞれに異なる3D侵入・退出軌道を持つ', () => {
    const source = readSource('src/components/effects/AnimeScrollDirector.tsx');
    const profiles = source.slice(
      source.indexOf('const SPATIAL_SCENE_PROFILES'),
      source.indexOf('const resolvePose'),
    );

    expect(source).toContain('SPATIAL_SCENE_PROFILES');
    expect(profiles.match(/sceneIn:/g)).toHaveLength(4);
    expect(profiles.match(/sceneOut:/g)).toHaveLength(4);
    expect(source).toContain("root.dataset.storyCamera = 'multi-axis'");
    expect(source).toContain('resolvePose');
    expect(source).toContain('rotateX');
    expect(source).toContain('rotateY');
    expect(source).toContain('rotateZ');
    expect(source).toContain('[data-story-depth="far"]');
    expect(source).toContain('[data-story-depth="mid"]');
    expect(source).toContain('[data-story-depth="near"]');
  });

  it('後続セクションへ複数方向のRevealと3D Parallaxを割り当てる', () => {
    const source = readSource('src/components/effects/ScrollEffects.tsx');

    expect(source).toContain('REVEAL_PROFILES');
    expect(source).toContain('left-depth');
    expect(source).toContain('right-front');
    expect(source).toContain('top-left');
    expect(source).toContain('bottom-right');
    expect(source).toContain('center-depth');
    expect(source).toContain('dataset.scrollRevealDirection');
    expect(source).toContain('dataset.scrollParallaxDirection');
    expect(source).not.toMatch(/addEventListener\(\s*['"]scroll['"]/);
  });

  it('CSSがX・Y・Z移動と3軸回転を描画する', () => {
    const source = readSource('src/styles/scroll-performance.css');
    const story = readSource('src/styles/anime-scroll-story.css');

    expect(source).toContain("[data-scroll-space='true']");
    expect(source).toContain('--scroll-enter-x');
    expect(source).toContain('--scroll-enter-y');
    expect(source).toContain('--scroll-enter-z');
    expect(source).toContain('rotateX(var(--scroll-enter-rotate-x');
    expect(source).toContain('rotateY(var(--scroll-enter-rotate-y');
    expect(source).toContain('rotateZ(var(--scroll-enter-rotate-z');
    expect(source).toContain('@keyframes native-view-parallax-3d');
    expect(story).toContain('perspective: clamp(980px, 78vw, 1280px)');
    expect(story).toContain('perspective-origin: 50% 44%');
  });

  it('Reduced Motionでは3Dスクロール演出を停止する', () => {
    const source = readSource('src/styles/scroll-performance.css');

    expect(source).toContain('@media (prefers-reduced-motion: reduce)');
    expect(source).toContain('animation: none !important');
    expect(source).toContain('transition: none !important');
    expect(source).toContain('transform: none !important');
  });
});