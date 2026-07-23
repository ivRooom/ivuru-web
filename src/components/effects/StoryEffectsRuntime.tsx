import { Fragment, Suspense, lazy, useEffect, useState } from 'react';

const CinematicPointerEffects = lazy(() => import('@/components/effects/CinematicPointerEffects'));
const IOSStoryStabilityBridge = lazy(() => import('@/components/effects/IOSStoryStabilityBridge'));
const AnimeScrollDirector = lazy(() => import('@/components/effects/AnimeScrollDirector'));
const SpatialCameraEnhancer = lazy(() => import('@/components/effects/SpatialCameraEnhancer'));
const CinematicEntertainmentDirector = lazy(
  () => import('@/components/effects/CinematicEntertainmentDirector'),
);
const SingularityOverdriveDirector = lazy(
  () => import('@/components/effects/SingularityOverdriveDirector'),
);
const AdaptiveRealityDirector = lazy(() => import('@/components/effects/AdaptiveRealityDirector'));
const StoryProductionRuntime = lazy(() => import('@/components/effects/StoryProductionRuntime'));

const isIOSWebKit = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

const loaderHasFinished = () => {
  const root = document.documentElement;
  const loader = document.querySelector<HTMLElement>('[data-spatial-loader]');

  if (!loader) return true;

  return (
    root.dataset.loaderRuntimeSafe === 'true' ||
    loader.dataset.loaderRuntimeSafe === 'true' ||
    loader.hidden ||
    loader.style.display === 'none'
  );
};

const applyStaticStoryState = () => {
  const root = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
  if (!root) return;

  document.documentElement.dataset.storyEffectsProfile = 'static-stack';
  document.documentElement.dataset.storyRenderMode = 'static-stack';
  document.body.dataset.storyRenderMode = 'static-stack';

  root.dataset.storyRenderMode = 'static-stack';
  root.dataset.storyScrollMode = 'static-stack';
  root.dataset.storyMode = 'static';
  root.dataset.storyRuntime = 'ready';
  root.dataset.storyDirector = 'static';
  root.dataset.storyMobileStability = 'ready';
  root.dataset.storyProgressAuthority = 'disabled';
  root.dataset.storyChapter = 'all';
  root.querySelectorAll('[data-chapter-gate]').forEach((gate) => gate.remove());

  root.querySelectorAll<HTMLElement>('[data-anime-story-scene]').forEach((scene) => {
    scene.dataset.active = 'true';
    scene.setAttribute('aria-hidden', 'false');
    scene.removeAttribute('inert');
    scene.removeAttribute('style');
    scene
      .querySelectorAll<HTMLElement>(
        '[data-story-copy], [data-story-visual], [data-story-pop], [data-story-depth]',
      )
      .forEach((element) => element.removeAttribute('style'));
  });
};

type EffectsProfile = 'pending' | 'static-stack' | 'full';

export default function StoryEffectsRuntime() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<EffectsProfile>('pending');

  useEffect(() => {
    const compactViewport = matchMedia('(max-width: 767px)');
    let activeProfile: EffectsProfile = 'pending';
    let probeTimer = 0;
    let firstFrame = 0;
    let secondFrame = 0;

    const shouldUseStaticStory = () => isIOSWebKit() || compactViewport.matches;

    const clearDeferredStart = () => {
      window.clearInterval(probeTimer);
      probeTimer = 0;
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      firstFrame = 0;
      secondFrame = 0;
    };

    const markFullRuntimeReady = () => {
      if (activeProfile !== 'full' || !loaderHasFinished()) return;

      clearDeferredStart();
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => {
          if (activeProfile !== 'full' || !loaderHasFinished()) return;
          setReady(true);
        });
      });
    };

    const ensureCompletionProbe = () => {
      if (probeTimer !== 0) return;
      probeTimer = window.setInterval(markFullRuntimeReady, 250);
    };

    const sync = () => {
      if (shouldUseStaticStory()) {
        clearDeferredStart();
        activeProfile = 'static-stack';
        setProfile('static-stack');
        setReady(false);
        applyStaticStoryState();
        return;
      }

      document.documentElement.dataset.storyEffectsProfile = 'full';
      delete document.documentElement.dataset.storyRenderMode;
      delete document.body.dataset.storyRenderMode;

      if (activeProfile !== 'full') {
        activeProfile = 'full';
        setProfile('full');
        setReady(false);
      }

      if (loaderHasFinished()) markFullRuntimeReady();
      else ensureCompletionProbe();
    };

    sync();
    document.addEventListener('ivuru:loader-released', sync);
    document.addEventListener('ivuru:loader-runtime-safe', sync);
    document.addEventListener('astro:page-load', sync);
    window.addEventListener('pageshow', sync);
    compactViewport.addEventListener('change', sync);

    return () => {
      clearDeferredStart();
      document.removeEventListener('ivuru:loader-released', sync);
      document.removeEventListener('ivuru:loader-runtime-safe', sync);
      document.removeEventListener('astro:page-load', sync);
      window.removeEventListener('pageshow', sync);
      compactViewport.removeEventListener('change', sync);
      delete document.documentElement.dataset.storyEffectsProfile;
    };
  }, []);

  if (profile !== 'full' || !ready) return null;

  return (
    <Suspense fallback={null}>
      <Fragment>
        <CinematicPointerEffects />
        <IOSStoryStabilityBridge />
        <AnimeScrollDirector />
        <StoryProductionRuntime />
        <SpatialCameraEnhancer />
        <CinematicEntertainmentDirector />
        <SingularityOverdriveDirector />
        <AdaptiveRealityDirector />
      </Fragment>
    </Suspense>
  );
}
