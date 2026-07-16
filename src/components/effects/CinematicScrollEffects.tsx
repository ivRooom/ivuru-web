import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function CinematicScrollEffects() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    let context: ReturnType<typeof gsap.context> | undefined;
    let refreshFrame = 0;

    const showImmediately = () => {
      document.querySelectorAll<HTMLElement>('[data-cinematic-field]').forEach((element) => {
        gsap.set(element, { clearProps: 'opacity,transform,filter,visibility' });
      });
      document
        .querySelectorAll<HTMLElement>('[data-cinematic-ring], [data-cinematic-shard]')
        .forEach((element) => {
          gsap.set(element, { clearProps: 'opacity,transform,filter,visibility' });
        });
      document.querySelectorAll<HTMLElement>('[data-cinematic-section]').forEach((section) => {
        section.style.setProperty('--cinematic-sweep', '120%');
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

      context = gsap.context(() => {
        const hero = document.querySelector<HTMLElement>('[data-anime-hero]');
        const field = hero?.querySelector<HTMLElement>('[data-cinematic-field]');
        const rings = hero
          ? Array.from(hero.querySelectorAll<HTMLElement>('[data-cinematic-ring]'))
          : [];
        const shards = hero
          ? Array.from(hero.querySelectorAll<HTMLElement>('[data-cinematic-shard]'))
          : [];
        const aura = hero?.querySelector<HTMLElement>('.cinematic-character-aura');

        if (hero && field) {
          const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });

          intro.fromTo(
            field,
            { opacity: 0, scale: 0.9, rotate: -2, filter: 'blur(12px)' },
            {
              opacity: 1,
              scale: 1,
              rotate: 0,
              filter: 'blur(0px)',
              duration: 1.45,
            },
          );

          if (rings.length > 0) {
            intro.fromTo(
              rings,
              { opacity: 0, scale: 0.56, rotate: -36 },
              {
                opacity: 1,
                scale: 1,
                rotate: 0,
                duration: 1.3,
                stagger: 0.12,
                ease: 'expo.out',
              },
              '-=1.2',
            );
          }

          if (shards.length > 0) {
            intro.fromTo(
              shards,
              { opacity: 0, y: 58, scale: 0.58, rotate: -24 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                rotate: 0,
                duration: 0.94,
                stagger: 0.055,
                ease: 'back.out(1.75)',
              },
              '-=1.02',
            );
          }

          if (aura) {
            intro.fromTo(
              aura,
              { opacity: 0, scale: 0.48 },
              { opacity: 0.62, scale: 1, duration: 1.1, ease: 'expo.out' },
              '-=1.05',
            );
          }

          gsap.to(field, {
            yPercent: -12,
            scale: 1.12,
            opacity: 0.38,
            ease: 'none',
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: 'bottom top',
              scrub: 1,
            },
          });
        }

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
    };
  }, []);

  return null;
}
