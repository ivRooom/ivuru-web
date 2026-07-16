import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const uniqueElements = (selectors: string[]) =>
  Array.from(document.querySelectorAll<HTMLElement>(selectors.join(',')));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function ScrollEffects() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointerQuery = matchMedia('(hover: hover) and (pointer: fine)');
    let context: ReturnType<typeof gsap.context> | undefined;
    let refreshFrame = 0;
    let disposers: Array<() => void> = [];

    const disposeInteractions = () => {
      disposers.forEach((dispose) => dispose());
      disposers = [];
    };

    const showImmediately = () => {
      document.documentElement.dataset.motionReady = 'reduced';
      uniqueElements([
        '[data-anime-reveal]',
        '[data-reveal]',
        '[data-anime-visual]',
        '[data-anime-card]',
        '[data-blue-reveal]',
        '[data-blue-visual]',
        '[data-cinematic-field]',
        '[data-cinematic-ring]',
        '[data-cinematic-shard]',
        '[data-cinematic-character]',
      ]).forEach((element) => {
        gsap.set(element, {
          clearProps: 'opacity,transform,clipPath,filter,visibility',
        });
      });
      document.querySelectorAll<SVGGeometryElement>('[data-blue-path]').forEach((path) => {
        gsap.set(path, { clearProps: 'strokeDasharray,strokeDashoffset' });
      });
      document.querySelectorAll<HTMLElement>('[data-cinematic-section]').forEach((section) => {
        section.style.setProperty('--cinematic-sweep', '120%');
      });
    };

    const setupPointerDepth = (hero: HTMLElement) => {
      if (!finePointerQuery.matches) return;

      let pointerFrame = 0;
      let nextX = 0;
      let nextY = 0;

      const render = () => {
        pointerFrame = 0;
        hero.style.setProperty('--hero-pointer-x', String(nextX));
        hero.style.setProperty('--hero-pointer-y', String(nextY));
        hero.style.setProperty('--hero-tilt-x', `${clamp(-nextY * 2.8, -3.2, 3.2)}deg`);
        hero.style.setProperty('--hero-tilt-y', `${clamp(nextX * 4.2, -4.8, 4.8)}deg`);
      };

      const schedule = (x: number, y: number) => {
        nextX = x;
        nextY = y;
        if (!pointerFrame) pointerFrame = requestAnimationFrame(render);
      };

      const onPointerMove = (event: PointerEvent) => {
        const rect = hero.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        schedule(clamp(x, -1, 1), clamp(y, -1, 1));
      };

      const reset = () => schedule(0, 0);
      hero.addEventListener('pointermove', onPointerMove, { passive: true });
      hero.addEventListener('pointerleave', reset, { passive: true });

      disposers.push(() => {
        cancelAnimationFrame(pointerFrame);
        hero.removeEventListener('pointermove', onPointerMove);
        hero.removeEventListener('pointerleave', reset);
        reset();
      });
    };

    const setupCardDepth = () => {
      if (!finePointerQuery.matches) return;

      document.querySelectorAll<HTMLElement>('[data-cinematic-card]').forEach((card) => {
        let cardFrame = 0;
        let nextX = 0;
        let nextY = 0;
        let glowX = 50;
        let glowY = 50;

        const render = () => {
          cardFrame = 0;
          card.style.setProperty('--card-tilt-x', `${clamp(-nextY * 7, -7, 7)}deg`);
          card.style.setProperty('--card-tilt-y', `${clamp(nextX * 9, -9, 9)}deg`);
          card.style.setProperty('--card-glow-x', `${glowX}%`);
          card.style.setProperty('--card-glow-y', `${glowY}%`);
        };

        const onPointerMove = (event: PointerEvent) => {
          const rect = card.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const localX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
          const localY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
          nextX = (localX - 0.5) * 2;
          nextY = (localY - 0.5) * 2;
          glowX = localX * 100;
          glowY = localY * 100;
          if (!cardFrame) cardFrame = requestAnimationFrame(render);
        };

        const reset = () => {
          nextX = 0;
          nextY = 0;
          glowX = 50;
          glowY = 50;
          if (!cardFrame) cardFrame = requestAnimationFrame(render);
        };

        card.addEventListener('pointermove', onPointerMove, { passive: true });
        card.addEventListener('pointerleave', reset, { passive: true });
        card.addEventListener('blur', reset, true);

        disposers.push(() => {
          cancelAnimationFrame(cardFrame);
          card.removeEventListener('pointermove', onPointerMove);
          card.removeEventListener('pointerleave', reset);
          card.removeEventListener('blur', reset, true);
          card.style.removeProperty('--card-tilt-x');
          card.style.removeProperty('--card-tilt-y');
          card.style.removeProperty('--card-glow-x');
          card.style.removeProperty('--card-glow-y');
        });
      });
    };

    const setup = () => {
      context?.revert();
      disposeInteractions();
      cancelAnimationFrame(refreshFrame);

      if (motionQuery.matches) {
        showImmediately();
        ScrollTrigger.refresh();
        return;
      }

      document.documentElement.dataset.motionReady = 'true';

      context = gsap.context(() => {
        const hero = document.querySelector<HTMLElement>('[data-anime-hero]');
        const heroCopy = hero?.querySelector<HTMLElement>('[data-hero-copy]');
        const heroVisual = hero?.querySelector<HTMLElement>('[data-anime-visual]');
        const heroTitleLines = hero
          ? Array.from(hero.querySelectorAll<HTMLElement>('[data-blue-split] > span'))
          : [];
        const heroActions = hero
          ? Array.from(hero.querySelectorAll<HTMLElement>('[data-anime-stagger] > *'))
          : [];
        const heroOrbit = hero?.querySelector<HTMLElement>('[data-blue-orbit]');
        const cinematicField = hero?.querySelector<HTMLElement>('[data-cinematic-field]');
        const cinematicRings = hero
          ? Array.from(hero.querySelectorAll<HTMLElement>('[data-cinematic-ring]'))
          : [];
        const cinematicShards = hero
          ? Array.from(hero.querySelectorAll<HTMLElement>('[data-cinematic-shard]'))
          : [];
        const characterAura = hero?.querySelector<HTMLElement>('.cinematic-character-aura');

        if (hero) {
          const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });

          if (cinematicField) {
            intro.fromTo(
              cinematicField,
              { opacity: 0, scale: 0.92, rotate: -2 },
              { opacity: 1, scale: 1, rotate: 0, duration: 1.35, ease: 'power4.out' },
            );
          }

          if (cinematicRings.length > 0) {
            intro.fromTo(
              cinematicRings,
              { opacity: 0, scale: 0.62, rotate: -32 },
              {
                opacity: 1,
                scale: 1,
                rotate: 0,
                duration: 1.28,
                stagger: 0.12,
                ease: 'expo.out',
              },
              '-=1.12',
            );
          }

          if (cinematicShards.length > 0) {
            intro.fromTo(
              cinematicShards,
              { opacity: 0, y: 54, scale: 0.62, rotate: -28 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                rotate: 0,
                duration: 0.92,
                stagger: 0.055,
                ease: 'back.out(1.8)',
              },
              '-=1.02',
            );
          }

          if (heroCopy) {
            intro.fromTo(
              heroCopy,
              { opacity: 0, x: -46, y: 46, clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' },
              {
                opacity: 1,
                x: 0,
                y: 0,
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                duration: 1.05,
              },
              '-=1.08',
            );
          }

          if (heroTitleLines.length > 0) {
            intro.fromTo(
              heroTitleLines,
              { yPercent: 132, rotate: 3.2, skewY: 4 },
              {
                yPercent: 0,
                rotate: 0,
                skewY: 0,
                duration: 0.96,
                stagger: 0.11,
                ease: 'power4.out',
              },
              '-=0.82',
            );
          }

          if (heroVisual) {
            intro.fromTo(
              heroVisual,
              {
                opacity: 0,
                x: 110,
                y: 36,
                scale: 0.86,
                rotate: 3.4,
                filter: 'blur(14px)',
                clipPath: 'polygon(28% 0, 100% 0, 78% 100%, 0 100%)',
              },
              {
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                rotate: 0,
                filter: 'blur(0px)',
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                duration: 1.28,
                ease: 'expo.out',
              },
              '-=0.82',
            );
          }

          if (characterAura) {
            intro.fromTo(
              characterAura,
              { opacity: 0, scale: 0.48 },
              { opacity: 0.62, scale: 1, duration: 1.1, ease: 'expo.out' },
              '-=1.05',
            );
          }

          if (heroActions.length > 0) {
            intro.fromTo(
              heroActions,
              { opacity: 0, y: 24, scale: 0.9, rotate: -1.2 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                rotate: 0,
                duration: 0.58,
                stagger: 0.07,
                ease: 'back.out(1.45)',
              },
              '-=0.64',
            );
          }

          if (heroCopy) {
            gsap.to(heroCopy, {
              xPercent: -5,
              yPercent: 18,
              opacity: 0.28,
              filter: 'blur(4px)',
              ease: 'none',
              scrollTrigger: {
                trigger: hero,
                start: '28% top',
                end: 'bottom top',
                scrub: 0.75,
              },
            });
          }

          if (heroVisual) {
            gsap.to(heroVisual, {
              yPercent: -14,
              xPercent: 5,
              rotate: -2,
              scale: 1.065,
              ease: 'none',
              scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.85,
              },
            });
          }

          if (cinematicField) {
            gsap.to(cinematicField, {
              yPercent: -11,
              scale: 1.12,
              opacity: 0.36,
              ease: 'none',
              scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: 'bottom top',
                scrub: 1,
              },
            });
          }

          if (heroOrbit) {
            gsap.to(heroOrbit, {
              rotate: 190,
              scale: 1.16,
              opacity: 0.28,
              ease: 'none',
              scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: 'bottom top',
                scrub: 1.1,
              },
            });
          }

          setupPointerDepth(hero);
        }

        const revealNodes = uniqueElements([
          '[data-anime-reveal]',
          '[data-reveal]',
          '[data-blue-reveal]',
        ]).filter((element) => !hero?.contains(element));

        revealNodes.forEach((element, index) => {
          gsap.fromTo(
            element,
            {
              opacity: 0,
              y: 64,
              scale: 0.96,
              rotateX: 7,
              filter: 'blur(12px)',
              clipPath: 'polygon(0 0, 78% 0, 62% 100%, 0 100%)',
              transformOrigin: '50% 100%',
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              rotateX: 0,
              filter: 'blur(0px)',
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
              duration: 1.02,
              delay: (index % 3) * 0.045,
              ease: 'power4.out',
              scrollTrigger: {
                trigger: element,
                start: 'top 90%',
                once: true,
              },
            },
          );
        });

        uniqueElements(['[data-anime-visual]', '[data-blue-visual]']).forEach((element) => {
          if (hero?.contains(element)) return;

          gsap.fromTo(
            element,
            {
              opacity: 0,
              scale: 0.88,
              x: 76,
              y: 24,
              rotate: 2.6,
              filter: 'blur(10px)',
              clipPath: 'polygon(22% 0, 100% 0, 82% 100%, 0 100%)',
            },
            {
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
              rotate: 0,
              filter: 'blur(0px)',
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
              duration: 1.12,
              ease: 'expo.out',
              scrollTrigger: {
                trigger: element,
                start: 'top 88%',
                once: true,
              },
            },
          );
        });

        document.querySelectorAll<HTMLElement>('[data-anime-stagger]').forEach((group) => {
          if (hero?.contains(group)) return;

          const children = Array.from(group.children).filter(
            (child): child is HTMLElement => child instanceof HTMLElement,
          );
          if (children.length === 0) return;

          gsap.fromTo(
            children,
            {
              opacity: 0,
              y: 48,
              scale: 0.92,
              rotate: (index) => (index % 2 === 0 ? -1.4 : 1.4),
              filter: 'blur(7px)',
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              rotate: 0,
              filter: 'blur(0px)',
              duration: 0.86,
              stagger: 0.12,
              ease: 'back.out(1.32)',
              scrollTrigger: {
                trigger: group,
                start: 'top 88%',
                once: true,
              },
            },
          );
        });

        document.querySelectorAll<HTMLElement>('[data-anime-parallax]').forEach((element) => {
          const amount = Number(element.dataset.animeParallax ?? 4);

          gsap.fromTo(
            element,
            { yPercent: -amount },
            {
              yPercent: amount,
              ease: 'none',
              scrollTrigger: {
                trigger: element.closest('section') ?? element,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.85,
              },
            },
          );
        });

        document.querySelectorAll<HTMLElement>('[data-anime-line]').forEach((element) => {
          gsap.fromTo(
            element,
            { scaleX: 0, transformOrigin: 'left center' },
            {
              scaleX: 1,
              duration: 1,
              ease: 'expo.inOut',
              scrollTrigger: {
                trigger: element,
                start: 'top 92%',
                once: true,
              },
            },
          );
        });

        document.querySelectorAll<SVGGeometryElement>('[data-blue-path]').forEach((path) => {
          const length = path.getTotalLength();
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
          gsap.to(path, {
            strokeDashoffset: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: path.closest('section') ?? path,
              start: 'top 82%',
              end: 'bottom 24%',
              scrub: 0.85,
            },
          });
        });

        document.querySelectorAll<HTMLElement>('[data-cinematic-section]').forEach((section) => {
          gsap.fromTo(
            section,
            { '--cinematic-sweep': '-120%' },
            {
              '--cinematic-sweep': '120%',
              ease: 'none',
              scrollTrigger: {
                trigger: section,
                start: 'top 96%',
                end: 'top 30%',
                scrub: 0.9,
              },
            },
          );
        });

        document.querySelectorAll<HTMLElement>('[data-anime-scene]').forEach((section) => {
          const scene = section.dataset.animeScene;
          if (!scene) return;

          ScrollTrigger.create({
            trigger: section,
            start: 'top 58%',
            end: 'bottom 42%',
            onEnter: () => {
              document.body.dataset.animeScene = scene;
            },
            onEnterBack: () => {
              document.body.dataset.animeScene = scene;
            },
          });
        });

        setupCardDepth();
      });

      refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    const onPageLoad = () => setup();
    const onMotionChange = () => setup();
    const onPointerChange = () => setup();

    setup();
    document.addEventListener('astro:page-load', onPageLoad);
    motionQuery.addEventListener('change', onMotionChange);
    finePointerQuery.addEventListener('change', onPointerChange);

    return () => {
      cancelAnimationFrame(refreshFrame);
      document.removeEventListener('astro:page-load', onPageLoad);
      motionQuery.removeEventListener('change', onMotionChange);
      finePointerQuery.removeEventListener('change', onPointerChange);
      disposeInteractions();
      context?.revert();
      delete document.documentElement.dataset.motionReady;
    };
  }, []);

  return null;
}
