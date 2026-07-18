import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('world forge chapter transition contract', () => {
  it('01→02→03を共通のポータル前進軸で受け渡す', () => {
    const source = readSource('src/components/effects/AnimeScrollDirector.tsx');

    expect(source).toContain("root.dataset.storyTransitionEngine = 'world-forge'");
    expect(source).toContain("root.dataset.storyAxis = 'portal-forward'");
    expect(source).toContain('const CHAPTER_SEGMENT = 2.4');
    expect(source).toContain('const CHAPTER_HOLD = 1.04');
    expect(source).toContain("phase = 'charge'");
    expect(source).toContain("? 'collapse'");
    expect(source).toContain("? 'burst'");
    expect(source).toContain(": 'reveal'");
    expect(source).not.toContain('SPATIAL_SCENE_PROFILES');
  });

  it('章間ゲートを決定的な要素数で生成する', () => {
    const source = readSource('src/components/effects/AnimeScrollDirector.tsx');

    expect(source).toContain('const GATE_BLADE_COUNT = 12');
    expect(source).toContain('const GATE_RAY_COUNT = 18');
    expect(source).toContain('const GATE_SHARD_COUNT = 10');
    expect(source).toContain('data-chapter-gate');
    expect(source).toContain('WORLD FORGE / BUILD');
    expect(source).toContain('NEXUS LINK / CONNECT');
    expect(source).toContain('--chapter-gate-progress');
  });

  it('カメラ軌道を安定化しピン距離を章演出へ同期する', () => {
    const source = readSource('src/components/effects/SpatialCameraEnhancer.tsx');

    expect(source).toContain("root.dataset.storyCamera = 'multi-axis'");
    expect(source).toContain("root.dataset.storyCameraPath = 'portal-forward-stabilized'");
    expect(source).toContain('compact ? 5.7 : 7.2');
    expect(source).toContain('pinnedStory.refresh()');
    expect(source).toContain("root.dataset.spatialCameraReady = 'true'");
  });

  it('ゲートCSSがフラッシュ・シャッター・光線・破片を描画する', () => {
    const styles = readSource('src/styles/chapter-gate-transitions.css');

    expect(styles).toContain('.anime-chapter-gate__iris');
    expect(styles).toContain('.anime-chapter-gate__shutter--left');
    expect(styles).toContain('.anime-chapter-gate__shutter--right');
    expect(styles).toContain('.anime-chapter-gate__flash');
    expect(styles).toContain('.anime-chapter-gate__rays');
    expect(styles).toContain('.anime-chapter-gate__shards');
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(styles).toContain('display: none !important');
  });
});
