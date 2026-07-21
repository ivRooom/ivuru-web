import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('iOS story animation priority contract', () => {
  it('HomeはローダーとGSAP Directorを残したままiOS補助処理を起動する', () => {
    const source = readSource('src/components/pages/HomePageV2.astro');

    expect(source).toContain('<IOSStoryRuntimeIsolation />');
    expect(source).toContain('<QuantumLoaderEvolution />');
    expect(source).toContain('<AnimeScrollDirector client:load />');
    expect(source).toContain('<StoryProductionRuntime client:load />');
    expect(source).toContain('<IOSStoryDirectorRecovery />');
  });

  it('Runtime preflightはIslandやロード演出を削除しない', () => {
    const source = readSource('src/components/effects/IOSStoryRuntimeIsolation.astro');

    expect(source).toContain("html.dataset.storyRuntimeOwner = 'gsap'");
    expect(source).toContain("document.addEventListener('ivuru:loader-released'");
    expect(source).toContain('restoreNativeScroll');
    expect(source).not.toContain('blockedComponents');
    expect(source).not.toContain('island.remove()');
    expect(source).not.toContain("loader.style.setProperty('display', 'none'");
    expect(source).not.toContain("document.documentElement.dataset.loaderReleased = 'true'");
  });

  it('Recoveryは実Directorを5秒待ち、失敗時だけ疑似章同期へ切り替える', () => {
    const source = readSource('src/components/effects/IOSStoryDirectorRecovery.astro');
    const styles = readSource('src/styles/story-ios-webkit-stability.css');

    expect(source).toContain('const recoveryDelay = 5_000');
    expect(source).toContain('const realDirectorIsReady = () =>');
    expect(source).toContain("root.dataset.storyTransitionEngine === 'world-forge'");
    expect(source).toContain('const scheduleActivation = () =>');
    expect(source).toContain('new IntersectionObserver');
    expect(source).toContain("root.dataset.storyNativeRecovery = 'true'");
    expect(source).toContain("source: 'ios-inline-recovery'");
    expect(source).toContain('window.setInterval(scheduleSync, recoveryHeartbeatMs)');
    expect(source.indexOf("root.dataset.storyNativeRecovery = 'true'")).toBeGreaterThan(
      source.indexOf('const activate = () =>'),
    );
    expect(styles).toContain("[data-story-native-recovery='true']");
  });
});
