import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const uniqueElements = (selectors: string[]) =>
  Array.from(
    new Set(
      selectors.flatMap((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector))),
    ),
  );

export default function ScrollEffects() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    let context: ReturnType<typeof gsap.context> | undefined;
    let refreshFrame = 0;

    const showImmediately = () => {
      document.documentElement.dataset.motionReady = 'reduced';
      uniqueElements([
        '[data-anime-reveal]',
        '[data-reveal]',
        '[data-anime-visual]',
        '[data-anime-card]',
      ]).forEach((element) => {
        gsap.set(element, {
          clearProps: 'opacity,transform,clipPath,filter,visibility',
        });
      });
    };

    const setup = () => {
      context?.revert();
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
        const heroActions = hero
          ? Array.from(hero.querySelectorAll<HTMLElement>('[data-anime-stagger] > *'))
          : [];

        if (hero) {
          const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });

          if (heroCopy) {
            intro.fromTo(
              heroCopy,
              { opacity: 0, y: 34, clipPath: 'inset(0 0 18% 0)' },
              {
                opacity: 1,
                y: 0,
                clipPath: 'inset(0 0 0% 0)',
                duration: 0.9,
              },
            );
          }

          if (heroVisual) {
            intro.fromTo(
              heroVisual,
              {
                opacity: 0,
                x: 42,
                rotate: 1.8,
                clipPath: 'inset(8% 0 18% 0 round 44px)',
              },
              {
                opacity: 1,
                x: 0,
                rotate: 0,
                clipPath: 'inset(0% 0 0% 0 round 44px)',
                duration: 1.05,
              },
              '-=0.68',
            );
          }

          if (heroActions.length > 0) {
            intro.fromTo(
              heroActions,
              { opacity: 0, y: 14, scale: 0.97 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.42,
                stagger: 0.055,
              },
              '-=0.55',
            );
          }

          if (heroCopy) {
            gsap.to(heroCopy, {
              yPercent: 10,
              opacity: 0.4,
              ease: 'none',
              scrollTrigger: {
                trigger: hero,
                start: '32% top',
                end: 'bottom top',
                scrub: 0.65,
              },
            });
          }

          if (heroVisual) {
            gsap.to(heroVisual, {
              yPercent: -7,
              rotate: -1.2,
              ease: 'none',
              scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.7,
              },
            });
          }
        }

        const revealNodes = uniqueElements(['[data-anime-reveal]', '[data-reveal]']).filter(
          (element) => !hero?.contains(element),
        );

        revealNodes.forEach((element, index) => {
          gsap.fromTo(
            element,
            {
              opacity: 0,
              y: 34,
              clipPath: 'inset(0 0 16% 0)',
            },
            {
              opacity: 1,
              y: 0,
              clipPath: 'inset(0 0 0% 0)',
              duration: 0.82,
              delay: (index % 3) * 0.04,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: element,
                start: 'top 88%',
                once: true,
              },
            },
          );
        });

        document.querySelectorAll<HTMLElement>('[data-anime-visual]').forEach((element) => {
          if (hero?.contains(element)) return;

          gsap.fromTo(
            element,
            {
              opacity: 0,
              scale: 0.965,
              rotate: 1.2,
              clipPath: 'inset(9% 0 15% 0 round 36px)',
            },
            {
              opacity: 1,
              scale: 1,
              rotate: 0,
              clipPath: 'inset(0% 0 0% 0 round 36px)',
              duration: 0.95,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: element,
                start: 'top 86%',
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
              y: 28,
              rotate: (index) => (index % 2 === 0 ? -0.7 : 0.7),
            },
            {
              opacity: 1,
              y: 0,
              rotate: 0,
              duration: 0.72,
              stagger: 0.1,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: group,
                start: 'top 86%',
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
                scrub: 0.8,
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
              duration: 0.85,
              ease: 'power3.inOut',
              scrollTrigger: {
                trigger: element,
                start: 'top 90%',
                once: true,
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
      });

      refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    const onPageLoad = () => setup();
    const onMotionChange = () => setup();

    setup();
    document.addEventListener('astro:page-load', onPageLoad);
    motionQuery.addEventListener('change', onMotionChange);

    return () => {
      cancelAnimationFrame(refreshFrame);
      document.removeEventListener('astro:page-load', onPageLoad);
      motionQuery.removeEventListener('change', onMotionChange);
      context?.revert();
      delete document.documentElement.dataset.motionReady;
    };
  }, []);

  return null;
}
