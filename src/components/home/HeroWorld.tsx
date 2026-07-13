import { lazy, Suspense, useEffect, useState } from 'react';
const PortalScene = lazy(() => import('../effects/PortalScene'));

export default function HeroWorld() {
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dataSaver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData;
    const lowPower = (navigator.hardwareConcurrency || 8) <= 4 || innerWidth < 720;
    setReduced(Boolean(motion || dataSaver || lowPower));

    let idleId: number | undefined;
    let timeoutId: number | undefined;
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(() => setReady(true), { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(() => setReady(true), 300);
    }

    return () => {
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="hero-canvas">
      {ready && (
        <Suspense fallback={null}>
          <PortalScene reduced={reduced} />
        </Suspense>
      )}
    </div>
  );
}