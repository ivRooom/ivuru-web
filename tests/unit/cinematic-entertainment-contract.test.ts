import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('cinematic entertainment contract', () => {
  it('ワープ・衝撃カット・巨大タイポを3章ストーリーへ組み込む', () => {
    const story = readSource('src/components/home/AnimeScrollStory.astro');

    expect(story).toContain('data-entertainment-layer');
    expect(story.match(/data-entertainment-ring/g)).toHaveLength(6);
    expect(story.match(/data-entertainment-comet/g)).toHaveLength(6);
    expect(story.match(/data-entertainment-slice/g)).toHaveLength(3);
    expect(story.match(/data-entertainment-word/g)).toHaveLength(3);
    expect(story).toContain('data-entertainment-shockwave');
    expect(story).toContain('data-entertainment-title="いゔる。"');
    expect(story).toContain('anime-device-orbits');
    expect(story).toContain('anime-community-satellites');
  });

  it('スクロール連動と操作時の衝撃波を決定的なパスで制御する', () => {
    const director = readSource('src/components/effects/CinematicEntertainmentDirector.tsx');

    expect(director).toContain("root.dataset.storyEntertainment = 'cinematic-impact'");
    expect(director).toContain('--entertainment-progress');
    expect(director).toContain('COMET_PATHS');
    expect(director).toContain('triggerTapImpact');
    expect(director).toContain("root.dataset.entertainmentTap = 'true'");
    expect(director).toContain('watchLoader(root)');
  });

  it('初期画面をカードUIではなく発光ポータル中心のキービジュアルにする', () => {
    const home = readSource('src/components/pages/HomePageV2.astro');
    const polish = readSource('src/styles/cinematic-entertainment-polish.css');

    expect(home).toContain("import '@/styles/cinematic-entertainment-polish.css'");
    expect(polish).toContain('.anime-opening-emblem .signal-key-frame');
    expect(polish).toContain('border-radius: 50%');
    expect(polish).toContain('clip-path: none');
    expect(polish).toContain('anime-title-shimmer');
    expect(polish).toContain('anime-portal-float');
    expect(polish).toContain('anime-portal-spin');
    expect(polish).toContain('anime-star-drift');
  });

  it('Reduced Motionでは追加演出を完全に停止する', () => {
    const styles = readSource('src/styles/cinematic-entertainment.css');
    const polish = readSource('src/styles/cinematic-entertainment-polish.css');
    const mediaStart = styles.indexOf('@media (prefers-reduced-motion: reduce)');
    const polishMediaStart = polish.indexOf('@media (prefers-reduced-motion: reduce)');

    expect(mediaStart).toBeGreaterThanOrEqual(0);
    const reducedMotionBlock = styles.slice(mediaStart);
    expect(reducedMotionBlock).toContain('.anime-entertainment-layer');
    expect(reducedMotionBlock).toContain('.anime-cinematic-curtain');
    expect(reducedMotionBlock).toContain('display: none !important');
    expect(reducedMotionBlock).toContain('animation: none !important');

    expect(polishMediaStart).toBeGreaterThanOrEqual(0);
    const polishReducedMotionBlock = polish.slice(polishMediaStart);
    expect(polishReducedMotionBlock).toContain('animation: none !important');
    expect(polishReducedMotionBlock).toContain('transform: none !important');
  });
});
