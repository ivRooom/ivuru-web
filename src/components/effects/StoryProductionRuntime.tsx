import { useEffect } from 'react';

type ScrollTriggerLike = {
  start: number;
  end: number;
  progress: number;
  vars: { trigger?: Element | string; pin?: Element | string | boolean };
  refresh?: () => void;
  update?: () => void;
};

type ScrollTriggerStaticLike = {
  getAll: () => unknown[];
  refresh: () => void;
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

const STORY_DURATION = 6;
const CHAPTER_BREAKS = [0, 1.72 / STORY_DURATION, 4.12 / STORY_DURATION] as const;
const BOOT_TIMEOUT_MS = 4500;
const TRIGGER_PROBE_INTERVAL_MS = 100;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const chapterAt = (progress: number) => {
  if (progress >= CHAPTER_BREAKS[2]) return 2;
  if (progress >= CHAPTER_BREAKS[1]) return 1;
  return 0;
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
      let trigger: ScrollTriggerLike | undefined;
      let ScrollTrigger: ScrollTriggerStaticLike | undefined;
      let disposed = false;
      let lastViewportWidth = window.visualViewport?.width ?? window.innerWidth;

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
            detail: { chapter: code, index: nextIndex, source: 'production-runtime' },
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
      };

      const requestRender = () => {
        if (!frame) frame = requestAnimationFrame(render);
      };

      const refreshAndRender = () => {
        if (disposed || token !== generation) return;
        ScrollTrigger?.refresh();
        findTrigger();
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

      const onPageRestore = () => scheduleRefresh();

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
          if (!findTrigger()) return;
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
      window.addEventListener('orientationchange', scheduleRefresh, { passive: true });
      window.addEventListener('pageshow', onPageRestore);
      window.addEventListener('popstate', onPageRestore);
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.visualViewport?.addEventListener('resize', onViewportResize, { passive: true });
      skipLink?.addEventListener('click', onSkip);
      requestRender();

      disposeCurrent = () => {
        disposed = true;
        cancelAnimationFrame(frame);
        window.clearTimeout(resizeTimer);
        window.clearTimeout(focusTimer);
        window.clearTimeout(bootTimer);
        window.clearInterval(triggerProbe);
        ScrollTrigger?.removeEventListener('refresh', requestRender);
        window.removeEventListener('scroll', requestRender);
        window.removeEventListener('resize', onViewportResize);
        window.removeEventListener('orientationchange', scheduleRefresh);
        window.removeEventListener('pageshow', onPageRestore);
        window.removeEventListener('popstate', onPageRestore);
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
