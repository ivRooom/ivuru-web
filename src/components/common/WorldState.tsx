import { useEffect } from 'react';

const states = ['dawn', 'day', 'sunset', 'night'] as const;

export default function WorldState() {
  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(window.scrollY / max, 0), 1);
      const index = Math.min(Math.floor(progress * states.length), states.length - 1);
      document.documentElement.dataset.worldTime = states[index];
      document.documentElement.style.setProperty('--world-progress', progress.toFixed(4));
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    document.addEventListener('astro:page-load', requestUpdate as EventListener);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      document.removeEventListener('astro:page-load', requestUpdate as EventListener);
      delete document.documentElement.dataset.worldTime;
      document.documentElement.style.removeProperty('--world-progress');
    };
  }, []);

  return null;
}
