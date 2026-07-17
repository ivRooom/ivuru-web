import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('dual 3D intro loader contract', () => {
  it('Vanilla HTML/CSS/JSだけで2種類のテーマを提供する', () => {
    const source = readSource('src/components/common/IntroLoader.astro');

    expect(source).toContain('ORBIT &amp; PHASE');
    expect(source).toContain('LOW-POLY DRIVE');
    expect(source).toContain('loader-theme--orbit');
    expect(source).toContain('loader-theme--drive');
    expect(source).toContain('orbit-sphere');
    expect(source).toContain('low-poly-car');
    expect(source).not.toContain('from \'react\'');
    expect(source).not.toContain('three');
    expect(source).not.toContain('canvas');
  });

  it('リロードごとにテーマを交互に切り替える', () => {
    const source = readSource('src/components/common/IntroLoader.astro');

    expect(source).toContain("sessionStorage.getItem('ivuru-loader-theme')");
    expect(source).toContain("previous === 'orbit' ? 'drive'");
    expect(source).toContain("previous === 'drive' ? 'orbit'");
    expect(source).toContain("root.dataset.loaderTheme = next");
  });

  it('ロード完了時にloadedクラスでフェードアウトする', () => {
    const source = readSource('src/components/common/IntroLoader.astro');

    expect(source).toContain("loader.classList.add('loaded')");
    expect(source).toContain('.dual-loader.loaded');
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
  });

  it('ループ演出はtransform/opacity中心でReduced Motionと非アクティブタブに対応する', () => {
    const source = readSource('src/components/common/IntroLoader.astro');

    expect(source).toContain('@media (prefers-reduced-motion: reduce)');
    expect(source).toContain("html[data-document-active='false']");
    expect(source).toContain('animation-play-state: paused');
    expect(source).toContain('transform: translate3d');
    expect(source).toContain('opacity:');
    expect(source).not.toMatch(/addEventListener\(\s*['"]scroll['"]/);
  });

  it('トップページのみで描画し旧React Islandを使用しない', () => {
    const layout = readSource('src/layouts/BaseLayout.astro');

    expect(layout).toContain("const isHome = normalized === '/'");
    expect(layout).toContain('{isHome && <IntroLoader');
    expect(layout).toContain("import IntroLoader from '@/components/common/IntroLoader.astro'");
    expect(layout).not.toContain('<IntroLoader locale={locale} client:load');
  });
});
