import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('singularity overdrive contract', () => {
  it('トップページへ必殺技級のSingularity Overdriveを接続する', () => {
    const home = readSource('src/components/pages/HomePageV2.astro');

    expect(home).toContain("import SingularityOverdriveDirector from '@/components/effects/SingularityOverdriveDirector'");
    expect(home).toContain("import '@/styles/singularity-overdrive.css'");
    expect(home).toContain('<SingularityOverdriveDirector client:load />');
  });

  it('収束・爆発・光速トンネルを決定的な要素数で構成する', () => {
    const director = readSource('src/components/effects/SingularityOverdriveDirector.tsx');

    expect(director).toContain('const SINGULARITY_RAY_COUNT = 24');
    expect(director).toContain('const SINGULARITY_FRAGMENT_COUNT = 12');
    expect(director).toContain("root.dataset.storyOverdrive = 'singularity-overdrive'");
    expect(director).toContain("root.dataset.overdrivePhase = 'charge'");
    expect(director).toContain("'collapse'");
    expect(director).toContain("'burst'");
    expect(director).toContain("'tunnel'");
    expect(director).toContain('--singularity-progress');
    expect(director).toContain("import('gsap/ScrollTrigger')");
    expect(director).toContain('IVURU // SINGULARITY');
    expect(director).toContain('OVERDRIVE');
  });

  it('Reduced MotionではOverdriveを生成せず完全停止する', () => {
    const director = readSource('src/components/effects/SingularityOverdriveDirector.tsx');
    const styles = readSource('src/styles/singularity-overdrive.css');
    const mediaStart = styles.indexOf('@media (prefers-reduced-motion: reduce)');

    expect(director).toContain("root.dataset.storyOverdrive = 'static'");
    expect(mediaStart).toBeGreaterThanOrEqual(0);
    const reducedMotionBlock = styles.slice(mediaStart);
    expect(reducedMotionBlock).toContain('.anime-singularity-overdrive');
    expect(reducedMotionBlock).toContain('display: none !important');
    expect(reducedMotionBlock).toContain('animation: none !important');
    expect(reducedMotionBlock).toContain('transform: none !important');
  });
});
