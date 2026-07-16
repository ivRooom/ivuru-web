import { useEffect, useRef, useState, type CSSProperties } from 'react';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function IntroLoader() {
  const [visible, setVisible] = useState(true);
  const [compact, setCompact] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const timers = useRef<number[]>([]);

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
    const startedAt = performance.now();
    let pageReady = document.readyState !== 'loading';
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
      const readyProgress = pageReady
        ? clamp(82 + ((elapsed - minDuration * 0.62) / 280) * 18, 82, 100)
        : 82;
      setProgress(
        Math.round(pageReady ? Math.max(waitingProgress, readyProgress) : waitingProgress),
      );

      if ((pageReady && elapsed >= minDuration) || elapsed >= maxDuration) {
        complete();
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    const markReady = () => {
      pageReady = true;
    };

    setCompact(seen);
    setLeaving(false);
    setVisible(true);
    setProgress(reduced ? 100 : 0);
    document.body.classList.add('site-loading');
    window.addEventListener('load', markReady, { once: true });
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
    compact && 'is-compact',
    leaving && 'is-leaving',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} role="status" aria-live="polite" aria-label="Loading ivuru">
      <div className="anime-loader-curtain anime-loader-curtain-left" aria-hidden="true" />
      <div className="anime-loader-curtain anime-loader-curtain-right" aria-hidden="true" />
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
          NEW SCENE
        </div>
        <div className="anime-loader-mascot" aria-hidden="true">
          <span className="anime-loader-halo" />
          <img
            src="/assets/visuals/anime/ivuru-loader-mascot.svg"
            alt=""
            width="720"
            height="720"
          />
        </div>
        <div className="anime-loader-copy">
          <p>WELCOME TO MY LITTLE WORLD</p>
          <strong>いゔる。</strong>
          <span>つくる。遊ぶ。つなげる。</span>
        </div>
        <div className="anime-loader-meter" style={progressStyle} aria-hidden="true">
          <span>
            <i />
          </span>
          <b>{String(progress).padStart(2, '0')}</b>
        </div>
      </div>
      <span className="sr-only">ページを読み込んでいます。{progress}%</span>
    </div>
  );
}
