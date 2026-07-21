import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

describe('iOS story animation priority contract', () => {
  it('Homeはローダーを先に表示し、演出群を単一Runtimeから起動する', () => {
    const source = readSource('src/components/pages/HomePageV2.astro');

    expect(source).toContain('<IOSStoryRuntimeIsolation />');
    expect(source).toContain('<QuantumLoaderEvolution />');
    expect(source).toContain('<StoryEffectsRuntime client:load />');
    expect(source).toContain('<IOSStoryDirectorRecovery />');
    expect(source).not.toContain('<AnimeScrollDirector client:load />');
    expect(source).not.toContain('<StoryProductionRuntime client:load />');
  });

  it('StoryEffectsRuntimeはローダー解放後に実GSAP演出群をまとめて起動する', () => {
    const source = readSource('src/components/effects/StoryEffectsRuntime.tsx');

    expect(source).toContain("document.addEventListener('ivuru:loader-released', release)");
    expect(source).toContain("loader.getAttribute('aria-hidden') === 'true'");
    expect(source).toContain('if (!ready) return null');
    expect(source).toContain('<IOSStoryStabilityBridge />');
    expect(source).toContain('<AnimeScrollDirector />');
    expect(source).toContain('<StoryProductionRuntime />');
    expect(source).toContain('<SpatialCameraEnhancer />');
    expect(source).toContain('<CinematicEntertainmentDirector />');
    expect(source).toContain('<SingularityOverdriveDirector />');
    expect(source).toContain('<AdaptiveRealityDirector />');
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
