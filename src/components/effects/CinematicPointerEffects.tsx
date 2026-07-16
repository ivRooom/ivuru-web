import { useEffect } from 'react';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function CinematicPointerEffects() {
  useEffect(() => {
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    const pointerQuery = matchMedia('(hover: hover) and (pointer: fine)');
    let disposers: Array<() => void> = [];

    const resetHeroVariables = (hero: HTMLElement) => {
      hero.style.setProperty('--hero-shift-x', '0px');
      hero.style.setProperty('--hero-shift-y', '0px');
      hero.style.setProperty('--hero-shift-x-soft', '0px');
      hero.style.setProperty('--hero-shift-y-soft', '0px');
      hero.style.setProperty('--hero-shift-x-deep', '0px');
      hero.style.setProperty('--hero-shift-y-deep', '0px');
    };

    const resetCardVariables = (card: HTMLElement) => {
      card.style.setProperty('--card-tilt-x', '0deg');
      card.style.setProperty('--card-tilt-y', '0deg');
      card.style.setProperty('--card-glow-x', '50%');
      card.style.setProperty('--card-glow-y', '50%');
    };

    const dispose = () => {
      disposers.forEach((remove) => remove());
      disposers = [];
    };

    const bindHero = (hero: HTMLElement) => {
      resetHeroVariables(hero);
      if (motionQuery.matches || !pointerQuery.matches) return;

      let frame = 0;
      let x = 0;
      let y = 0;

      const render = () => {
        frame = 0;
        hero.style.setProperty('--hero-shift-x', `${x * 14}px`);
        hero.style.setProperty('--hero-shift-y', `${y * 10}px`);
        hero.style.setProperty('--hero-shift-x-soft', `${x * 7}px`);
        hero.style.setProperty('--hero-shift-y-soft', `${y * 5}px`);
        hero.style.setProperty('--hero-shift-x-deep', `${x * 24}px`);
        hero.style.setProperty('--hero-shift-y-deep', `${y * 18}px`);
      };

      // Pointer events are coalesced into one visual update per animation frame.
      const schedule = (nextX: number, nextY: number) => {
        x = nextX;
        y = nextY;
        if (!frame) frame = requestAnimationFrame(render);
      };

      const onPointerMove = (event: PointerEvent) => {
        const rect = hero.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const nextX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const nextY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        schedule(clamp(nextX, -1, 1), clamp(nextY, -1, 1));
      };

      const onPointerLeave = () => schedule(0, 0);
      hero.addEventListener('pointermove', onPointerMove, { passive: true });
      hero.addEventListener('pointerleave', onPointerLeave, { passive: true });
      hero.dataset.cinematicPointer = 'active';

      disposers.push(() => {
        cancelAnimationFrame(frame);
        hero.removeEventListener('pointermove', onPointerMove);
        hero.removeEventListener('pointerleave', onPointerLeave);
        resetHeroVariables(hero);
        delete hero.dataset.cinematicPointer;
      });
    };

    const bindCard = (card: HTMLElement) => {
      resetCardVariables(card);
      if (motionQuery.matches || !pointerQuery.matches) return;

      let frame = 0;
      let tiltX = 0;
      let tiltY = 0;
      let glowX = 50;
      let glowY = 50;

      const render = () => {
        frame = 0;
        card.style.setProperty('--card-tilt-x', `${tiltX}deg`);
        card.style.setProperty('--card-tilt-y', `${tiltY}deg`);
        card.style.setProperty('--card-glow-x', `${glowX}%`);
        card.style.setProperty('--card-glow-y', `${glowY}%`);
      };

      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(render);
      };

      const onPointerMove = (event: PointerEvent) => {
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const localX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const localY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
        tiltX = clamp(-(localY - 0.5) * 14, -7, 7);
        tiltY = clamp((localX - 0.5) * 18, -9, 9);
        glowX = localX * 100;
        glowY = localY * 100;
        schedule();
      };

      const reset = () => {
        tiltX = 0;
        tiltY = 0;
        glowX = 50;
        glowY = 50;
        schedule();
      };

      card.addEventListener('pointermove', onPointerMove, { passive: true });
      card.addEventListener('pointerleave', reset, { passive: true });
      card.addEventListener('blur', reset, true);

      disposers.push(() => {
        cancelAnimationFrame(frame);
        card.removeEventListener('pointermove', onPointerMove);
        card.removeEventListener('pointerleave', reset);
        card.removeEventListener('blur', reset, true);
        resetCardVariables(card);
      });
    };

    const bind = () => {
      dispose();
      const hero = document.querySelector<HTMLElement>('[data-anime-hero]');
      if (hero) bindHero(hero);
      document.querySelectorAll<HTMLElement>('[data-cinematic-card]').forEach(bindCard);
    };

    const onEnvironmentChange = () => bind();

    bind();
    document.addEventListener('astro:page-load', bind);
    motionQuery.addEventListener('change', onEnvironmentChange);
    pointerQuery.addEventListener('change', onEnvironmentChange);

    return () => {
      dispose();
      document.removeEventListener('astro:page-load', bind);
      motionQuery.removeEventListener('change', onEnvironmentChange);
      pointerQuery.removeEventListener('change', onEnvironmentChange);
    };
  }, []);

  return null;
}
