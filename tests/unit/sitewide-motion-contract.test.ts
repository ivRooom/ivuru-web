import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('site-wide motion and navigation contract', () => {
  it('操作・表示・主役演出を共通Motion Tokenで分離する', () => {
    const css = readSource('src/styles/motion-system.css');
    const tokens = readSource('src/lib/motion.ts');

    expect(css).toContain('--motion-instant:');
    expect(css).toContain('--motion-fast:');
    expect(css).toContain('--motion-standard:');
    expect(css).toContain('--motion-cinematic:');
    expect(css).toContain('--motion-apple-ease: cubic-bezier(0.16, 1, 0.3, 1)');
    expect(css).toContain('--motion-apple-spring: cubic-bezier(0.22, 1.24, 0.36, 1)');
    expect(css).toContain('--motion-exit-ease:');
    expect(css).toContain('--motion-stagger:');
    expect(tokens).toContain('MOTION_DURATION');
    expect(tokens).toContain('MOTION_EASE');
    expect(tokens).toContain('MOTION_STAGGER');
  });

  it('Astro ClientRouterと遷移ライフサイクルを共通Layoutへ統合する', () => {
    const layout = readSource('src/layouts/BaseLayout.astro');
    const lifecycle = readSource('src/components/common/NavigationLifecycle.astro');

    expect(layout).toContain('<ClientRouter fallback="animate" />');
    expect(layout).toContain('<NavigationLifecycle />');
    expect(layout).toContain('data-route-state="idle"');
    expect(layout).toContain('transition:name="site-header"');
    expect(layout).toContain('transition:name="page-content"');
    expect(lifecycle).toContain("'astro:before-preparation'");
    expect(lifecycle).toContain("'astro:after-preparation'");
    expect(lifecycle).toContain("'astro:after-swap'");
    expect(lifecycle).toContain("'astro:page-load'");
    expect(lifecycle).toContain('focusRouteTarget');
  });

  it('HeaderはIntersection Observerを使い直接scroll listenerを持たない', () => {
    const header = readSource('src/components/common/Header.astro');

    expect(header).toContain('IntersectionObserver');
    expect(header).toContain('[data-header-sentinel]');
    expect(header).toContain('aria-current');
    expect(header).toContain('header-location');
    expect(header).not.toMatch(/addEventListener\(\s*['"]scroll['"]/);
  });

  it('Mobile MenuはEscape・Focus Trap・inert・共通Tokenへ対応する', () => {
    const menu = readSource('src/components/common/MobileMenu.tsx');

    expect(menu).toContain("event.key === 'Escape'");
    expect(menu).toContain("event.key !== 'Tab'");
    expect(menu).toContain('element.inert = true');
    expect(menu).toContain("'ivuru:route-start'");
    expect(menu).toContain('MOTION_DURATION');
    expect(menu).toContain('MOTION_EASE');
    expect(menu).not.toContain('clipPath');
  });

  it('Reduced Motionと非アクティブタブでは大きな演出を停止する', () => {
    const css = readSource('src/styles/motion-system.css');
    const lifecycle = readSource('src/components/common/NavigationLifecycle.astro');

    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('animation: none !important');
    expect(css).toContain("html[data-document-active='false']");
    expect(lifecycle).toContain("document.addEventListener('visibilitychange'");
  });

  it('ページ遷移はtransformとopacity中心で実装する', () => {
    const css = readSource('src/styles/motion-system.css');

    expect(css).toContain('transform: translate3d');
    expect(css).toContain('opacity: 0');
    expect(css).not.toMatch(/@keyframes page-content-[\s\S]*?(?:width|height|top|left|margin):/);
  });
});
