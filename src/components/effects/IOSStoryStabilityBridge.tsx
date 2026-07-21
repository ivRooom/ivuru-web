import { useEffect } from 'react';

type ScrollTriggerStaticLike = {
  config?: (options: { ignoreMobileResize?: boolean }) => void;
  refresh: () => void;
  update: () => void;
};

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
    let disposeCurrent = () => {};

    const setup = async () => {
      disposeCurrent();

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
      let viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      let viewportHeight = window.visualViewport?.height ?? window.innerHeight;

      root.dataset.storyPlatform = iosWebKit ? 'ios-webkit' : 'compact-webkit';
      root.dataset.storyMobileStability = 'booting';

      const syncViewport = () => {
        const nextHeight = window.visualViewport?.height ?? window.innerHeight;
        if (!Number.isFinite(nextHeight) || nextHeight <= 0) return;
        root.style.setProperty('--story-runtime-height', `${Math.round(nextHeight)}px`);
      };

      const recoverPrematureFallback = () => {
        if (root.dataset.storyRuntimeReason !== 'motion-boot-timeout') return;
        if (root.dataset.storyDirector !== 'booting') return;

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
        recoverPrematureFallback();
        if (
          root.dataset.storyDirector === 'ready' &&
          root.dataset.storyRuntime === 'ready' &&
          root.dataset.storyMode === 'motion'
        ) {
          root.dataset.storyMobileStability = 'ready';
          delete root.dataset.storyMobileRecovery;
          window.clearInterval(recoveryProbe);
          recoveryProbe = 0;
        }
      };

      const refreshAfterLayoutSettles = () => {
        if (disposed || !root.isConnected) return;
        syncViewport();
        ScrollTrigger?.update();
        cancelAnimationFrame(firstFrame);
        cancelAnimationFrame(secondFrame);
        firstFrame = requestAnimationFrame(() => {
          secondFrame = requestAnimationFrame(() => {
            if (disposed || !root.isConnected) return;
            ScrollTrigger?.refresh();
            ScrollTrigger?.update();
            updateReadyState();
          });
        });
      };

      const scheduleRefresh = (delay = 180) => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(refreshAfterLayoutSettles, delay);
      };

      const onScroll = () => {
        ScrollTrigger?.update();
        updateReadyState();
      };

      const onViewportChange = () => {
        const nextWidth = window.visualViewport?.width ?? window.innerWidth;
        const nextHeight = window.visualViewport?.height ?? window.innerHeight;
        const widthChanged = Math.abs(nextWidth - viewportWidth) >= 1;
        const heightChanged = Math.abs(nextHeight - viewportHeight) >= 24;
        viewportWidth = nextWidth;
        viewportHeight = nextHeight;
        syncViewport();
        ScrollTrigger?.update();
        if (widthChanged || heightChanged) scheduleRefresh(260);
      };

      const onTouchEnd = () => scheduleRefresh(90);
      const onOrientationChange = () => scheduleRefresh(360);
      const onPageShow = () => scheduleRefresh(80);
      const onVisibilityChange = () => {
        if (!document.hidden) scheduleRefresh(120);
      };

      if ('MutationObserver' in window) {
        observer = new MutationObserver(updateReadyState);
        observer.observe(root, {
          attributes: true,
          attributeFilter: [
            'data-story-runtime-reason',
            'data-story-runtime',
            'data-story-director',
            'data-story-mode',
          ],
        });
      }

      recoveryProbe = window.setInterval(updateReadyState, 250);
      syncViewport();
      updateReadyState();

      try {
        const triggerModule = await import('gsap/ScrollTrigger');
        if (disposed || !root.isConnected) return;
        ScrollTrigger = triggerModule.ScrollTrigger as unknown as ScrollTriggerStaticLike;
        ScrollTrigger.config?.({ ignoreMobileResize: true });
        root.dataset.storyMobileStability = 'syncing';
        scheduleRefresh(0);
      } catch (error) {
        console.error('[IOSStoryStabilityBridge] ScrollTriggerの読込に失敗しました。', error);
        root.dataset.storyMobileStability = 'native-only';
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
      };
    };

    const onEnvironmentChange = () => void setup();
    void setup();
    document.addEventListener('astro:page-load', onEnvironmentChange);

    return () => {
      disposeCurrent();
      document.removeEventListener('astro:page-load', onEnvironmentChange);
    };
  }, []);

  return null;
}
