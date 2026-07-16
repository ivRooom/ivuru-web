import { useEffect, useRef, useState, type CSSProperties } from 'react';

type Locale = 'ja' | 'en' | 'ko';

const loaderCopy = {
  ja: {
    label: 'いゔる。を読み込んでいます',
    tagline: 'つくる。遊ぶ。つながる。',
    status: 'ページを読み込んでいます。',
  },
  en: {
    label: 'Loading ivuru',
    tagline: 'Build. Play. Connect.',
    status: 'Loading the page. ',
  },
  ko: {
    label: 'ivuru를 불러오는 중입니다',
    tagline: '만들고, 즐기고, 이어집니다.',
    status: '페이지를 불러오는 중입니다. ',
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
    const minDuration = reduced ? 0 : seen ? 480 : 1180;
    const maxDuration = reduced ? 40 : seen ? 720 : 2100;
    const exitDelay = reduced ? 30 : seen ? 240 : 380;
    const completionDuration = reduced ? 0 : 280;
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
          setVisible(false);
          document.body.classList.remove('site-loading');
        }, exitDelay),
      );
    };

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const waitingProgress = clamp((elapsed / Math.max(minDuration, 1)) * 82, 0, 82);
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
      <div className={classNames} role="status" aria-live="polite" aria-label={copy.label}>
        <div className="anime-loader-curtain anime-loader-curtain-left" aria-hidden="true" />
        <div className="anime-loader-curtain anime-loader-curtain-right" aria-hidden="true" />
        <div className="blue-loader-signal" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="anime-loader-sparkles" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="anime-loader-card">
          <div className="anime-loader-sticker" aria-hidden="true">
            BLUE SIGNAL
          </div>
          <div className="anime-loader-mascot" aria-hidden="true">
            <span className="anime-loader-halo" />
            <img
              src="/assets/visuals/blue-anime/ivuru-loader-blue.svg"
              alt=""
              width="720"
              height="720"
            />
          </div>
          <div className="anime-loader-copy">
            <p>WELCOME TO THE BLUE MEDIA UNIVERSE</p>
            <strong>いゔる。</strong>
            <span>{copy.tagline}</span>
          </div>
          <div className="anime-loader-meter" style={progressStyle} aria-hidden="true">
            <span>
              <i />
            </span>
            <b>{String(progress).padStart(2, '0')}</b>
          </div>
        </div>
        <span className="sr-only">
          {copy.status}
          {progress}%
        </span>
      </div>
    </>
  );
}
