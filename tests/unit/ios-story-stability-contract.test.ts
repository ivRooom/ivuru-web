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

  it('Bridgeは早期fallbackを回復しiOS viewportとtouchを再同期する', () => {
    const source = readSource('src/components/effects/IOSStoryStabilityBridge.tsx');

    expect(source).toContain("root.dataset.storyRuntimeReason !== 'motion-boot-timeout'");
    expect(source).toContain("root.dataset.storyMobileRecovery = 'waiting-for-director'");
    expect(source).toContain('ignoreMobileResize: true');
    expect(source).toContain("window.addEventListener('touchend'");
    expect(source).toContain("window.visualViewport?.addEventListener('resize'");
    expect(source).toContain("window.visualViewport?.addEventListener('scroll'");
    expect(source.match(/requestAnimationFrame/g).length).toBeGreaterThanOrEqual(2);
  });

  it('iOS WebKitでは奥行き合成を軽量化し表示中sceneを可視化する', () => {
    const css = readSource('src/styles/story-ios-webkit-stability.css');

    expect(css).toContain("data-story-platform='ios-webkit'");
    expect(css).toContain('transform: translate3d(0, 0, 0) !important');
    expect(css).toContain('filter: none !important');
    expect(css).toContain("data-story-mobile-stability='syncing'");
  });

  it('PlaywrightとCIはiPhone WebKit回帰テストを実行する', () => {
    const config = readSource('playwright.config.ts');
    const workflow = readSource('.github/workflows/ci.yml');
    const e2e = readSource('tests/e2e/story-ios-webkit.spec.ts');

    expect(config).toContain("name: 'webkit-iphone'");
    expect(config).toContain("browserName: 'webkit'");
    expect(workflow).toContain('playwright install --with-deps chromium webkit');
    expect(workflow).toContain('--project=webkit-iphone');
    expect(e2e).toContain('await page.waitForTimeout(5_200)');
    expect(e2e).toContain("data-story-runtime-reason', 'motion-boot-timeout'");
  });
});
