import { useEffect, useRef, useState } from 'react';

export default function IntroLoader() {
  const [visible, setVisible] = useState(true);
  const [compact, setCompact] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const clearTimers = () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    };

    const play = (forceCompact = false) => {
      clearTimers();
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

      const short = forceCompact || seen;
      const duration = reduced ? 180 : short ? 680 : 1120;
      const exitLead = reduced ? 80 : short ? 250 : 340;

      setCompact(short);
      setLeaving(false);
      setVisible(true);
      document.body.classList.add('site-loading');

      timers.current.push(
        window.setTimeout(() => setLeaving(true), Math.max(0, duration - exitLead)),
        window.setTimeout(() => {
          setVisible(false);
          document.body.classList.remove('site-loading');
        }, duration),
      );
    };

    play(false);
    const onBeforePreparation = () => play(true);
    document.addEventListener('astro:before-preparation', onBeforePreparation);

    return () => {
      clearTimers();
      document.removeEventListener('astro:before-preparation', onBeforePreparation);
      document.body.classList.remove('site-loading');
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`intro-loader world-loader${compact ? ' is-compact' : ''}${leaving ? ' is-leaving' : ''}`}
      role="status"
      aria-label="Loading ivuru world"
    >
      <div className="loader-sky" aria-hidden="true"><i></i><i></i><i></i></div>
      <div className="loader-scene-line" aria-hidden="true"><span></span><span></span></div>
      <div className="loader-gate" aria-hidden="true">
        <i></i><i></i><i></i>
      </div>
      <div className="loader-identity">
        <strong>いゔる。</strong>
        <small>ivuru</small>
      </div>
      <div className="intro-worlds">
        <span>DEVELOPER</span>
        <b><i></i></b>
        <span>GAMER</span>
      </div>
      <p>WORLD CONNECTION / SYNCHRONIZING</p>
      <span className="sr-only">ページを読み込んでいます</span>
    </div>
  );
}
