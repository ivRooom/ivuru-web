import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('iOS static story stability contract', () => {
  it('Homeはローダー完了Bridgeと静的ストーリーCSSを組み込む', () => {
    const home = readSource('src/components/pages/HomePageV2.astro');
    const runtime = readSource('src/components/effects/StoryEffectsRuntime.tsx');

    expect(home).toContain(
      "import LoaderCompletionBridge from '@/components/common/LoaderCompletionBridge.astro'",
    );
    expect(home).toContain(
      "import StoryEffectsRuntime from '@/components/effects/StoryEffectsRuntime'",
    );
    expect(home.match(/<LoaderCompletionBridge \/>/g)).toHaveLength(1);
    expect(home.match(/<StoryEffectsRuntime client:load \/>/g)).toHaveLength(1);
    expect(home).toContain("import '@/styles/story-static-stack.css'");
    expect(home).not.toContain('IOSStoryDirectorRecovery');
    expect(runtime).toContain("setProfile('static-stack')");
  });

  it('モバイルRuntimeは全シーンを表示しスクロールAuthorityを無効化する', () => {
    const source = readSource('src/components/effects/StoryEffectsRuntime.tsx');

    expect(source).toContain('const applyStaticStoryState = () =>');
    expect(source).toContain("root.dataset.storyRenderMode = 'static-stack'");
    expect(source).toContain("root.dataset.storyScrollMode = 'static-stack'");
    expect(source).toContain("root.dataset.storyMode = 'static'");
    expect(source).toContain("root.dataset.storyDirector = 'static'");
    expect(source).toContain("root.dataset.storyProgressAuthority = 'disabled'");
    expect(source).toContain("scene.setAttribute('aria-hidden', 'false')");
    expect(source).toContain("scene.removeAttribute('inert')");
    expect(source).not.toContain('IOSNativeStoryDirector');
  });

  it('preflightはHydration前から通常スクロールと静的3章を確定する', () => {
    const source = readSource('src/components/effects/IOSStoryRuntimeIsolation.astro');

    expect(source).toContain("window.matchMedia('(max-width: 767px)')");
    expect(source).toContain('const shouldUseStaticStory = () =>');
    expect(source).toContain("html.dataset.storyRuntimeOwner = 'static-stack'");
    expect(source).toContain("body?.setAttribute('data-story-render-mode', 'static-stack')");
    expect(source).toContain(
      "scrollingElement.style.setProperty('overflow-y', 'auto', 'important')",
    );
    expect(source).toContain("root.dataset.storyChapter = 'all'");
    expect(source).toContain("root.querySelectorAll('[data-chapter-gate]').forEach");
  });

  it('ローダー完全退場後だけ演出Runtimeを起動し監視を破棄する', () => {
    const layout = readSource('src/layouts/BaseLayout.astro');
    const intro = readSource('src/components/common/IntroLoader.astro');
    const guard = readSource('src/components/common/LoaderReleaseGuard.astro');
    const bridge = readSource('src/components/common/LoaderCompletionBridge.astro');
    const runtime = readSource('src/components/effects/StoryEffectsRuntime.tsx');

    expect(layout).toContain('const releaseFailsafe = () =>');
    expect(guard).toContain('armTimers()');
    expect(bridge).toContain("loader.dataset.loaderAnimationRan = 'true'");
    expect(bridge).toContain("loader.dataset.completionBridged = 'true'");
    expect(bridge).toContain("loader.setAttribute('aria-hidden', 'true')");
    expect(bridge).toContain("new CustomEvent('ivuru:loader-released'");
    expect(intro).toContain("loader.dataset.loaderRuntimeSafe = 'true'");
    expect(intro).toContain("new CustomEvent('ivuru:loader-runtime-safe'");
    expect(guard).toContain("new CustomEvent('ivuru:loader-runtime-safe'");
    expect(bridge).toContain("new CustomEvent('ivuru:loader-runtime-safe'");
    expect(bridge).toContain("document.addEventListener('astro:before-swap'");
    expect(runtime).toContain("root.dataset.loaderRuntimeSafe === 'true'");
    expect(runtime).toContain("lazy(() => import('@/components/effects/AnimeScrollDirector'))");
    expect(runtime).toContain('const StoryProductionRuntime = lazy(');
    expect(runtime).not.toContain("loader.classList.contains('loaded')");
  });

  it('静的CSSは3章を通常フローで描画しスキップ導線を残す', () => {
    const css = readSource('src/styles/story-static-stack.css');

    expect(css).toContain("html[data-story-render-mode='static-stack'] .anime-scroll-stage");
    expect(css).toContain("html[data-story-render-mode='static-stack'] .anime-story-camera");
    expect(css).toContain("html[data-story-render-mode='static-stack'] .anime-story-scene");
    expect(css).toContain('grid-template-columns: minmax(0, 1fr) !important');
    expect(css).toContain('visibility: visible !important');
    expect(css).toContain('opacity: 1 !important');
    expect(css).toContain('pointer-events: auto !important');
    expect(css).toContain('.anime-entertainment-layer');
    expect(css).toContain('[data-omega-world-rift]');
    expect(css).not.toContain('.anime-story-skip,');
  });

  it('PlaywrightとCIはiPhone WebKitで静的3章と空白不在を検証する', () => {
    const config = readSource('playwright.config.ts');
    const workflow = readSource('.github/workflows/ci.yml');
    const e2e = readSource('tests/e2e/story-ios-webkit.spec.ts');

    expect(config).toContain("name: 'webkit-iphone'");
    expect(config).toContain("browserName: 'webkit'");
    expect(workflow).toContain('playwright install --with-deps chromium webkit');
    expect(workflow).toContain('--project=webkit-iphone');
    expect(e2e).toContain("data-story-render-mode', 'static-stack'");
    expect(e2e).toContain("data-story-scroll-mode', 'static-stack'");
    expect(e2e).toContain('expectSceneRendered');
    expect(e2e).toContain('sumSceneHeights');
    expect(e2e).toContain('afterGap');
    expect(e2e).not.toContain('scrollToProgress');
  });
});
