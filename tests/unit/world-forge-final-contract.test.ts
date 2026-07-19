// World Forge、Progress Authority、Omega Riftの最終統合をCIで固定する。
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('World Forge final integration contract', () => {
  it('章間ゲートとQuantum Gateローダーを同じportal-forward世界観で統合する', () => {
    const home = readSource('src/components/pages/HomePageV2.astro');
    const director = readSource('src/components/effects/AnimeScrollDirector.tsx');
    const camera = readSource('src/components/effects/SpatialCameraEnhancer.tsx');
    const loader = readSource('src/components/common/IntroLoader.astro');
    const authority = readSource('src/components/effects/StoryProgressAuthority.tsx');
    const omega = readSource('src/components/effects/OmegaWorldRift.astro');

    expect(home).toContain("import '@/styles/chapter-gate-transitions.css'");
    expect(home).toContain('<StoryProgressAuthority client:load />');
    expect(home).toContain('<OmegaWorldRift />');
    expect(director).toContain("'[data-anime-scroll-stage]'");
    expect(director).toContain("root.dataset.storyDirector = 'ready'");
    expect(director).toContain("root.dataset.storyAxis = 'portal-forward'");
    expect(camera).toContain("root.dataset.storyCameraPath = 'portal-forward-stabilized'");
    expect(loader).toContain('ENGINE: WORLD_FORGE / PORTAL_FORWARD');
    expect(loader).toContain('data-loader-theme="quantum-world-gate"');
    expect(authority).toContain("root.dataset.storyProgressAuthority = 'ready'");
    expect(authority).toContain("window.addEventListener('scroll'");
    expect(authority).toContain('pinned.animation.progress(progress, false)');
    expect(omega).toContain('OMEGA WORLD SHIFT');
    expect(omega).toContain('NEXUS ASCENSION');
  });
});
