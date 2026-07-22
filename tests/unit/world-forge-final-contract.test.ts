// World Forge、Adaptive Reality、Quantum Gateの最終統合をCIで固定する。
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('World Forge final integration contract', () => {
  it('章間ゲート・Adaptive Reality・Quantum Gateをportal-forward世界観で統合する', () => {
    const home = readSource('src/components/pages/HomePageV2.astro');
    const bootstrap = readSource('src/components/effects/StoryEffectsRuntime.tsx');
    const director = readSource('src/components/effects/AnimeScrollDirector.tsx');
    const reality = readSource('src/components/effects/AdaptiveRealityDirector.tsx');
    const camera = readSource('src/components/effects/SpatialCameraEnhancer.tsx');
    const loader = readSource('src/components/common/IntroLoader.astro');
    const loaderEvolution = readSource('src/components/effects/QuantumLoaderEvolution.astro');

    expect(home).toContain("import '@/styles/chapter-gate-transitions.css'");
    expect(home).toContain("import '@/styles/adaptive-reality-overdrive.css'");
    expect(home).toContain('<StoryEffectsRuntime client:load />');
    expect(bootstrap).toContain('<AdaptiveRealityDirector />');
    expect(home).toContain('<QuantumLoaderEvolution />');
    expect(bootstrap).toContain("document.addEventListener('ivuru:loader-runtime-safe', sync)");
    expect(bootstrap).toContain('const AdaptiveRealityDirector = lazy(');
    expect(director).toContain("'[data-anime-scroll-stage]'");
    expect(director).toContain("root.dataset.storyDirector = 'ready'");
    expect(director).toContain("root.dataset.storyAxis = 'portal-forward'");
    expect(reality).toContain("'adaptive-overdrive'");
    expect(reality).toContain("transition === '01-02' ? 'forge'");
    expect(reality).toContain("transition === '02-03' ? 'nexus'");
    expect(camera).toContain("root.dataset.storyCameraPath = 'portal-forward-stabilized'");
    expect(loader).toContain('ENGINE: WORLD_FORGE / PORTAL_FORWARD');
    expect(loader).toContain('data-loader-theme="quantum-world-gate"');
    expect(loaderEvolution).toContain("loader.dataset.loaderEvolution = 'reality-reactor'");
    expect(loaderEvolution).toContain('data-quantum-reality-reactor');
  });
});
