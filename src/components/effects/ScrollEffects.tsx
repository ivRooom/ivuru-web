import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const uniqueElements = (selectors: string[]) =>
  Array.from(document.querySelectorAll<HTMLElement>(selectors.join(',')));

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
        '[data-blue-reveal]',
        '[data-blue-visual]',
      ]).forEach((element) => {
        gsap.set(element, {
          clearProps: 'opacity,transform,clipPath,filter,visibility',
        });
      });
      document.querySelectorAll<SVGGeometryElement>('[data-blue-path]').forEach((path) => {
        gsap.set(path, { clearProps: 'strokeDasharray,strokeDashoffset' });
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
        const heroTitleLines = hero
          ? Array.from(hero.querySelectorAll<HTMLElement>('[data-blue-split] > span'))
          : [];
        const heroActions = hero
          ? Array.from(hero.querySelectorAll<HTMLElement>('[data-anime-stagger] > *'))
          : [];
        const heroOrbit = hero?.querySelector<HTMLElement>('[data-blue-orbit]');

        if (hero) {
          const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });

          if (heroCopy) {
            intro.fromTo(
              heroCopy,
              { opacity: 0, y: 38, clipPath: 'inset(0 0 20% 0)' },
              {
                opacity: 1,
                y: 0,
                clipPath: 'inset(0 0 0% 0)',
                duration: 0.9,
              },
            );
          }

          if (heroTitleLines.length > 0) {
            intro.fromTo(
              heroTitleLines,
              { yPercent: 118, rotate: 2 },
              {
                yPercent: 0,
                rotate: 0,
                duration: 0.78,
                stagger: 0.09,
                ease: 'power4.out',
              },
              '-=0.72',
            );
          }

          if (heroVisual) {
            intro.fromTo(
              heroVisual,
              {
                opacity: 0,
                x: 70,
                scale: 0.94,
                rotate: 1.8,
                clipPath: 'polygon(18% 0, 100% 0, 86% 100%, 0 100%)',
              },
              {
                opacity: 1,
                x: 0,
                scale: 1,
                rotate: 0,
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                duration: 1.12,
              },
              '-=0.64',
            );
          }

          if (heroActions.length > 0) {
            intro.fromTo(
              heroActions,
              { opacity: 0, y: 16, scale: 0.96 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.46,
                stagger: 0.06,
              },
              '-=0.58',
            );
          }

          if (heroCopy) {
            gsap.to(heroCopy, {
              yPercent: 11,
              opacity: 0.42,
              ease: 'none',
              scrollTrigger: {
                trigger: hero,
                start: '30% top',
                end: 'bottom top',
                scrub: 0.65,
              },
            });
          }

          if (heroVisual) {
            gsap.to(heroVisual, {
              yPercent: -9,
              xPercent: 3,
              rotate: -1.2,
              ease: 'none',
              scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.75,
              },
            });
          }

          if (heroOrbit) {
            gsap.to(heroOrbit, {
              rotate: 120,
              scale: 1.08,
              ease: 'none',
              scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: 'bottom top',
                scrub: 1,
              },
            });
          }
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
              y: 36,
              clipPath: 'inset(0 0 18% 0)',
            },
            {
              opacity: 1,
              y: 0,
              clipPath: 'inset(0 0 0% 0)',
              duration: 0.86,
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

        uniqueElements(['[data-anime-visual]', '[data-blue-visual]']).forEach((element) => {
          if (hero?.contains(element)) return;

          gsap.fromTo(
            element,
            {
              opacity: 0,
              scale: 0.95,
              x: 42,
              rotate: 1.1,
              clipPath: 'polygon(14% 0, 100% 0, 88% 100%, 0 100%)',
            },
            {
              opacity: 1,
              scale: 1,
              x: 0,
              rotate: 0,
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
              duration: 0.98,
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
              y: 30,
              rotate: (index) => (index % 2 === 0 ? -0.7 : 0.7),
            },
            {
              opacity: 1,
              y: 0,
              rotate: 0,
              duration: 0.74,
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

        document.querySelectorAll<SVGGeometryElement>('[data-blue-path]').forEach((path) => {
          const length = path.getTotalLength();
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
          gsap.to(path, {
            strokeDashoffset: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: path.closest('section') ?? path,
              start: 'top 78%',
              end: 'bottom 30%',
              scrub: 0.9,
            },
          });
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
