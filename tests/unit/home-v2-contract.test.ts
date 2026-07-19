import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('home page v2 contract', () => {
  it('スクロールストーリーを3章と多層3D構造に整理する', () => {
    const story = readSource('src/components/home/AnimeScrollStory.astro');

    expect(story.match(/data-anime-story-scene=/g)).toHaveLength(3);
    expect(story).toContain('01 / 03');
    expect(story).toContain('data-story-camera-rig');
    expect(story.match(/data-story-flyby/g)).toHaveLength(5);
    expect(story).toContain('data-story-depth="far"');
    expect(story).toContain('data-story-depth="mid"');
    expect(story).toContain('data-story-depth="near"');
    expect(story).toContain('data-story-depth="front"');
  });

  it('安定化したカメラと章間ワールドゲートを持つ', () => {
    const camera = readSource('src/components/effects/SpatialCameraEnhancer.tsx');
    const director = readSource('src/components/effects/AnimeScrollDirector.tsx');
    const styles = readSource('src/styles/chapter-gate-transitions.css');

    expect(camera).toContain("root.dataset.storyCamera = 'multi-axis'");
    expect(camera).toContain("root.dataset.storyCameraPath = 'portal-forward-stabilized'");
    expect(camera).toContain("root.dataset.spatialCameraReady = 'pending'");
    expect(camera).toContain("root.dataset.spatialCameraReady = 'true'");
    expect(camera).toContain('--story-perspective-x');
    expect(camera).toContain('--story-perspective-y');
    expect(camera).toContain('[data-story-flyby]');
    expect(camera).toContain('[data-story-depth="front"]');
    expect(camera).toContain('syncPinnedStory(attempt + 1)');
    expect(camera).toContain('attempt < 30');
    expect(director).toContain("root.dataset.storyTransitionEngine = 'world-forge'");
    expect(styles).toContain('.anime-chapter-gate');
    expect(styles).toContain('.anime-chapter-gate__iris');
  });

  it('重要なスクロール演出を初回表示で確実に起動する', () => {
    const home = readSource('src/components/pages/HomePageV2.astro');

    expect(home).toContain('<AnimeScrollDirector client:load />');
    expect(home).toContain('<SpatialCameraEnhancer client:load />');
    expect(home).toContain('<CinematicEntertainmentDirector client:load />');
    expect(home).toContain('<SingularityOverdriveDirector client:load />');
    expect(home).toContain('<CinematicPointerEffects client:idle />');
    expect(home).toContain("import '@/styles/chapter-gate-transitions.css'");
  });

  it('トップページを代表情報と主要導線だけに絞る', () => {
    const home = readSource('src/components/pages/HomePageV2.astro');
    const works = readSource('src/components/home/FeaturedWorks.astro');
    const posts = readSource('src/components/blog/LatestPosts.astro');

    expect(home).toContain('FeaturedWorks');
    expect(home).toContain('HomePortalGrid');
    expect(home).toContain('LatestPosts');
    expect(home).toContain('ContactCTA');
    expect(home).not.toContain('IdentitySection');
    expect(home).not.toContain('ActivityCommandCenter');
    expect(home).not.toContain('CommunitySection');
    expect(home).not.toContain('MediaReel');
    expect(home).not.toContain('SocialDock');
    expect(works).toContain('.slice(0, 3)');
    expect(posts).toContain('.slice(0, 2)');
  });

  it('Reduced Motionでは追加3D演出と章間ゲートを停止する', () => {
    const styles = readSource('src/styles/spatial-home-v2.css');
    const gateStyles = readSource('src/styles/chapter-gate-transitions.css');
    const mediaStart = styles.indexOf('@media (prefers-reduced-motion: reduce)');
    const mediaEnd = styles.indexOf('/* Home V2 static and no-JS fallback */', mediaStart);

    expect(mediaStart).toBeGreaterThanOrEqual(0);
    expect(mediaEnd).toBeGreaterThan(mediaStart);
    const reducedMotionBlock = styles.slice(mediaStart, mediaEnd);
    expect(reducedMotionBlock).toContain('transform: none !important');
    expect(reducedMotionBlock).toContain('animation: none !important');
    expect(reducedMotionBlock).toContain('.anime-depth-flybys');
    expect(gateStyles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(gateStyles).toContain('display: none !important');
  });
});
