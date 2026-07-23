import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('mobile static story contract', () => {
  it('HomeはモバイルRecoveryを起動せず静的レイアウトCSSを読み込む', () => {
    const source = readSource('src/components/pages/HomePageV2.astro');

    expect(source).toContain('<IOSStoryRuntimeIsolation />');
    expect(source).toContain('<QuantumLoaderEvolution />');
    expect(source).toContain('<LoaderCompletionBridge />');
    expect(source).toContain('<StoryEffectsRuntime client:load />');
    expect(source).toContain("import '@/styles/story-static-stack.css'");
    expect(source).not.toContain('<IOSStoryDirectorRecovery />');
    expect(source.indexOf('<QuantumLoaderEvolution />')).toBeLessThan(
      source.indexOf('<LoaderCompletionBridge />'),
    );
    expect(source.indexOf('<LoaderCompletionBridge />')).toBeLessThan(
      source.indexOf('<StoryEffectsRuntime client:load />'),
    );
  });

  it('LoaderCompletionBridgeは途中進捗を記録し100%到達時に即時解放する', () => {
    const source = readSource('src/components/common/LoaderCompletionBridge.astro');

    expect(source).toContain("loader.dataset.loaderAnimationRan = 'true'");
    expect(source).toContain('value >= 100');
    expect(source).toContain("loader.dataset.completionBridged = 'true'");
    expect(source).toContain("loader.setAttribute('aria-hidden', 'true')");
    expect(source).toContain("document.body?.classList.remove('site-loading')");
    expect(source).toContain("new CustomEvent('ivuru:loader-released'");
  });

  it('StoryEffectsRuntimeはiOSと小画面でGSAP群を起動しない', () => {
    const source = readSource('src/components/effects/StoryEffectsRuntime.tsx');

    expect(source).toContain("matchMedia('(max-width: 767px)')");
    expect(source).toContain("setProfile('static-stack')");
    expect(source).toContain('applyStaticStoryState()');
    expect(source).toContain("if (profile !== 'full' || !ready) return null");
    expect(source).not.toContain('IOSNativeStoryDirector');
    expect(source).toContain('<AnimeScrollDirector />');
    expect(source).toContain('<StoryProductionRuntime />');
    expect(source).toContain('<SpatialCameraEnhancer />');
  });

  it('preflightは全3章のhidden・inert・インライン演出状態を解除する', () => {
    const source = readSource('src/components/effects/IOSStoryRuntimeIsolation.astro');

    expect(source).toContain("html.dataset.storyRuntimeOwner = 'static-stack'");
    expect(source).toContain("html.dataset.storyRenderMode = 'static-stack'");
    expect(source).toContain("root.dataset.storyScrollMode = 'static-stack'");
    expect(source).toContain("root.dataset.storyDirector = 'static'");
    expect(source).toContain("scene.setAttribute('aria-hidden', 'false')");
    expect(source).toContain("scene.removeAttribute('inert')");
    expect(source).toContain("scene.dataset.active = 'true'");
    expect(source).toContain("root.querySelectorAll('[data-chapter-gate]').forEach");
    expect(source).not.toContain("root.dataset.storyNativeRecovery = 'true'");
  });

  it('静的CSSはsticky・巨大高さ・透明シーンを通常フローへ戻す', () => {
    const styles = readSource('src/styles/story-static-stack.css');

    expect(styles).toContain("html[data-story-render-mode='static-stack'] .anime-scroll-story");
    expect(styles).toContain('height: auto !important');
    expect(styles).toContain('min-height: 0 !important');
    expect(styles).toContain("html[data-story-render-mode='static-stack'] .anime-story-scene");
    expect(styles).toContain('position: relative !important');
    expect(styles).toContain('visibility: visible !important');
    expect(styles).toContain('opacity: 1 !important');
    expect(styles).toContain('[data-omega-world-rift]');
    expect(styles).toContain('[data-chapter-gate]');
  });
});
