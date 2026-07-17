import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('orbital intro loader contract', () => {
  it('Vanilla HTML/CSS/JSだけで単一のOrbital Coreを提供する', () => {
    const source = readSource('src/components/common/IntroLoader.astro');

    expect(source).toContain('IVURU / ORBITAL CORE');
    expect(source).toContain('orbital-system');
    expect(source).toContain('orbital-core');
    expect(source).toContain('orbital-ring--outer');
    expect(source).not.toContain('LOW-POLY DRIVE');
    expect(source).not.toContain('low-poly-car');
    expect(source).not.toContain("from 'react'");
    expect(source).not.toContain('canvas');
    expect(source).not.toContain('three');
  });

  it('ロード完了時にloadedクラスでフェードアウトする', () => {
    const source = readSource('src/components/common/IntroLoader.astro');

    expect(source).toContain("loader.classList.add('loaded')");
    expect(source).toContain('.orbital-loader.loaded');
    expect(source).toContain('opacity: 0');
    expect(source).toContain('visibility: hidden');
    expect(source).toContain("document.body.classList.remove('site-loading')");
  });

  it('進捗と読み上げ情報を維持する', () => {
    const source = readSource('src/components/common/IntroLoader.astro');

    expect(source).toContain('role="status"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('role="progressbar"');
    expect(source).toContain('aria-valuemin="0"');
    expect(source).toContain('aria-valuemax="100"');
    expect(source).toContain("progressbar?.setAttribute('aria-valuenow'");
    expect(source).toContain('renderProgress(0)');
  });

  it('transform/opacity中心でReduced Motionと非アクティブタブに対応する', () => {
    const source = readSource('src/components/common/IntroLoader.astro');

    expect(source).toContain('@media (prefers-reduced-motion: reduce)');
    expect(source).toContain("html[data-document-active='false']");
    expect(source).toContain('animation-play-state: paused');
    expect(source).toContain('transform: translate3d');
    expect(source).toContain('opacity:');
    expect(source).not.toMatch(/addEventListener\(\s*['"]scroll['"]/);
  });

  it('狭い画面と低い画面高へ対応する', () => {
    const source = readSource('src/components/common/IntroLoader.astro');

    expect(source).toContain('@media (max-width: 680px)');
    expect(source).toContain('@media (max-height: 620px)');
    expect(source).toContain('env(safe-area-inset-top)');
  });

  it('トップページのみで描画し旧React Islandを使用しない', () => {
    const layout = readSource('src/layouts/BaseLayout.astro');

    expect(layout).toContain("const isHome = normalized === '/'");
    expect(layout).toContain('{isHome && <IntroLoader');
    expect(layout).toContain("import IntroLoader from '@/components/common/IntroLoader.astro'");
    expect(layout).not.toContain('<IntroLoader locale={locale} client:load');
  });
});
