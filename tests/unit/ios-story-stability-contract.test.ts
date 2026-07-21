import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('iOS story stability contract', () => {
  it('HomeはDirectorより前にiOS安定化Bridgeを一度だけ起動する', () => {
    const source = readSource('src/components/pages/HomePageV2.astro');
    const bridgeIndex = source.indexOf('<IOSStoryStabilityBridge client:load />');
    const directorIndex = source.indexOf('<AnimeScrollDirector client:load />');

    expect(source).toContain(
      "import IOSStoryStabilityBridge from '@/components/effects/IOSStoryStabilityBridge'",
    );
    expect(source.match(/<IOSStoryStabilityBridge client:load \/>/g)).toHaveLength(1);
    expect(bridgeIndex).toBeGreaterThan(-1);
    expect(bridgeIndex).toBeLessThan(directorIndex);
    expect(source).toContain("import '@/styles/story-ios-webkit-stability.css'");
  });

  it('Bridgeは早期fallbackを30秒間回復し失敗時は静的3章を維持する', () => {
    const source = readSource('src/components/effects/IOSStoryStabilityBridge.tsx');

    expect(source).toContain('const RECOVERY_GRACE_MS = 30_000');
    expect(source).toContain("root.dataset.storyRuntimeReason !== 'motion-boot-timeout'");
    expect(source).toContain("root.dataset.storyMobileRecovery = 'waiting-for-director'");
    expect(source).toContain("applyStaticFallback('mobile-director-timeout')");
    expect(source).toContain("root.dataset.storyMobileTerminalFallback = 'true'");
    expect(source).toContain('trigger.kill?.(true)');
    expect(source).toContain('repairStaticScenes');
    expect(source).toContain('installTerminalRepair');
    expect(source).toContain("readout.textContent = '01–03 / STATIC STORY'");
  });

  it('BridgeはGSAPを先読みして実TriggerからRuntime・章Authorityを同期する', () => {
    const source = readSource('src/components/effects/IOSStoryStabilityBridge.tsx');

    expect(source).toContain('let generation = 0');
    expect(source).toContain('const token = generation');
    expect(source).toContain('token === generation');
    expect(source.indexOf('disposeCurrent = () => {')).toBeLessThan(
      source.indexOf("import('gsap')"),
    );
    expect(source).toContain('const findStoryTrigger');
    expect(source).toContain('syncMotionState');
    expect(source).toContain("root.dataset.storyRuntime = 'ready'");
    expect(source).toContain("root.dataset.storyProgressAuthority = 'ready'");
    expect(source).toContain("source: 'ios-stability-bridge'");
    expect(source).toContain('refreshedHeight');
    expect(source).toContain('height - refreshedHeight');
    expect(source).toContain('ignoreMobileResize: true');
    expect(source).toContain("window.addEventListener('touchend'");
    expect(source).toContain("window.visualViewport?.addEventListener('resize'");
    expect(source).toContain("window.visualViewport?.addEventListener('scroll'");
    expect(source.match(/requestAnimationFrame/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it('iOSでは実GSAP Directorを先行起動し4.5秒で静的化しない', () => {
    const director = readSource('src/components/effects/AnimeScrollDirector.tsx');
    const runtime = readSource('src/components/effects/StoryProductionRuntime.tsx');

    expect(director).toContain('const isIOSWebKit = () =>');
    expect(director).toContain('if (isIOSWebKit()) {');
    expect(director).toContain("elements.root.dataset.storyInView = 'true'");
    expect(director).toContain('void initializeMotion(elements, token)');
    expect(runtime).toContain('const isIOSWebKit = () =>');
    expect(runtime).toContain("root.dataset.storyRuntimeReason = 'waiting-for-ios-director'");
    expect(runtime).toContain('ScrollTrigger?.refresh()');
    expect(runtime).toContain("applyStaticStory(elements, 'motion-boot-timeout')");
  });

  it('ローダー安全装置はwindow.load後まで実アニメーションを維持する', () => {
    const layout = readSource('src/layouts/BaseLayout.astro');
    const guard = readSource('src/components/common/LoaderReleaseGuard.astro');

    expect(layout).toContain("window.addEventListener('load', armFailsafe, { once: true })");
    expect(layout).toContain('reduced ? 500 : 5_000');
    expect(guard).toContain('const armAfterLoad = () =>');
    expect(guard).toContain("window.addEventListener('load', armAfterLoad, { once: true })");
    expect(guard).toContain("releaseLoader('hard-timeout-after-load')");
  });

  it('iOS WebKitでは横画面とiPadも奥行き合成を軽量化する', () => {
    const css = readSource('src/styles/story-ios-webkit-stability.css');

    expect(css).toContain("data-story-platform='ios-webkit'");
    expect(css).toContain('transform: translate3d(0, 0, 0) !important');
    expect(css).toContain('filter: none !important');
    expect(css).toContain("data-story-mobile-stability='syncing'");
    expect(css).not.toContain('@media (max-width: 767px)');
  });

  it('PlaywrightとCIは実ロード・実GSAPをiPhone WebKitで独立検証する', () => {
    const config = readSource('playwright.config.ts');
    const workflow = readSource('.github/workflows/ci.yml');
    const e2e = readSource('tests/e2e/story-ios-webkit.spec.ts');

    expect(config).toContain("name: 'webkit-iphone'");
    expect(config).toContain("browserName: 'webkit'");
    expect(config).toContain('const chromiumLaunchOptions');
    expect(workflow).toContain('set -o pipefail');
    expect(workflow).toContain('playwright install --with-deps chromium webkit');
    expect(workflow).toContain('--project=webkit-iphone');
    expect(e2e).toContain("waitUntil: 'domcontentloaded'");
    expect(e2e).toContain('waitForLoaderRelease');
    expect(e2e).toContain("data-story-transition-engine', 'world-forge'");
    expect(e2e).toContain("expect(preReveal.reason).not.toBe('motion-boot-timeout')");
    expect(e2e).toContain("data-story-native-recovery', 'true'");
  });
});
