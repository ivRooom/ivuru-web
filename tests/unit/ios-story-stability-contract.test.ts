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

  it('Bridgeは早期fallbackを期限付きで回復し失敗時は静的表示を維持する', () => {
    const source = readSource('src/components/effects/IOSStoryStabilityBridge.tsx');

    expect(source).toContain('const RECOVERY_GRACE_MS = 12_000');
    expect(source).toContain("root.dataset.storyRuntimeReason !== 'motion-boot-timeout'");
    expect(source).toContain("root.dataset.storyMobileRecovery = 'waiting-for-director'");
    expect(source).toContain("applyTerminalFallback('mobile-director-timeout')");
    expect(source).toContain("root.dataset.storyMobileTerminalFallback = 'true'");
    expect(source).toContain('candidate.kill?.(true)');
    expect(source).toContain("readout.textContent = '01–03 / STATIC STORY'");
  });

  it('Bridgeは再入を無効化しlast refresh基準でviewportとtouchを同期する', () => {
    const source = readSource('src/components/effects/IOSStoryStabilityBridge.tsx');

    expect(source).toContain('let generation = 0');
    expect(source).toContain('const token = generation');
    expect(source).toContain('token === generation');
    expect(source.indexOf('disposeCurrent = () => {')).toBeLessThan(
      source.indexOf("await import('gsap/ScrollTrigger')"),
    );
    expect(source).toContain('refreshedViewportHeight');
    expect(source).toContain('nextHeight - refreshedViewportHeight');
    expect(source).toContain('ignoreMobileResize: true');
    expect(source).toContain("window.addEventListener('touchend'");
    expect(source).toContain("window.visualViewport?.addEventListener('resize'");
    expect(source).toContain("window.visualViewport?.addEventListener('scroll'");
    expect(source.match(/requestAnimationFrame/g).length).toBeGreaterThanOrEqual(2);
  });

  it('iOS WebKitでは横画面とiPadも奥行き合成を軽量化する', () => {
    const css = readSource('src/styles/story-ios-webkit-stability.css');

    expect(css).toContain("data-story-platform='ios-webkit'");
    expect(css).toContain('transform: translate3d(0, 0, 0) !important');
    expect(css).toContain('filter: none !important');
    expect(css).toContain("data-story-mobile-stability='syncing'");
    expect(css).not.toContain('@media (max-width: 767px)');
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
