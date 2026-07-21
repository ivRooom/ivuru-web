import { useEffect } from 'react';

type ScrollTriggerLike = {
  progress?: number;
  vars: { trigger?: Element | string };
  kill?: (revert?: boolean) => void;
};

type ScrollTriggerStaticLike = {
  config?: (options: { ignoreMobileResize?: boolean }) => void;
  getAll: () => ScrollTriggerLike[];
  refresh: () => void;
  update: () => void;
};

const RECOVERY_GRACE_MS = 12_000;
const STORY_CHAPTERS = ['01', '02', '03'] as const;
const STORY_CONTENT_SELECTOR =
  '[data-story-copy], [data-story-visual], [data-story-pop], [data-story-depth]';

const isIOSWebKit = () => {
  const userAgent = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

const readStoryRoot = () => document.querySelector<HTMLElement>('[data-anime-scroll-story]');

export default function IOSStoryStabilityBridge() {
  useEffect(() => {
    let generation = 0;
    let disposeCurrent = () => {};

    const setup = async () => {
      disposeCurrent();
      generation += 1;
      const token = generation;

      const root = readStoryRoot();
      if (!root) return;

      const compact = matchMedia('(max-width: 767px)').matches;
      const iosWebKit = isIOSWebKit();
      if (!compact && !iosWebKit) return;

      let disposed = false;
      let resizeTimer = 0;
      let firstFrame = 0;
      let secondFrame = 0;
      let recoveryProbe = 0;
      let observer: MutationObserver | undefined;
      let ScrollTrigger: ScrollTriggerStaticLike | undefined;
      let terminalFallback = false;
      let refreshedViewportWidth = window.visualViewport?.width ?? window.innerWidth;
      let refreshedViewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const recoveryDeadline = performance.now() + RECOVERY_GRACE_MS;
      const isCurrent = () => !disposed && token === generation && root.isConnected;

      root.dataset.storyPlatform = iosWebKit ? 'ios-webkit' : 'compact-webkit';
      root.dataset.storyMobileStability = 'booting';

      const syncViewport = () => {
        const nextHeight = window.visualViewport?.height ?? window.innerHeight;
        if (!Number.isFinite(nextHeight) || nextHeight <= 0) return;
        root.style.setProperty('--story-runtime-height', `${Math.round(nextHeight)}px`);
      };

      const findStoryTrigger = () =>
        ScrollTrigger?.getAll().find((candidate) => candidate.vars.trigger === root);

      const stopStoryTrigger = () => {
        ScrollTrigger?.getAll().forEach((candidate) => {
          if (candidate.vars.trigger === root) candidate.kill?.(true);
        });
      };

      const syncAuthorityFromDirector = () => {
        if (!isCurrent() || terminalFallback || root.dataset.storyMode !== 'motion') return;

        const code = root.dataset.storyChapter;
        if (!code || !STORY_CHAPTERS.includes(code as (typeof STORY_CHAPTERS)[number])) return;

        const index = STORY_CHAPTERS.indexOf(code as (typeof STORY_CHAPTERS)[number]);
        const authorityChanged = root.dataset.storyAuthorityChapter !== code;
        root.dataset.storyAuthorityChapter = code;

        const triggerProgress = findStoryTrigger()?.progress;
        if (Number.isFinite(triggerProgress)) {
          const progress = Math.max(0, Math.min(1, Number(triggerProgress)));
          root.dataset.storyAuthorityProgress = progress.toFixed(4);
          root.style.setProperty('--story-authority-progress', progress.toFixed(4));
          const progressLine = root.querySelector<HTMLElement>('[data-story-progress-line]');
          if (progressLine) progressLine.style.transform = `scaleX(${progress})`;
        }

        const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-anime-story-scene]'));
        scenes.forEach((scene, sceneIndex) => {
          const active = sceneIndex === index;
          scene.dataset.active = active ? 'true' : 'false';
          scene.setAttribute('aria-hidden', active ? 'false' : 'true');
          scene.toggleAttribute('inert', !active);
        });
        root.querySelectorAll<HTMLElement>('[data-story-progress-dot]').forEach((dot, dotIndex) => {
          dot.dataset.active = dotIndex === index ? 'true' : 'false';
        });

        const readout = root.querySelector<HTMLElement>('[data-story-chapter-readout]');
        if (readout) readout.textContent = `${code} / 03`;
        document.body.dataset.animeScene = scenes[index]?.dataset.storyScene ?? 'ice';

        if (authorityChanged) {
          window.dispatchEvent(
            new CustomEvent('ivuru:story-chapter-change', {
              detail: { chapter: code, index, source: 'ios-stability-bridge' },
            }),
          );
        }
      };

      const applyTerminalFallback = (reason: string) => {
        terminalFallback = true;
        window.clearInterval(recoveryProbe);
        recoveryProbe = 0;
        stopStoryTrigger();

        const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-anime-story-scene]'));
        const descendantsAreStatic =
          scenes.length === STORY_CHAPTERS.length &&
          scenes.every(
            (scene) =>
              scene.dataset.active === 'true' &&
              !scene.hasAttribute('aria-hidden') &&
              !scene.hasAttribute('inert') &&
              !scene.hasAttribute('style') &&
              Array.from(scene.querySelectorAll<HTMLElement>(STORY_CONTENT_SELECTOR)).every(
                (element) => !element.hasAttribute('style'),
              ),
          );
        const staticStateIsCurrent =
          root.dataset.storyMobileTerminalFallback === 'true' &&
          root.dataset.storyMobileStability === 'fallback' &&
          root.dataset.storyRuntime === 'fallback' &&
          root.dataset.storyRuntimeReason === reason &&
          root.dataset.storyMode === 'static' &&
          descendantsAreStatic;
        if (staticStateIsCurrent) return;

        root.dataset.storyMobileTerminalFallback = 'true';
        root.dataset.storyMobileStability = 'fallback';
        root.dataset.storyProgressAuthority = 'fallback';
        root.dataset.storyRuntime = 'fallback';
        root.dataset.storyRuntimeReason = reason;
        root.dataset.storyMode = 'static';
        root.dataset.storyMask = 'static';
        root.dataset.storyPerformance = 'static';
        root.dataset.storyInView = 'true';
        root.dataset.storyChapter = '01';
        root.dataset.storyAuthorityChapter = '01';
        root.dataset.storyAuthorityProgress = '1.0000';
        root.style.setProperty('--story-authority-progress', '1');
        root.style.setProperty('--story-runtime-height', 'auto');

        scenes.forEach((scene) => {
          scene.dataset.active = 'true';
          scene.removeAttribute('aria-hidden');
          scene.removeAttribute('inert');
          scene.removeAttribute('style');
          scene
            .querySelectorAll<HTMLElement>(STORY_CONTENT_SELECTOR)
            .forEach((element) => element.removeAttribute('style'));
        });

        root.querySelectorAll<HTMLElement>('[data-story-progress-dot]').forEach((dot, index) => {
          dot.dataset.active = index === 0 ? 'true' : 'false';
        });
        const readout = root.querySelector<HTMLElement>('[data-story-chapter-readout]');
        const progressLine = root.querySelector<HTMLElement>('[data-story-progress-line]');
        if (readout) readout.textContent = '01–03 / STATIC STORY';
        if (progressLine) progressLine.style.transform = 'scaleX(1)';
      };

      const scheduleTerminalRepair = (reason: string) => {
        applyTerminalFallback(reason);
        cancelAnimationFrame(firstFrame);
        firstFrame = requestAnimationFrame(() => {
          if (isCurrent() && terminalFallback) applyTerminalFallback(reason);
        });
      };

      const recoverPrematureFallback = () => {
        if (terminalFallback) {
          applyTerminalFallback(root.dataset.storyRuntimeReason ?? 'mobile-director-timeout');
          return;
        }
        if (root.dataset.storyRuntimeReason !== 'motion-boot-timeout') return;
        if (performance.now() >= recoveryDeadline) {
          applyTerminalFallback('mobile-director-timeout');
          return;
        }
        if (root.dataset.storyDirector === 'static') return;

        delete root.dataset.storyRuntimeReason;
        root.dataset.storyRuntime = 'booting';
        root.dataset.storyProgressAuthority = 'booting';
        root.dataset.storyMode = 'booting';
        root.dataset.storyMask = 'active';
        root.dataset.storyPerformance = iosWebKit ? 'ios-stable' : 'mobile-stable';
        root.dataset.storyMobileRecovery = 'waiting-for-director';

        const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-anime-story-scene]'));
        scenes.forEach((scene, index) => {
          const active = index === 0;
          scene.dataset.active = active ? 'true' : 'false';
          scene.setAttribute('aria-hidden', active ? 'false' : 'true');
          scene.toggleAttribute('inert', !active);
        });
        syncViewport();
      };

      const updateReadyState = () => {
        if (!isCurrent()) return;
        if (terminalFallback) {
          applyTerminalFallback(root.dataset.storyRuntimeReason ?? 'mobile-director-timeout');
          return;
        }

        recoverPrematureFallback();
        if (
          root.dataset.storyDirector === 'ready' &&
          root.dataset.storyRuntime === 'ready' &&
          root.dataset.storyMode === 'motion'
        ) {
          root.dataset.storyMobileStability = 'ready';
          delete root.dataset.storyMobileRecovery;
          delete root.dataset.storyMobileTerminalFallback;
          window.clearInterval(recoveryProbe);
          recoveryProbe = 0;
          syncAuthorityFromDirector();
          return;
        }

        if (performance.now() >= recoveryDeadline) {
          applyTerminalFallback('mobile-director-timeout');
        }
      };

      const refreshAfterLayoutSettles = () => {
        if (!isCurrent() || terminalFallback) return;
        syncViewport();
        ScrollTrigger?.update();
        cancelAnimationFrame(firstFrame);
        cancelAnimationFrame(secondFrame);
        firstFrame = requestAnimationFrame(() => {
          secondFrame = requestAnimationFrame(() => {
            if (!isCurrent() || terminalFallback) return;
            ScrollTrigger?.refresh();
            ScrollTrigger?.update();
            refreshedViewportWidth = window.visualViewport?.width ?? window.innerWidth;
            refreshedViewportHeight = window.visualViewport?.height ?? window.innerHeight;
            syncAuthorityFromDirector();
            updateReadyState();
          });
        });
      };

      const scheduleRefresh = (delay = 180) => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(refreshAfterLayoutSettles, delay);
      };

      const onScroll = () => {
        if (terminalFallback) {
          scheduleTerminalRepair(root.dataset.storyRuntimeReason ?? 'mobile-director-timeout');
          return;
        }
        ScrollTrigger?.update();
        syncAuthorityFromDirector();
        updateReadyState();
      };

      const onViewportChange = () => {
        const nextWidth = window.visualViewport?.width ?? window.innerWidth;
        const nextHeight = window.visualViewport?.height ?? window.innerHeight;
        const widthChanged = Math.abs(nextWidth - refreshedViewportWidth) >= 1;
        const heightChanged = Math.abs(nextHeight - refreshedViewportHeight) >= 24;
        syncViewport();
        ScrollTrigger?.update();
        syncAuthorityFromDirector();
        if (widthChanged || heightChanged) scheduleRefresh(260);
      };

      const onTouchEnd = () => scheduleRefresh(90);
      const onOrientationChange = () => scheduleRefresh(360);
      const onPageShow = () => scheduleRefresh(80);
      const onVisibilityChange = () => {
        if (!document.hidden) scheduleRefresh(120);
      };
      const onStoryMutation = () => {
        updateReadyState();
        syncAuthorityFromDirector();
      };

      if ('MutationObserver' in window) {
        observer = new MutationObserver(onStoryMutation);
        observer.observe(root, {
          attributes: true,
          attributeFilter: [
            'data-story-runtime-reason',
            'data-story-runtime',
            'data-story-director',
            'data-story-mode',
            'data-story-chapter',
          ],
        });
      }

      recoveryProbe = window.setInterval(updateReadyState, 250);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('touchend', onTouchEnd, { passive: true });
      window.addEventListener('resize', onViewportChange, { passive: true });
      window.addEventListener('orientationchange', onOrientationChange, { passive: true });
      window.addEventListener('pageshow', onPageShow);
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.visualViewport?.addEventListener('resize', onViewportChange, { passive: true });
      window.visualViewport?.addEventListener('scroll', onViewportChange, { passive: true });

      disposeCurrent = () => {
        disposed = true;
        observer?.disconnect();
        window.clearTimeout(resizeTimer);
        window.clearInterval(recoveryProbe);
        cancelAnimationFrame(firstFrame);
        cancelAnimationFrame(secondFrame);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('touchend', onTouchEnd);
        window.removeEventListener('resize', onViewportChange);
        window.removeEventListener('orientationchange', onOrientationChange);
        window.removeEventListener('pageshow', onPageShow);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.visualViewport?.removeEventListener('resize', onViewportChange);
        window.visualViewport?.removeEventListener('scroll', onViewportChange);
        delete root.dataset.storyPlatform;
        delete root.dataset.storyMobileStability;
        delete root.dataset.storyMobileRecovery;
        delete root.dataset.storyMobileTerminalFallback;
      };

      syncViewport();
      updateReadyState();

      try {
        const triggerModule = await import('gsap/ScrollTrigger');
        if (!isCurrent()) return;
        ScrollTrigger = triggerModule.ScrollTrigger as unknown as ScrollTriggerStaticLike;
        ScrollTrigger.config?.({ ignoreMobileResize: true });
        root.dataset.storyMobileStability = terminalFallback ? 'fallback' : 'syncing';
        if (terminalFallback) applyTerminalFallback('mobile-director-timeout');
        else scheduleRefresh(0);
      } catch (error) {
        console.error('[IOSStoryStabilityBridge] ScrollTriggerの読込に失敗しました。', error);
        if (isCurrent()) applyTerminalFallback('mobile-scrolltrigger-import-failed');
      }
    };

    const onEnvironmentChange = () => void setup();
    void setup();
    document.addEventListener('astro:page-load', onEnvironmentChange);

    return () => {
      generation += 1;
      disposeCurrent();
      document.removeEventListener('astro:page-load', onEnvironmentChange);
    };
  }, []);

  return null;
}
