import { useEffect } from 'react';

type ScrollTriggerLike = {
  start: number;
  end: number;
  progress: number;
  vars: { trigger?: Element | string; pin?: Element | string | boolean };
};

type ScrollTriggerStaticLike = {
  getAll: () => unknown[];
  refresh: () => void;
  update?: () => void;
  addEventListener: (name: string, callback: () => void) => void;
  removeEventListener: (name: string, callback: () => void) => void;
};

type StoryElements = {
  root: HTMLElement;
  scenes: HTMLElement[];
  dots: HTMLElement[];
  readout: HTMLElement | null;
  progressLine: HTMLElement | null;
  skipLink: HTMLAnchorElement | null;
  afterStory: HTMLElement | null;
};

type StoredStoryPosition = {
  progress: number;
  updatedAt: number;
};

const STORY_DURATION = 6;
const CHAPTER_BREAKS = [0, 1.72 / STORY_DURATION, 4.12 / STORY_DURATION] as const;
const BOOT_TIMEOUT_MS = 4500;
const TRIGGER_PROBE_INTERVAL_MS = 100;
const POSITION_TTL_MS = 30 * 60 * 1000;
const POSITION_PROGRESS_DELTA = 0.004;
const POSITION_WRITE_INTERVAL_MS = 250;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const chapterAt = (progress: number) => {
  if (progress >= CHAPTER_BREAKS[2]) return 2;
  if (progress >= CHAPTER_BREAKS[1]) return 1;
  return 0;
};

const storyPositionKey = () => `ivuru:story-position:${window.location.pathname}`;

const readStoredPosition = (): StoredStoryPosition | null => {
  try {
    const raw = window.sessionStorage.getItem(storyPositionKey());
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<StoredStoryPosition>;
    if (!Number.isFinite(value.progress) || !Number.isFinite(value.updatedAt)) return null;
    if (Date.now() - Number(value.updatedAt) > POSITION_TTL_MS) return null;
    return {
      progress: clamp01(Number(value.progress)),
      updatedAt: Number(value.updatedAt),
    };
  } catch {
    return null;
  }
};

const shouldRestoreStoredPosition = () => {
  const navigation = performance.getEntriesByType('navigation')[0] as
    PerformanceNavigationTiming | undefined;
  return navigation?.type === 'reload' || navigation?.type === 'back_forward';
};

const readElements = (): StoryElements | null => {
  const root = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
  if (!root) return null;

  const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-anime-story-scene]'));
  if (scenes.length !== 3) return null;

  return {
    root,
    scenes,
    dots: Array.from(root.querySelectorAll<HTMLElement>('[data-story-progress-dot]')),
    readout: root.querySelector<HTMLElement>('[data-story-chapter-readout]'),
    progressLine: root.querySelector<HTMLElement>('[data-story-progress-line]'),
    skipLink: document.querySelector<HTMLAnchorElement>('[data-story-skip]'),
    afterStory: document.querySelector<HTMLElement>('#anime-story-after'),
  };
};

const applyStaticStory = (elements: StoryElements, reason: string) => {
  const { root, scenes, dots, readout, progressLine } = elements;
  root.dataset.storyProgressAuthority = reason === 'reduced-motion' ? 'static' : 'fallback';
  root.dataset.storyRuntime = reason === 'reduced-motion' ? 'static' : 'fallback';
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
      .querySelectorAll<HTMLElement>(
        '[data-story-copy], [data-story-visual], [data-story-pop], [data-story-depth]',
      )
      .forEach((element) => element.removeAttribute('style'));
  });

  dots.forEach((dot, index) => {
    dot.dataset.active = index === 0 ? 'true' : 'false';
  });
  if (readout) readout.textContent = '01–03 / STATIC STORY';
  if (progressLine) progressLine.style.transform = 'scaleX(1)';
};

export default function StoryProductionRuntime() {
  useEffect(() => {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let generation = 0;
    let disposeCurrent = () => {};

    const setup = async () => {
      const recoveryRoot = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
      if (recoveryRoot?.dataset.storyNativeRecovery === 'true') return;
      disposeCurrent();
      generation += 1;
      const token = generation;
      const elements = readElements();
      if (!elements) return;

      const { root, scenes, dots, readout, progressLine, skipLink, afterStory } = elements;
      const previousBodyScene = document.body.dataset.animeScene;
      let frame = 0;
      let resizeTimer = 0;
      let focusTimer = 0;
      let triggerProbe = 0;
      let bootTimer = 0;
      let activeChapter = -1;
      let lastProgress = -1;
      let lastPersistedProgress = -1;
      let lastPersistedAt = 0;
      let trigger: ScrollTriggerLike | undefined;
      let ScrollTrigger: ScrollTriggerStaticLike | undefined;
      let disposed = false;
      let runtimeReady = false;
      let lastViewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const restoreOnNavigation = shouldRestoreStoredPosition();
      let pendingRestore = restoreOnNavigation ? readStoredPosition() : null;

      root.dataset.storyProgressAuthority = 'booting';
      root.dataset.storyRuntime = 'booting';
      root.dataset.storyRuntimeVisibility = document.hidden ? 'hidden' : 'visible';

      const updateViewportHeight = () => {
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
        if (Number.isFinite(viewportHeight) && viewportHeight > 0) {
          root.style.setProperty('--story-runtime-height', `${Math.round(viewportHeight)}px`);
        }
      };

      const nativeRange = () => {
        const spacer = root.parentElement?.classList.contains('pin-spacer')
          ? root.parentElement
          : null;
        const anchor = spacer ?? root;
        const rect = anchor.getBoundingClientRect();
        const start = rect.top + window.scrollY;
        const distance = Math.max(
          window.innerHeight * 5.7,
          anchor.scrollHeight - window.innerHeight,
        );
        return { start, end: start + distance };
      };

      const findTrigger = () => {
        if (!ScrollTrigger) return undefined;
        trigger = ScrollTrigger.getAll().find((candidate) => {
          const current = candidate as ScrollTriggerLike;
          return current.vars.trigger === root && current.vars.pin === root;
        }) as ScrollTriggerLike | undefined;
        return trigger;
      };

      const activateChapter = (index: number) => {
        const nextIndex = Math.max(0, Math.min(scenes.length - 1, index));
        const code = String(nextIndex + 1).padStart(2, '0');
        root.dataset.storyChapter = code;
        root.dataset.storyAuthorityChapter = code;

        scenes.forEach((scene, sceneIndex) => {
          const active = sceneIndex === nextIndex;
          scene.dataset.active = active ? 'true' : 'false';
          scene.setAttribute('aria-hidden', active ? 'false' : 'true');
          scene.toggleAttribute('inert', !active);
        });
        dots.forEach((dot, dotIndex) => {
          dot.dataset.active = dotIndex === nextIndex ? 'true' : 'false';
        });
        if (readout) readout.textContent = `${code} / 03`;
        document.body.dataset.animeScene = scenes[nextIndex]?.dataset.storyScene ?? 'ice';

        if (nextIndex === activeChapter) return;
        activeChapter = nextIndex;
        window.dispatchEvent(
          new CustomEvent('ivuru:story-chapter-change', {
            detail: {
              chapter: code,
              index: nextIndex,
              source: 'production-runtime',
            },
          }),
        );
      };

      const applyProgress = (progress: number) => {
        const normalized = clamp01(progress);
        if (Math.abs(normalized - lastProgress) < 0.0005 && activeChapter >= 0) return;
        lastProgress = normalized;
        root.style.setProperty('--story-authority-progress', normalized.toFixed(4));
        root.dataset.storyAuthorityProgress = normalized.toFixed(4);
        if (progressLine) progressLine.style.transform = `scaleX(${normalized})`;
        activateChapter(chapterAt(normalized));
      };

      const persistPosition = (progress: number, range: { start: number; end: number }) => {
        if (!runtimeReady || pendingRestore) return;
        if (window.scrollY < range.start - 2 || window.scrollY > range.end + 2) return;
        const now = performance.now();
        const normalized = clamp01(progress);
        if (
          Math.abs(normalized - lastPersistedProgress) < POSITION_PROGRESS_DELTA &&
          now - lastPersistedAt < POSITION_WRITE_INTERVAL_MS
        )
          return;

        try {
          window.sessionStorage.setItem(
            storyPositionKey(),
            JSON.stringify({ progress: normalized, updatedAt: Date.now() }),
          );
          lastPersistedProgress = normalized;
          lastPersistedAt = now;
        } catch {
          // Storage access can be unavailable in privacy-restricted contexts.
        }
      };

      const restorePosition = (currentTrigger: ScrollTriggerLike) => {
        if (!pendingRestore) return;
        const restored = pendingRestore;
        pendingRestore = null;
        const distance = Math.max(1, currentTrigger.end - currentTrigger.start);
        window.scrollTo(0, currentTrigger.start + distance * restored.progress);
        ScrollTrigger?.update?.();
        applyProgress(restored.progress);
      };

      const render = () => {
        frame = 0;
        if (disposed || token !== generation || !root.isConnected) return;
        const currentTrigger = trigger ?? findTrigger();
        const range =
          currentTrigger &&
          Number.isFinite(currentTrigger.start) &&
          Number.isFinite(currentTrigger.end) &&
          currentTrigger.end > currentTrigger.start
            ? { start: currentTrigger.start, end: currentTrigger.end }
            : nativeRange();

        root.dataset.storyScrollStart = String(Math.round(range.start));
        root.dataset.storyScrollEnd = String(Math.round(range.end));
        const progress =
          currentTrigger && Number.isFinite(currentTrigger.progress)
            ? currentTrigger.progress
            : (window.scrollY - range.start) / Math.max(1, range.end - range.start);
        applyProgress(progress);
        persistPosition(progress, range);
      };

      const requestRender = () => {
        if (!frame) frame = requestAnimationFrame(render);
      };

      const refreshAndRender = () => {
        if (disposed || token !== generation) return;
        ScrollTrigger?.refresh();
        const currentTrigger = findTrigger();
        if (currentTrigger) {
          restorePosition(currentTrigger);
          runtimeReady = true;
        }
        requestRender();
      };

      const scheduleRefresh = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(refreshAndRender, 140);
      };

      const onViewportResize = () => {
        updateViewportHeight();
        requestRender();
        const nextWidth = window.visualViewport?.width ?? window.innerWidth;
        if (Math.abs(nextWidth - lastViewportWidth) >= 1) {
          lastViewportWidth = nextWidth;
          scheduleRefresh();
        }
      };

      const onVisibilityChange = () => {
        root.dataset.storyRuntimeVisibility = document.hidden ? 'hidden' : 'visible';
        if (!document.hidden) scheduleRefresh();
      };

      const restoreStoredPosition = () => {
        pendingRestore = readStoredPosition();
        runtimeReady = false;
        scheduleRefresh();
      };

      const onPageShow = (event: PageTransitionEvent) => {
        if (event.persisted || restoreOnNavigation) {
          restoreStoredPosition();
          return;
        }
        scheduleRefresh();
      };

      const onPopState = () => restoreStoredPosition();

      const onPageHide = () => {
        const currentTrigger = trigger ?? findTrigger();
        if (!currentTrigger) return;
        persistPosition(currentTrigger.progress, {
          start: currentTrigger.start,
          end: currentTrigger.end,
        });
      };

      const onSkip = (event: Event) => {
        if (!afterStory) return;
        event.preventDefault();
        const currentTrigger = trigger ?? findTrigger();
        const destination =
          currentTrigger && Number.isFinite(currentTrigger.end)
            ? currentTrigger.end + 2
            : afterStory.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: destination,
          behavior: reducedMotion.matches ? 'auto' : 'smooth',
        });
        window.clearTimeout(focusTimer);
        focusTimer = window.setTimeout(
          () => afterStory.focus({ preventScroll: true }),
          reducedMotion.matches ? 0 : 420,
        );
      };

      updateViewportHeight();
      activateChapter(0);

      if (reducedMotion.matches) {
        applyStaticStory(elements, 'reduced-motion');
        skipLink?.addEventListener('click', onSkip);
        disposeCurrent = () => {
          disposed = true;
          skipLink?.removeEventListener('click', onSkip);
          window.clearTimeout(focusTimer);
          if (previousBodyScene) document.body.dataset.animeScene = previousBodyScene;
          else delete document.body.dataset.animeScene;
        };
        return;
      }

      try {
        const triggerModule = await import('gsap/ScrollTrigger');
        if (disposed || token !== generation || !root.isConnected) return;
        ScrollTrigger = triggerModule.ScrollTrigger as unknown as ScrollTriggerStaticLike;
      } catch (error) {
        console.error('[StoryProductionRuntime] ScrollTriggerの読込に失敗しました。', error);
        applyStaticStory(elements, 'scrolltrigger-import-failed');
      }

      if (ScrollTrigger) {
        ScrollTrigger.addEventListener('refresh', requestRender);
        triggerProbe = window.setInterval(() => {
          const currentTrigger = findTrigger();
          if (!currentTrigger) return;
          restorePosition(currentTrigger);
          runtimeReady = true;
          root.dataset.storyProgressAuthority = 'ready';
          root.dataset.storyRuntime = 'ready';
          window.clearInterval(triggerProbe);
          triggerProbe = 0;
          requestRender();
        }, TRIGGER_PROBE_INTERVAL_MS);

        bootTimer = window.setTimeout(() => {
          if (findTrigger()) return;
          applyStaticStory(elements, 'motion-boot-timeout');
        }, BOOT_TIMEOUT_MS);
      }

      window.addEventListener('scroll', requestRender, { passive: true });
      window.addEventListener('resize', onViewportResize, { passive: true });
      window.addEventListener('orientationchange', scheduleRefresh, {
        passive: true,
      });
      window.addEventListener('pageshow', onPageShow);
      window.addEventListener('popstate', onPopState);
      window.addEventListener('pagehide', onPageHide);
      window.addEventListener('beforeunload', onPageHide);
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.visualViewport?.addEventListener('resize', onViewportResize, {
        passive: true,
      });
      skipLink?.addEventListener('click', onSkip);
      requestRender();

      disposeCurrent = () => {
        disposed = true;
        runtimeReady = false;
        cancelAnimationFrame(frame);
        window.clearTimeout(resizeTimer);
        window.clearTimeout(focusTimer);
        window.clearTimeout(bootTimer);
        window.clearInterval(triggerProbe);
        ScrollTrigger?.removeEventListener('refresh', requestRender);
        window.removeEventListener('scroll', requestRender);
        window.removeEventListener('resize', onViewportResize);
        window.removeEventListener('orientationchange', scheduleRefresh);
        window.removeEventListener('pageshow', onPageShow);
        window.removeEventListener('popstate', onPopState);
        window.removeEventListener('pagehide', onPageHide);
        window.removeEventListener('beforeunload', onPageHide);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.visualViewport?.removeEventListener('resize', onViewportResize);
        skipLink?.removeEventListener('click', onSkip);
        delete root.dataset.storyProgressAuthority;
        delete root.dataset.storyRuntime;
        delete root.dataset.storyRuntimeReason;
        delete root.dataset.storyRuntimeVisibility;
        delete root.dataset.storyAuthorityProgress;
        delete root.dataset.storyAuthorityChapter;
        delete root.dataset.storyScrollStart;
        delete root.dataset.storyScrollEnd;
        root.style.removeProperty('--story-authority-progress');
        root.style.removeProperty('--story-runtime-height');
        if (previousBodyScene) document.body.dataset.animeScene = previousBodyScene;
        else delete document.body.dataset.animeScene;
      };
    };

    const onEnvironmentChange = () => void setup();
    void setup();
    document.addEventListener('astro:page-load', onEnvironmentChange);
    reducedMotion.addEventListener('change', onEnvironmentChange);

    return () => {
      generation += 1;
      disposeCurrent();
      document.removeEventListener('astro:page-load', onEnvironmentChange);
      reducedMotion.removeEventListener('change', onEnvironmentChange);
    };
  }, []);

  return null;
}
