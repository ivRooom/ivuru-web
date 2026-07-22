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

export default function StoryEffectsRuntime() {
  const [ready, setReady] = useState(false);
  const [iosCore, setIOSCore] = useState(false);

  useEffect(() => {
    let observer: MutationObserver | undefined;
    let probeTimer = 0;
    const ios = isIOSWebKit();

    setIOSCore(ios);
    document.documentElement.dataset.storyEffectsProfile = ios ? 'ios-core' : 'full';

    const release = () => setReady(true);
    const sync = () => {
      if (loaderHasFinished()) release();
    };

    sync();
    document.addEventListener('ivuru:loader-released', release);
    document.addEventListener('astro:page-load', sync);
    window.addEventListener('pageshow', sync);

    if ('MutationObserver' in window) {
      observer = new MutationObserver(sync);
      observer.observe(document.documentElement, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: [
          'aria-hidden',
          'class',
          'data-loader-released',
          'data-state',
          'data-guard-released',
          'data-completion-bridged',
          'hidden',
          'style',
        ],
      });
    }

    probeTimer = window.setInterval(sync, 250);

    return () => {
      observer?.disconnect();
      window.clearInterval(probeTimer);
      document.removeEventListener('ivuru:loader-released', release);
      document.removeEventListener('astro:page-load', sync);
      window.removeEventListener('pageshow', sync);
      delete document.documentElement.dataset.storyEffectsProfile;
    };
  }, []);

  if (!ready) return null;

  if (iosCore) {
    return (
      <Fragment>
        <IOSStoryStabilityBridge />
        <AnimeScrollDirector />
      </Fragment>
    );
  }

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
