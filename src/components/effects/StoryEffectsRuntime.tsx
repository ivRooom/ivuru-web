import { Fragment, useEffect, useState } from 'react';
import CinematicPointerEffects from '@/components/effects/CinematicPointerEffects';
import IOSStoryStabilityBridge from '@/components/effects/IOSStoryStabilityBridge';
import AnimeScrollDirector from '@/components/effects/AnimeScrollDirector';
import SpatialCameraEnhancer from '@/components/effects/SpatialCameraEnhancer';
import CinematicEntertainmentDirector from '@/components/effects/CinematicEntertainmentDirector';
import SingularityOverdriveDirector from '@/components/effects/SingularityOverdriveDirector';
import AdaptiveRealityDirector from '@/components/effects/AdaptiveRealityDirector';
import StoryProductionRuntime from '@/components/effects/StoryProductionRuntime';

const isIOSWebKit = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

const loaderHasFinished = () => {
  const root = document.documentElement;
  const loader = document.querySelector<HTMLElement>('[data-spatial-loader]');

  if (root.dataset.loaderReleased === 'true') return true;
  if (!loader) return true;

  return (
    loader.hidden ||
    loader.getAttribute('aria-hidden') === 'true' ||
    loader.style.display === 'none' ||
    loader.dataset.state === 'ready' ||
    loader.dataset.guardReleased === 'true' ||
    loader.dataset.completionBridged === 'true' ||
    loader.classList.contains('loaded')
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
    let probeTimer = 0;

    const shouldUseStaticStory = () => isIOSWebKit() || compactViewport.matches;

    const sync = () => {
      if (shouldUseStaticStory()) {
        setProfile('static-stack');
        setReady(false);
        applyStaticStoryState();
        return;
      }

      document.documentElement.dataset.storyEffectsProfile = 'full';
      delete document.documentElement.dataset.storyRenderMode;
      delete document.body.dataset.storyRenderMode;
      setProfile('full');
      if (loaderHasFinished()) setReady(true);
    };

    const release = () => sync();

    sync();
    document.addEventListener('ivuru:loader-released', release);
    document.addEventListener('astro:page-load', sync);
    window.addEventListener('pageshow', sync);
    compactViewport.addEventListener('change', sync);
    probeTimer = window.setInterval(sync, 250);

    return () => {
      window.clearInterval(probeTimer);
      document.removeEventListener('ivuru:loader-released', release);
      document.removeEventListener('astro:page-load', sync);
      window.removeEventListener('pageshow', sync);
      compactViewport.removeEventListener('change', sync);
      delete document.documentElement.dataset.storyEffectsProfile;
    };
  }, []);

  if (profile !== 'full' || !ready) return null;

  return (
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
  );
}
