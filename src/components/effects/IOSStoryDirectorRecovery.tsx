import { useEffect } from 'react';

const RECOVERY_DELAY_MS = 1_800;
const CHAPTER_CODES = ['01', '02', '03'] as const;
const CONTENT_SELECTOR =
  '[data-story-copy], [data-story-visual], [data-story-pop], [data-story-depth]';

const isIOSWebKit = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const readRoot = () => document.querySelector<HTMLElement>('[data-anime-scroll-story]');

export default function IOSStoryDirectorRecovery() {
  useEffect(() => {
    let disposeCurrent = () => {};

    const setup = () => {
      disposeCurrent();

      const root = readRoot();
      if (!root || !isIOSWebKit()) return;

      const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-anime-story-scene]'));
      if (scenes.length !== CHAPTER_CODES.length) return;

      const dots = Array.from(root.querySelectorAll<HTMLElement>('[data-story-progress-dot]'));
      const readout = root.querySelector<HTMLElement>('[data-story-chapter-readout]');
      const progressLine = root.querySelector<HTMLElement>('[data-story-progress-line]');
      let disposed = false;
      let recoveryActive = false;
      let start = 0;
      let end = 1;
      let activeChapter = -1;
      let recoveryTimer = 0;
      let frame = 0;

      const realDirectorIsReady = () =>
        root.dataset.storyDirector === 'ready' &&
        root.dataset.storyTransitionEngine === 'world-forge' &&
        root.dataset.storySnapState === 'ready';

      const updateRange = () => {
        const rootTop = root.getBoundingClientRect().top + window.scrollY;
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
        start = Math.max(0, rootTop);
        end = start + Math.max(1, Math.round(viewportHeight * 5.7));
        root.dataset.storyScrollStart = String(Math.round(start));
        root.dataset.storyScrollEnd = String(Math.round(end));
      };

      const renderChapter = (index: number, progress: number) => {
        const nextIndex = Math.max(0, Math.min(CHAPTER_CODES.length - 1, index));
        const chapter = CHAPTER_CODES[nextIndex];
        const chapterChanged = nextIndex !== activeChapter;
        activeChapter = nextIndex;

        root.dataset.storyChapter = chapter;
        root.dataset.storyAuthorityChapter = chapter;
        root.dataset.storyAuthorityProgress = progress.toFixed(4);
        root.style.setProperty('--story-authority-progress', progress.toFixed(4));

        scenes.forEach((scene, sceneIndex) => {
          const active = sceneIndex === nextIndex;
          scene.dataset.active = active ? 'true' : 'false';
          scene.setAttribute('aria-hidden', active ? 'false' : 'true');
          scene.toggleAttribute('inert', !active);
          scene.style.opacity = active ? '1' : '0';
          scene.style.visibility = active ? 'visible' : 'hidden';
          scene.style.pointerEvents = active ? 'auto' : 'none';
          scene.style.transform = active ? 'translate3d(0, 0, 0)' : 'translate3d(0, 20px, 0)';
          scene.style.transition = 'opacity 220ms ease, transform 260ms ease';

          if (active) {
            scene.querySelectorAll<HTMLElement>(CONTENT_SELECTOR).forEach((element) => {
              element.style.removeProperty('opacity');
              element.style.removeProperty('visibility');
            });
          }
        });

        dots.forEach((dot, dotIndex) => {
          dot.dataset.active = dotIndex === nextIndex ? 'true' : 'false';
        });
        if (readout) readout.textContent = `${chapter} / 03`;
        if (progressLine) progressLine.style.transform = `scaleX(${progress})`;
        document.body.dataset.animeScene = scenes[nextIndex]?.dataset.storyScene ?? 'ice';

        if (chapterChanged) {
          window.dispatchEvent(
            new CustomEvent('ivuru:story-chapter-change', {
              detail: { chapter, index: nextIndex, source: 'ios-director-recovery' },
            }),
          );
        }
      };

      const update = () => {
        if (disposed || !root.isConnected) return;
        if (realDirectorIsReady()) {
          recoveryActive = false;
          return;
        }
        if (!recoveryActive) return;

        const progress = Math.max(
          0,
          Math.min(1, (window.scrollY - start) / Math.max(1, end - start)),
        );
        const chapterIndex = progress < 0.34 ? 0 : progress < 0.67 ? 1 : 2;
        const rect = root.getBoundingClientRect();
        root.dataset.storyInView =
          rect.bottom >= 0 && rect.top <= (window.visualViewport?.height ?? window.innerHeight)
            ? 'true'
            : 'false';
        renderChapter(chapterIndex, progress);
      };

      const activateRecovery = () => {
        if (disposed || realDirectorIsReady() || recoveryActive) return;
        recoveryActive = true;
        root.dataset.storyDirector = 'ready';
        root.dataset.storyRuntime = 'ready';
        root.dataset.storyProgressAuthority = 'ready';
        root.dataset.storyMobileStability = 'ready';
        root.dataset.storyMode = 'motion';
        root.dataset.storyMask = 'active';
        root.dataset.storyPerformance = 'ios-director-recovery';
        root.dataset.storyTransitionEngine = 'ios-recovery';
        root.dataset.storySnap = 'disabled-mobile';
        root.dataset.storySnapState = 'ready';
        root.dataset.storyIOSDirectorRecovery = 'true';
        root.style.overflowX = 'clip';
        delete root.dataset.storyRuntimeReason;
        delete root.dataset.storyMobileRecovery;
        delete root.dataset.storyMobileTerminalFallback;
        updateRange();
        update();
      };

      const onScroll = () => {
        if (!recoveryActive && !realDirectorIsReady()) activateRecovery();
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(update);
      };
      const onViewportChange = () => {
        if (realDirectorIsReady()) return;
        updateRange();
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(update);
      };
      const onVisibilityChange = () => {
        if (!document.hidden) onViewportChange();
      };

      recoveryTimer = window.setTimeout(activateRecovery, RECOVERY_DELAY_MS);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onViewportChange, { passive: true });
      window.addEventListener('orientationchange', onViewportChange, { passive: true });
      window.addEventListener('pageshow', onViewportChange);
      window.visualViewport?.addEventListener('resize', onViewportChange, { passive: true });
      document.addEventListener('visibilitychange', onVisibilityChange);

      disposeCurrent = () => {
        disposed = true;
        window.clearTimeout(recoveryTimer);
        cancelAnimationFrame(frame);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onViewportChange);
        window.removeEventListener('orientationchange', onViewportChange);
        window.removeEventListener('pageshow', onViewportChange);
        window.visualViewport?.removeEventListener('resize', onViewportChange);
        document.removeEventListener('visibilitychange', onVisibilityChange);

        if (root.dataset.storyIOSDirectorRecovery === 'true') {
          delete root.dataset.storyIOSDirectorRecovery;
          root.style.removeProperty('overflow-x');
          scenes.forEach((scene) => {
            scene.style.removeProperty('opacity');
            scene.style.removeProperty('visibility');
            scene.style.removeProperty('pointer-events');
            scene.style.removeProperty('transform');
            scene.style.removeProperty('transition');
          });
        }
      };
    };

    setup();
    document.addEventListener('astro:page-load', setup);

    return () => {
      disposeCurrent();
      document.removeEventListener('astro:page-load', setup);
    };
  }, []);

  return null;
}
