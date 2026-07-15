import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import '@/styles/hero-cinematic.css';

const PortalScene = lazy(() => import('../effects/PortalScene'));

type Locale = 'ja' | 'en' | 'ko';
type ConnectionInfo = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: 'change', listener: EventListener) => void;
  removeEventListener?: (type: 'change', listener: EventListener) => void;
};

const copy = {
  ja: {
    pause: '背景ムービーを一時停止',
    play: '背景ムービーを再生',
  },
  en: {
    pause: 'Pause the background movie',
    play: 'Play the background movie',
  },
  ko: {
    pause: '배경 영상을 일시 정지',
    play: '배경 영상을 재생',
  },
} as const;

const motionStorageKey = 'ivuru-hero-motion';

const readPausedPreference = () => {
  try {
    return sessionStorage.getItem(motionStorageKey) === 'paused';
  } catch {
    return false;
  }
};

export default function HeroWorld({ locale }: { locale: Locale }) {
  const video = useRef<HTMLVideoElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const [videoEligible, setVideoEligible] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [pausedByUser, setPausedByUser] = useState(readPausedPreference);
  const [inViewport, setInViewport] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [portalReady, setPortalReady] = useState(false);
  const t = copy[locale];

  useEffect(() => {
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: ConnectionInfo }).connection;
    const updateEligibility = () => {
      const slowConnection = ['slow-2g', '2g'].includes(connection?.effectiveType ?? '');
      const veryLowPower = (navigator.hardwareConcurrency || 8) <= 2;
      const eligible =
        !motionQuery.matches && !connection?.saveData && !slowConnection && !veryLowPower;

      setVideoEligible(eligible);
      if (!eligible) {
        video.current?.pause();
        setVideoReady(false);
        setVideoFailed(false);
        setPortalReady(false);
      }
    };
    const connectionListener: EventListener = () => updateEligibility();

    setTabVisible(!document.hidden);
    updateEligibility();
    motionQuery.addEventListener('change', updateEligibility);
    connection?.addEventListener?.('change', connectionListener);

    return () => {
      motionQuery.removeEventListener('change', updateEligibility);
      connection?.removeEventListener?.('change', connectionListener);
    };
  }, []);

  useEffect(() => {
    const node = media.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(([entry]) => setInViewport(entry.isIntersecting), {
      threshold: 0.05,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    const node = video.current;
    if (!node || !videoEligible || !videoReady || videoFailed) return;

    if (pausedByUser || !inViewport || !tabVisible) {
      node.pause();
      return;
    }

    void node.play().catch(() => setVideoFailed(true));
  }, [inViewport, pausedByUser, tabVisible, videoEligible, videoFailed, videoReady]);

  useEffect(() => {
    if (!videoFailed) {
      setPortalReady(false);
      return;
    }

    const timeout = window.setTimeout(() => setPortalReady(true), 250);
    return () => window.clearTimeout(timeout);
  }, [videoFailed]);

  const toggleMotion = () => {
    setPausedByUser((current) => {
      const next = !current;
      try {
        sessionStorage.setItem(motionStorageKey, next ? 'paused' : 'playing');
      } catch {
        // The preference remains valid for the current page when storage is unavailable.
      }
      return next;
    });
  };

  const mediaState = !videoEligible
    ? 'poster'
    : videoFailed
      ? 'fallback'
      : pausedByUser
        ? 'paused'
        : videoReady
          ? 'playing'
          : 'loading';

  return (
    <>
      <div
        ref={media}
        className="hero-cinematic"
        data-hero-cinematic
        data-state={mediaState}
        aria-hidden="true"
      >
        <div className="hero-cinematic-poster" />
        {videoEligible && !videoFailed && (
          <video
            ref={video}
            data-hero-video
            muted
            loop
            playsInline
            autoPlay={!pausedByUser}
            preload="metadata"
            poster="/assets/video/hero-anime-op-poster.webp"
            tabIndex={-1}
            onLoadedData={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
          >
            <source src="/assets/video/hero-anime-op-loop.webm" type="video/webm" />
            <source src="/assets/video/hero-anime-op-loop.mp4" type="video/mp4" />
          </video>
        )}
      </div>

      <div className="hero-canvas" data-hero-portal-fallback={portalReady || undefined}>
        {portalReady && (
          <Suspense fallback={null}>
            <PortalScene reduced={false} />
          </Suspense>
        )}
      </div>

      {videoEligible && !videoFailed && (
        <button
          type="button"
          className="hero-motion-toggle"
          aria-label={pausedByUser ? t.play : t.pause}
          aria-pressed={!pausedByUser}
          title={pausedByUser ? t.play : t.pause}
          onClick={toggleMotion}
        >
          <i aria-hidden="true" />
          <span>MOTION / {pausedByUser ? 'OFF' : 'ON'}</span>
        </button>
      )}
    </>
  );
}
