import { useEffect } from 'react';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type BoundTarget = {
  dispose: () => void;
};

export default function CinematicPointerEffects() {
  useEffect(() => {
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    const pointerQuery = matchMedia('(hover: hover) and (pointer: fine)');
    let observer: IntersectionObserver | undefined;
    const boundTargets = new Map<HTMLElement, BoundTarget>();

    const unbind = (target: HTMLElement) => {
      boundTargets.get(target)?.dispose();
      boundTargets.delete(target);
    };

    const bindCard = (card: HTMLElement): BoundTarget => {
      const surface =
        card.querySelector<HTMLElement>('.cinematic-card-surface') ??
        card.querySelector<HTMLElement>('[data-pointer-plane]') ??
        card;
      let frame = 0;
      let rect: DOMRect | undefined;
      let tiltX = 0;
      let tiltY = 0;
      const resizeObserver = new ResizeObserver(() => {
        rect = undefined;
      });

      const render = () => {
        frame = 0;
        surface.style.transform = `perspective(900px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translate3d(0, 0, 10px)`;
      };

      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(render);
      };

      const refreshRect = () => {
        rect = card.getBoundingClientRect();
      };

      const onPointerEnter = () => {
        refreshRect();
        card.dataset.pointerActive = 'true';
      };

      const onPointerMove = (event: PointerEvent) => {
        rect ??= card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const localX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const localY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
        tiltX = clamp(-(localY - 0.5) * 8, -4, 4);
        tiltY = clamp((localX - 0.5) * 10, -5, 5);
        schedule();
      };

      const reset = () => {
        tiltX = 0;
        tiltY = 0;
        rect = undefined;
        delete card.dataset.pointerActive;
        schedule();
      };

      resizeObserver.observe(card);
      card.addEventListener('pointerenter', onPointerEnter, { passive: true });
      card.addEventListener('pointermove', onPointerMove, { passive: true });
      card.addEventListener('pointerleave', reset, { passive: true });
      card.addEventListener('blur', reset, true);

      return {
        dispose: () => {
          cancelAnimationFrame(frame);
          resizeObserver.disconnect();
          card.removeEventListener('pointerenter', onPointerEnter);
          card.removeEventListener('pointermove', onPointerMove);
          card.removeEventListener('pointerleave', reset);
          card.removeEventListener('blur', reset, true);
          delete card.dataset.pointerActive;
          surface.style.removeProperty('transform');
        },
      };
    };

    const bindHeroPlane = (hero: HTMLElement): BoundTarget | undefined => {
      const plane = hero.querySelector<HTMLElement>('[data-pointer-plane]');
      if (!plane) return undefined;

      let frame = 0;
      let rect: DOMRect | undefined;
      let x = 0;
      let y = 0;
      const resizeObserver = new ResizeObserver(() => {
        rect = undefined;
      });

      const render = () => {
        frame = 0;
        plane.style.transform = `translate3d(${(x * 10).toFixed(2)}px, ${(y * 7).toFixed(2)}px, 0)`;
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(render);
      };
      const onPointerEnter = () => {
        rect = hero.getBoundingClientRect();
        hero.dataset.pointerActive = 'true';
      };
      const onPointerMove = (event: PointerEvent) => {
        rect ??= hero.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        x = clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1);
        y = clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2, -1, 1);
        schedule();
      };
      const reset = () => {
        x = 0;
        y = 0;
        rect = undefined;
        delete hero.dataset.pointerActive;
        schedule();
      };

      resizeObserver.observe(hero);
      hero.addEventListener('pointerenter', onPointerEnter, { passive: true });
      hero.addEventListener('pointermove', onPointerMove, { passive: true });
      hero.addEventListener('pointerleave', reset, { passive: true });

      return {
        dispose: () => {
          cancelAnimationFrame(frame);
          resizeObserver.disconnect();
          hero.removeEventListener('pointerenter', onPointerEnter);
          hero.removeEventListener('pointermove', onPointerMove);
          hero.removeEventListener('pointerleave', reset);
          delete hero.dataset.pointerActive;
          plane.style.removeProperty('transform');
        },
      };
    };

    const dispose = () => {
      observer?.disconnect();
      observer = undefined;
      Array.from(boundTargets.keys()).forEach(unbind);
    };

    const setup = () => {
      dispose();
      if (motionQuery.matches || !pointerQuery.matches || !('IntersectionObserver' in window)) {
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const target = entry.target as HTMLElement;
            if (!entry.isIntersecting) {
              unbind(target);
              return;
            }
            if (boundTargets.has(target)) return;
            const binding = target.matches('[data-cinematic-card]')
              ? bindCard(target)
              : bindHeroPlane(target);
            if (binding) boundTargets.set(target, binding);
          });
        },
        {
          root: null,
          rootMargin: '120px 0px',
          threshold: 0.05,
        },
      );

      const hero = document.querySelector<HTMLElement>('[data-anime-hero]');
      if (hero?.querySelector('[data-pointer-plane]')) observer.observe(hero);
      document
        .querySelectorAll<HTMLElement>('[data-cinematic-card]')
        .forEach((card) => observer?.observe(card));
    };

    const onEnvironmentChange = () => setup();

    setup();
    document.addEventListener('astro:page-load', setup);
    motionQuery.addEventListener('change', onEnvironmentChange);
    pointerQuery.addEventListener('change', onEnvironmentChange);

    return () => {
      dispose();
      document.removeEventListener('astro:page-load', setup);
      motionQuery.removeEventListener('change', onEnvironmentChange);
      pointerQuery.removeEventListener('change', onEnvironmentChange);
    };
  }, []);

  return null;
}
