import { useEffect } from 'react';

type ScrollTriggerLike = {
  start?: number;
  end?: number;
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

type StoryElements = {
  root: HTMLElement;
  scenes: HTMLElement[];
  dots: HTMLElement[];
  readout: HTMLElement | null;
  progressLine: HTMLElement | null;
};

const RECOVERY_GRACE_MS = 30_000;
const CHAPTERS = ['01', '02', '03'] as const;
const STORY_CONTENT_SELECTOR =
  '[data-story-copy], [data-story-visual], [data-story-pop], [data-story-depth]';

const isIOSWebKit = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const readStoryElements = (): StoryElements | null => {
  const root = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
  if (!root) return null;

  const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-anime-story-scene]'));
  if (scenes.length !== CHAPTERS.length) return null;

  return {
    root,
    scenes,
    dots: Array.from(root.querySelectorAll<HTMLElement>('[data-story-progress-dot]')),
    readout: root.querySelector<HTMLElement>('[data-story-chapter-readout]'),
    progressLine: root.querySelector<HTMLElement>('[data-story-progress-line]'),
  };
};

export default function IOSStoryStabilityBridge() {
  useEffect(() => {
    let generation = 0;
    let disposeCurrent = () => {};

    const setup = async () => {
      const recoveryRoot = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
      if (recoveryRoot?.dataset.storyNativeRecovery === 'true') return;
      disposeCurrent();
      generation += 1;
      const token = generation;
      const elements = readStoryElements();
      if (!elements) return;

      const { root, scenes, dots, readout, progressLine } = elements;
      if (!isIOSWebKit()) return;

      let disposed = false;
      let refreshTimer = 0;
      let firstFrame = 0;
      let secondFrame = 0;
      let probeTimer = 0;
      let repairFrame = 0;
      let rootObserver: MutationObserver | undefined;
      let terminalObserver: MutationObserver | undefined;
      let ScrollTrigger: ScrollTriggerStaticLike | undefined;
      let terminalFallback = false;
      let lastChapter = '';
      let repairingStatic = false;
      let refreshedWidth = window.visualViewport?.width ?? window.innerWidth;
      let refreshedHeight = window.visualViewport?.height ?? window.innerHeight;
      const recoveryDeadline = performance.now() + RECOVERY_GRACE_MS;
      const isCurrent = () => !disposed && token === generation && root.isConnected;

      root.dataset.storyPlatform = 'ios-webkit';
      root.dataset.storyMobileStability = 'booting';

      const syncViewportHeight = () => {
        const height = window.visualViewport?.height ?? window.innerHeight;
        if (Number.isFinite(height) && height > 0) {
          root.style.setProperty('--story-runtime-height', `${Math.round(height)}px`);
        }
      };

      const findStoryTrigger = () =>
        ScrollTrigger?.getAll().find((candidate) => candidate.vars.trigger === root);

      const setSceneState = (activeIndex: number) => {
        scenes.forEach((scene, index) => {
          const active = index === activeIndex;
          scene.dataset.active = active ? 'true' : 'false';
          scene.setAttribute('aria-hidden', active ? 'false' : 'true');
          scene.toggleAttribute('inert', !active);
        });
      };

      const repairStaticScenes = () => {
        if (!terminalFallback || repairingStatic || !isCurrent()) return;
        repairingStatic = true;
        scenes.forEach((scene) => {
          if (scene.dataset.active !== 'true') scene.dataset.active = 'true';
          if (scene.hasAttribute('aria-hidden')) scene.removeAttribute('aria-hidden');
          if (scene.hasAttribute('inert')) scene.removeAttribute('inert');
          if (scene.hasAttribute('style')) scene.removeAttribute('style');
          scene.querySelectorAll<HTMLElement>(STORY_CONTENT_SELECTOR).forEach((node) => {
            if (node.hasAttribute('style')) node.removeAttribute('style');
          });
        });
        repairingStatic = false;
      };

      const installTerminalRepair = () => {
        if (!('MutationObserver' in window) || terminalObserver) return;
        terminalObserver = new MutationObserver(() => {
          cancelAnimationFrame(repairFrame);
          repairFrame = requestAnimationFrame(repairStaticScenes);
        });
        terminalObserver.observe(root, {
          subtree: true,
          attributes: true,
          attributeFilter: ['aria-hidden', 'inert', 'style', 'data-active'],
        });
      };

      const applyStaticFallback = (reason: string) => {
        terminalFallback = true;
        window.clearInterval(probeTimer);
        probeTimer = 0;
        ScrollTrigger?.getAll().forEach((trigger) => {
          if (trigger.vars.trigger === root) trigger.kill?.(true);
        });

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

        repairStaticScenes();
        dots.forEach((dot, index) => {
          dot.dataset.active = index === 0 ? 'true' : 'false';
        });
        if (readout) readout.textContent = '01–03 / STATIC STORY';
        if (progressLine) progressLine.style.transform = 'scaleX(1)';
        installTerminalRepair();
      };

      const recoverPrematureFallback = () => {
        if (root.dataset.storyRuntimeReason !== 'motion-boot-timeout') return;
        if (performance.now() >= recoveryDeadline) {
          applyStaticFallback('mobile-director-timeout');
          return;
        }
        if (root.dataset.storyDirector === 'static') return;

        delete root.dataset.storyRuntimeReason;
        root.dataset.storyRuntime = 'booting';
        root.dataset.storyProgressAuthority = 'booting';
        root.dataset.storyMode = 'booting';
        root.dataset.storyMask = 'active';
        root.dataset.storyPerformance = 'ios-stable';
        root.dataset.storyMobileRecovery = 'waiting-for-director';
        setSceneState(0);
        syncViewportHeight();
      };

      const syncMotionState = (trigger: ScrollTriggerLike) => {
        if (terminalFallback || !isCurrent()) return;

        const chapter = root.dataset.storyChapter;
        const index = chapter ? CHAPTERS.indexOf(chapter as (typeof CHAPTERS)[number]) : -1;
        const activeIndex = index >= 0 ? index : 0;
        const code = CHAPTERS[activeIndex];
        const progress = Math.max(0, Math.min(1, Number(trigger.progress ?? 0)));

        root.dataset.storyRuntime = 'ready';
        root.dataset.storyProgressAuthority = 'ready';
        root.dataset.storyMobileStability = 'ready';
        root.dataset.storyMode = 'motion';
        root.dataset.storyMask = 'active';
        root.dataset.storyChapter = code;
        root.dataset.storyAuthorityChapter = code;
        root.dataset.storyAuthorityProgress = progress.toFixed(4);
        root.style.setProperty('--story-authority-progress', progress.toFixed(4));
        delete root.dataset.storyRuntimeReason;
        delete root.dataset.storyMobileRecovery;
        delete root.dataset.storyMobileTerminalFallback;

        setSceneState(activeIndex);
        dots.forEach((dot, dotIndex) => {
          dot.dataset.active = dotIndex === activeIndex ? 'true' : 'false';
        });
        if (readout) readout.textContent = `${code} / 03`;
        if (progressLine) progressLine.style.transform = `scaleX(${progress})`;
        document.body.dataset.animeScene = scenes[activeIndex]?.dataset.storyScene ?? 'ice';

        if (lastChapter !== code) {
          lastChapter = code;
          window.dispatchEvent(
            new CustomEvent('ivuru:story-chapter-change', {
              detail: { chapter: code, index: activeIndex, source: 'ios-stability-bridge' },
            }),
          );
        }
      };

      const evaluate = () => {
        if (!isCurrent() || terminalFallback) return;
        recoverPrematureFallback();
        if (terminalFallback) return;

        const trigger = findStoryTrigger();
        if (root.dataset.storyDirector === 'ready' && trigger) {
          syncMotionState(trigger);
          window.clearInterval(probeTimer);
          probeTimer = 0;
          return;
        }

        if (performance.now() >= recoveryDeadline) {
          applyStaticFallback('mobile-director-timeout');
        }
      };

      const refreshAfterLayout = () => {
        if (!isCurrent() || terminalFallback) return;
        syncViewportHeight();
        ScrollTrigger?.update();
        cancelAnimationFrame(firstFrame);
        cancelAnimationFrame(secondFrame);
        firstFrame = requestAnimationFrame(() => {
          secondFrame = requestAnimationFrame(() => {
            if (!isCurrent() || terminalFallback) return;
            ScrollTrigger?.refresh();
            ScrollTrigger?.update();
            refreshedWidth = window.visualViewport?.width ?? window.innerWidth;
            refreshedHeight = window.visualViewport?.height ?? window.innerHeight;
            evaluate();
          });
        });
      };

      const scheduleRefresh = (delay = 180) => {
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(refreshAfterLayout, delay);
      };

      const onScroll = () => {
        if (terminalFallback) {
          repairStaticScenes();
          return;
        }
        ScrollTrigger?.update();
        const trigger = findStoryTrigger();
        if (trigger && root.dataset.storyDirector === 'ready') syncMotionState(trigger);
        else evaluate();
      };

      const onViewportChange = () => {
        const width = window.visualViewport?.width ?? window.innerWidth;
        const height = window.visualViewport?.height ?? window.innerHeight;
        syncViewportHeight();
        ScrollTrigger?.update();
        if (Math.abs(width - refreshedWidth) >= 1 || Math.abs(height - refreshedHeight) >= 24) {
          scheduleRefresh(260);
        }
      };

      const onTouchEnd = () => scheduleRefresh(90);
      const onOrientationChange = () => scheduleRefresh(360);
      const onPageShow = () => scheduleRefresh(80);
      const onVisibilityChange = () => {
        if (!document.hidden) scheduleRefresh(120);
      };

      if ('MutationObserver' in window) {
        rootObserver = new MutationObserver(evaluate);
        rootObserver.observe(root, {
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
        rootObserver?.disconnect();
        terminalObserver?.disconnect();
        window.clearTimeout(refreshTimer);
        window.clearInterval(probeTimer);
        cancelAnimationFrame(firstFrame);
        cancelAnimationFrame(secondFrame);
        cancelAnimationFrame(repairFrame);
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

      syncViewportHeight();
      probeTimer = window.setInterval(evaluate, 250);
      evaluate();

      try {
        const [gsapModule, triggerModule] = await Promise.all([
          import('gsap'),
          import('gsap/ScrollTrigger'),
        ]);
        if (!isCurrent()) return;
        ScrollTrigger = triggerModule.ScrollTrigger as unknown as ScrollTriggerStaticLike;
        gsapModule.gsap.registerPlugin(triggerModule.ScrollTrigger);
        ScrollTrigger.config?.({ ignoreMobileResize: true });
        root.dataset.storyMobileStability = 'syncing';
        scheduleRefresh(0);
      } catch (error) {
        console.error('[IOSStoryStabilityBridge] GSAPの読込に失敗しました。', error);
        if (isCurrent()) applyStaticFallback('mobile-gsap-import-failed');
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
