import { Fragment, useEffect, useState } from 'react';
import CinematicPointerEffects from '@/components/effects/CinematicPointerEffects';
import IOSStoryStabilityBridge from '@/components/effects/IOSStoryStabilityBridge';
import AnimeScrollDirector from '@/components/effects/AnimeScrollDirector';
import SpatialCameraEnhancer from '@/components/effects/SpatialCameraEnhancer';
import CinematicEntertainmentDirector from '@/components/effects/CinematicEntertainmentDirector';
import SingularityOverdriveDirector from '@/components/effects/SingularityOverdriveDirector';
import AdaptiveRealityDirector from '@/components/effects/AdaptiveRealityDirector';
import StoryProductionRuntime from '@/components/effects/StoryProductionRuntime';

const loaderHasFinished = () => {
  const loader = document.querySelector<HTMLElement>('[data-spatial-loader]');
  if (!loader) return true;

  return (
    loader.hidden ||
    loader.getAttribute('aria-hidden') === 'true' ||
    loader.style.display === 'none'
  );
};

export default function StoryEffectsRuntime() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const release = () => setReady(true);
    const sync = () => {
      if (loaderHasFinished()) release();
    };

    sync();
    document.addEventListener('ivuru:loader-released', release);
    document.addEventListener('astro:page-load', sync);
    window.addEventListener('pageshow', sync);

    return () => {
      document.removeEventListener('ivuru:loader-released', release);
      document.removeEventListener('astro:page-load', sync);
      window.removeEventListener('pageshow', sync);
    };
  }, []);

  if (!ready) return null;

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
