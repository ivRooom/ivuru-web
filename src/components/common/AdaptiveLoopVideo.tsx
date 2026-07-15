import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type AdaptiveLoopVideoProps = {
  webm: string;
  mp4: string;
  poster: string;
  title: string;
  className?: string;
  eager?: boolean;
};

type ConnectionInfo = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: 'change', listener: EventListener) => void;
  removeEventListener?: (type: 'change', listener: EventListener) => void;
};

export default function AdaptiveLoopVideo({
  webm,
  mp4,
  poster,
  title,
  className = '',
  eager = false,
}: AdaptiveLoopVideoProps) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [eligible, setEligible] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: ConnectionInfo }).connection;
    const update = () => {
      const slow = ['slow-2g', '2g'].includes(connection?.effectiveType ?? '');
      const lowPower = (navigator.hardwareConcurrency || 8) <= 2;
      setEligible(!motion.matches && !connection?.saveData && !slow && !lowPower);
    };
    const onConnectionChange: EventListener = update;
    update();
    motion.addEventListener('change', update);
    connection?.addEventListener?.('change', onConnectionChange);
    return () => {
      motion.removeEventListener('change', update);
      connection?.removeEventListener?.('change', onConnectionChange);
    };
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.18,
      rootMargin: '120px 0px',
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = video.current;
    if (!node || !eligible || !ready || failed) return;
    if (paused || !visible || document.hidden) {
      node.pause();
      return;
    }
    void node.play().catch(() => setFailed(true));
  }, [eligible, failed, paused, ready, visible]);

  const state = !eligible
    ? 'poster'
    : failed
      ? 'fallback'
      : paused
        ? 'paused'
        : ready
          ? 'playing'
          : 'loading';

  return (
    <div ref={root} className={`adaptive-loop-video ${className}`} data-media-state={state}>
      <img src={poster} alt="" width={960} height={540} loading={eager ? 'eager' : 'lazy'} />
      {eligible && !failed && (
        <video
          ref={video}
          muted
          loop
          playsInline
          preload={eager ? 'metadata' : 'none'}
          poster={poster}
          aria-label={title}
          onLoadedData={() => setReady(true)}
          onError={() => setFailed(true)}
        >
          <source src={webm} type="video/webm" />
          <source src={mp4} type="video/mp4" />
        </video>
      )}
      {eligible && !failed && (
        <button
          type="button"
          className="adaptive-loop-toggle"
          aria-label={`${paused ? 'Play' : 'Pause'} ${title}`}
          aria-pressed={!paused}
          data-analytics-event="media_playback_toggle"
          data-analytics-target={title}
          data-analytics-surface="adaptive_loop_video"
          data-analytics-status={paused ? 'play' : 'pause'}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          <span>{paused ? 'PLAY' : 'PAUSE'}</span>
        </button>
      )}
    </div>
  );
}
