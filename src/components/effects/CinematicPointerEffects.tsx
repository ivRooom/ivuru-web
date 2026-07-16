import { useEffect } from 'react';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function CinematicPointerEffects() {
  useEffect(() => {
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    const pointerQuery = matchMedia('(hover: hover) and (pointer: fine)');
    let disposeHero: (() => void) | undefined;

    const resetVariables = (hero: HTMLElement) => {
      hero.style.setProperty('--hero-shift-x', '0px');
      hero.style.setProperty('--hero-shift-y', '0px');
      hero.style.setProperty('--hero-shift-x-soft', '0px');
      hero.style.setProperty('--hero-shift-y-soft', '0px');
      hero.style.setProperty('--hero-shift-x-deep', '0px');
      hero.style.setProperty('--hero-shift-y-deep', '0px');
    };

    const bindHero = () => {
      disposeHero?.();
      disposeHero = undefined;

      const hero = document.querySelector<HTMLElement>('[data-anime-hero]');
      if (!hero) return;

      resetVariables(hero);
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

      disposeHero = () => {
        cancelAnimationFrame(frame);
        hero.removeEventListener('pointermove', onPointerMove);
        hero.removeEventListener('pointerleave', onPointerLeave);
        resetVariables(hero);
        delete hero.dataset.cinematicPointer;
      };
    };

    const onEnvironmentChange = () => bindHero();

    bindHero();
    document.addEventListener('astro:page-load', bindHero);
    motionQuery.addEventListener('change', onEnvironmentChange);
    pointerQuery.addEventListener('change', onEnvironmentChange);

    return () => {
      disposeHero?.();
      document.removeEventListener('astro:page-load', bindHero);
      motionQuery.removeEventListener('change', onEnvironmentChange);
      pointerQuery.removeEventListener('change', onEnvironmentChange);
    };
  }, []);

  return null;
}
