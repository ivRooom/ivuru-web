import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('quantum world gate intro loader contract', () => {
  it('ワールドゲート起動シークエンスをSSRで提供する', () => {
    const source = readSource('src/components/common/IntroLoader.astro');

    expect(source).toContain("import '@/styles/quantum-gate-loader.css'");
    expect(source).toContain('IVURU / WORLD GATE OS');
    expect(source).toContain('SEQUENCE 00 · SINGULARITY BOOT');
    expect(source).toContain('data-loader-theme="quantum-world-gate"');
    expect(source).toContain('quantum-loader__gate');
    expect(source).toContain('quantum-loader__core');
    expect(source).toContain('quantum-loader__tunnel');
    expect(source).toContain('length: 24');
    expect(source).toContain('length: 18');
    expect(source).toContain('length: 12');
    expect(source).toContain('length: 10');
    expect(source).not.toContain("from 'react'");
    expect(source).not.toContain("from 'three'");
    expect(source).not.toContain('<canvas');
  });

  it('進捗を4フェーズへ変換しゲート開放で終了する', () => {
    const source = readSource('src/components/common/IntroLoader.astro');

    expect(source).toContain("key: 'sync'");
    expect(source).toContain("key: 'forge'");
    expect(source).toContain("key: 'ignite'");
    expect(source).toContain("key: 'open'");
    expect(source).toContain("stateText.textContent = 'WORLD LINK READY'");
    expect(source).toContain("loader.classList.add('loaded')");
    expect(source).toContain("document.body.classList.remove('site-loading')");
    expect(source).toContain('quantum-gate-open');
  });

  it('読み上げ可能な進捗情報を維持する', () => {
    const source = readSource('src/components/common/IntroLoader.astro');

    expect(source).toContain('role="status"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('role="progressbar"');
    expect(source).toContain('aria-valuemin="0"');
    expect(source).toContain('aria-valuemax="100"');
    expect(source).toContain("progressbar?.setAttribute('aria-valuenow'");
    expect(source).toContain('renderProgress(0)');
  });

  it('終了時にコア収束・ゲート爆発・カーテン開放を行う', () => {
    const styles = readSource('src/styles/quantum-gate-loader.css');

    expect(styles).toContain('@keyframes quantum-gate-release');
    expect(styles).toContain('@keyframes quantum-curtain-left');
    expect(styles).toContain('@keyframes quantum-curtain-right');
    expect(styles).toContain('@keyframes quantum-release-flash');
    expect(styles).toContain('.quantum-gate-loader.loaded');
    expect(styles).toContain('visibility: hidden');
  });

  it('Reduced Motion・非アクティブタブ・狭い画面へ対応する', () => {
    const styles = readSource('src/styles/quantum-gate-loader.css');

    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(styles).toContain("html[data-document-active='false']");
    expect(styles).toContain('animation-play-state: paused');
    expect(styles).toContain('@media (max-width: 680px)');
    expect(styles).toContain('@media (max-height: 620px)');
    expect(styles).toContain('env(safe-area-inset-top)');
    expect(styles).toContain('transform: none !important');
  });

  it('トップページのみで描画しVanilla Astroとして動作する', () => {
    const layout = readSource('src/layouts/BaseLayout.astro');

    expect(layout).toContain("const isHome = normalized === '/'");
    expect(layout).toContain('{isHome && <IntroLoader');
    expect(layout).toContain("import IntroLoader from '@/components/common/IntroLoader.astro'");
    expect(layout).not.toContain('<IntroLoader locale={locale} client:load');
  });
});
