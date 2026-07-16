import { useEffect, useRef, useState, type CSSProperties } from 'react';

type Locale = 'ja' | 'en' | 'ko';

const loaderCopy = {
  ja: {
    label: 'いゔる。を読み込んでいます',
    tagline: 'つくる。遊ぶ。つながる。',
    status: 'ページを読み込んでいます。',
    phase: '世界を同期しています',
  },
  en: {
    label: 'Loading ivuru',
    tagline: 'Build. Play. Connect.',
    status: 'Loading the page.',
    phase: 'Synchronizing worlds',
  },
  ko: {
    label: 'ivuru를 불러오는 중입니다',
    tagline: '만들고, 즐기고, 이어집니다.',
    status: '페이지를 불러오는 중입니다.',
    phase: '세계를 동기화하는 중',
  },
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function IntroLoader({ locale = 'ja' }: { locale?: Locale }) {
  const [visible, setVisible] = useState(true);
  const [compact, setCompact] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const timers = useRef<number[]>([]);
  const copy = loaderCopy[locale];

  useEffect(() => {
    if (document.documentElement.dataset.loaderReleased === 'true') {
      setVisible(false);
      document.body.classList.remove('site-loading');
      return;
    }

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seen = (() => {
      try {
        const hasSeen = sessionStorage.getItem('ivuru-intro-seen') === '1';
        sessionStorage.setItem('ivuru-intro-seen', '1');
        return hasSeen;
      } catch {
        return true;
      }
    })();
    const minDuration = reduced ? 0 : seen ? 180 : 780;
    const maxDuration = reduced ? 20 : seen ? 420 : 1380;
    const exitDelay = reduced ? 20 : 680;
    const completionDuration = reduced ? 0 : 190;
    const startedAt = performance.now();
    let readyAt: number | null = document.readyState === 'complete' ? startedAt : null;
    let finished = false;
    let frame = 0;

    const clearTimers = () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    };

    const complete = () => {
      if (finished) return;
      finished = true;
      setProgress(100);
      setLeaving(true);
      timers.current.push(
        window.setTimeout(() => {
          document.documentElement.dataset.loaderReleased = 'true';
          setVisible(false);
          document.body.classList.remove('site-loading');
        }, exitDelay),
      );
    };

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const waitingProgress = clamp((elapsed / Math.max(minDuration, 1)) * 84, 0, 84);
      const completionRatio =
        readyAt === null ? 0 : clamp((now - readyAt) / Math.max(completionDuration, 1), 0, 1);
      const nextProgress = waitingProgress + (100 - waitingProgress) * completionRatio;
      setProgress(Math.round(nextProgress));

      const loadTransitionFinished =
        readyAt !== null && elapsed >= minDuration && now - readyAt >= completionDuration;
      if (loadTransitionFinished || elapsed >= maxDuration) {
        complete();
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    const markReady = () => {
      readyAt ??= performance.now();
    };

    setCompact(seen);
    setLeaving(false);
    setVisible(true);
    setProgress(reduced ? 100 : 0);
    document.body.classList.add('site-loading');
    if (readyAt === null) window.addEventListener('load', markReady, { once: true });
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      clearTimers();
      window.removeEventListener('load', markReady);
      document.body.classList.remove('site-loading');
    };
  }, []);

  if (!visible) return null;

  const progressStyle = { '--loader-progress': `${progress}%` } as CSSProperties;
  const classNames = [
    'intro-loader',
    'world-loader',
    'anime-intro-loader',
    'blue-signal-loader',
    'signal-title-loader',
    compact && 'is-compact',
    leaving && 'is-leaving',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <noscript>
        <style>{'.anime-intro-loader { display: none !important; }'}</style>
      </noscript>
      <div className={classNames} style={progressStyle}>
        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {copy.status}
        </span>

        <div className="signal-loader-background" aria-hidden="true">
          <span className="signal-loader-grid" />
          <span className="signal-loader-horizon" />
          <span className="signal-loader-sweep" />
          <span className="signal-loader-rail rail-a" />
          <span className="signal-loader-rail rail-b" />
          <span className="signal-loader-rail rail-c" />
          <div className="signal-loader-particles">
            <i /><i /><i /><i /><i /><i /><i /><i />
          </div>
        </div>

        <div className="signal-loader-shell">
          <header className="signal-loader-header" aria-hidden="true">
            <span>IVURU / BOOT SEQUENCE</span>
            <span>NODE 00 · BLUE MEDIA</span>
          </header>

          <div className="signal-loader-stage">
            <div className="blue-loader-signal signal-loader-core" aria-hidden="true">
              <span className="signal-loader-orbit orbit-a" />
              <span className="signal-loader-orbit orbit-b" />
              <span className="signal-loader-orbit orbit-c" />
              <span className="signal-loader-crosshair horizontal" />
              <span className="signal-loader-crosshair vertical" />
              <div className="signal-loader-emblem"><i /><i /><b>IV</b></div>
              <small>SIGNAL / {String(progress).padStart(3, '0')}</small>
            </div>

            <div className="signal-loader-copy">
              <p>WELCOME TO THE BLUE MEDIA UNIVERSE</p>
              <strong data-text="いゔる。">いゔる。</strong>
              <span>{copy.tagline}</span>
            </div>
          </div>

          <footer className="signal-loader-footer">
            <div className="signal-loader-phase">
              <span>{copy.phase}</span>
              <small>{progress < 100 ? 'CONNECTING' : 'READY'}</small>
            </div>
            <div
              className="anime-loader-meter signal-loader-meter"
              role="progressbar"
              aria-label={copy.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <span aria-hidden="true"><i /></span>
              <b aria-hidden="true">{String(progress).padStart(2, '0')}</b>
            </div>
          </footer>
        </div>

        <div className="signal-loader-release" aria-hidden="true"><i /></div>
      </div>
    </>
  );
}
