import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('Adaptive Reality evolution contract', () => {
  it('Home V2へ操作反応型Reality Directorとローダー進化層を統合する', () => {
    const home = readSource('src/components/pages/HomePageV2.astro');

    expect(home).toContain(
      "import AdaptiveRealityDirector from '@/components/effects/AdaptiveRealityDirector'",
    );
    expect(home).toContain(
      "import QuantumLoaderEvolution from '@/components/effects/QuantumLoaderEvolution.astro'",
    );
    expect(home).toContain("import '@/styles/adaptive-reality-overdrive.css'");
    expect(home).toContain('<AdaptiveRealityDirector client:load />');
    expect(home).toContain('<QuantumLoaderEvolution />');
  });

  it('スクロールリスナーを使わず入力速度と遷移属性から演出強度を更新する', () => {
    const source = readSource('src/components/effects/AdaptiveRealityDirector.tsx');

    expect(source).toContain(
      "story.dataset.storyRealityEngine = reducedMotion.matches ? 'static' : 'adaptive-overdrive'",
    );
    expect(source).toContain('requestAnimationFrame(renderEnergy)');
    expect(source).toContain("story.addEventListener('wheel'");
    expect(source).toContain("story.addEventListener('touchmove'");
    expect(source).toContain('MutationObserver');
    expect(source).not.toMatch(/addEventListener\(\s*['"]scroll['"]/);
    expect(source).toContain('const FRACTURE_COUNT = 14');
    expect(source).toContain('const PARTICLE_COUNT = 24');
    expect(source).toContain("transition === '01-02' ? 'forge'");
    expect(source).toContain("transition === '02-03' ? 'nexus'");
  });

  it('端末性能に応じてultra・balanced・liteを選択する', () => {
    const reality = readSource('src/components/effects/AdaptiveRealityDirector.tsx');
    const loader = readSource('src/components/effects/QuantumLoaderEvolution.astro');

    for (const quality of ['ultra', 'balanced', 'lite']) {
      expect(reality).toContain(`'${quality}'`);
      expect(loader).toContain(`'${quality}'`);
    }
    expect(loader).toContain("loader.dataset.loaderEvolution = 'reality-reactor'");
    expect(loader).toContain('data-quantum-reality-reactor');
    expect(loader).toContain('PORTAL_FORWARD');
  });

  it('CSSがforge・nexus・速度別Overdrive・Reduced Motionを描画する', () => {
    const realityStyles = readSource('src/styles/adaptive-reality-overdrive.css');
    const loaderStyles = readSource('src/styles/quantum-reality-reactor.css');

    expect(realityStyles).toContain("[data-reality-variant='nexus']");
    expect(realityStyles).toContain("[data-reality-phase='burst']");
    expect(realityStyles).toContain("[data-story-reality-intensity='overdrive']");
    expect(realityStyles).toContain('@keyframes adaptive-particle-burst');
    expect(realityStyles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(loaderStyles).toContain("[data-reactor-phase='ignite']");
    expect(loaderStyles).toContain("[data-reactor-phase='release']");
    expect(loaderStyles).toContain('@keyframes reactor-release');
    expect(loaderStyles).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
