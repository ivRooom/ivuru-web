import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const depthMap: Record<string, number> = {
  background: 3,
  grid: 4,
  ribbons: 5,
  orbit: 4,
  grain: 2,
  frame: 3,
  'label-left': 4,
  'label-right': 4,
  copy: 2,
  coordinates: 3,
  bloom: 3,
  sparkles: 5,
  petals: 4,
};

export default function ScrollEffects() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const hero = document.querySelector<HTMLElement>('[data-hero]');
    const depthElements = gsap.utils.toArray<HTMLElement>('[data-hero-depth]');
    const intro = document.querySelector<HTMLElement>('[data-cinematic-intro]');

    const context = gsap.context(() => {
      if (intro) {
        const introTimeline = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
        introTimeline
          .fromTo(
            '.hero-cinematic-title-card',
            { opacity: 0 },
            { opacity: 1, duration: 0.35 },
          )
          .to('.hero-cinematic-title-card', { opacity: 0, duration: 0.25 }, '+=0.3')
          .to('.hero-cinematic-shutter-top', { yPercent: -102, duration: 0.5 }, '-=0.05')
          .to('.hero-cinematic-shutter-bottom', { yPercent: 102, duration: 0.5 }, '<')
          .set(intro, { display: 'none' });
      }

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element, index) => {
        gsap.fromTo(
          element,
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.58,
            delay: (index % 3) * 0.035,
            ease: 'power2.out',
            scrollTrigger: { trigger: element, start: 'top 90%', once: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>('[data-enter-side]').forEach((element) => {
        const direction = element.dataset.enterSide === 'right' ? 1 : -1;
        gsap.fromTo(
          element,
          { x: direction * 28, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.65,
            ease: 'power2.out',
            scrollTrigger: { trigger: element, start: 'top 90%', once: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>('[data-line]').forEach((element) => {
        gsap.fromTo(
          element,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: element,
              start: 'top 80%',
              end: 'bottom 50%',
              scrub: true,
            },
          },
        );
      });

      gsap.to('[data-hero-art]', {
        scale: 1.025,
        yPercent: 2,
        ease: 'none',
        scrollTrigger: {
          trigger: '[data-hero]',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
      gsap.to('[data-hero-copy]', {
        yPercent: 9,
        opacity: 0.45,
        ease: 'none',
        scrollTrigger: {
          trigger: '[data-hero]',
          start: '35% top',
          end: '95% top',
          scrub: true,
        },
      });
      gsap.to('[data-hero-depth="grid"]', {
        yPercent: 5,
        scale: 1.02,
        ease: 'none',
        scrollTrigger: {
          trigger: '[data-hero]',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
      gsap.to('[data-hero-depth="orbit"]', {
        rotation: 4,
        scale: 1.03,
        opacity: 0.32,
        ease: 'none',
        scrollTrigger: {
          trigger: '[data-hero]',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    });

    const onPointerMove = (event: PointerEvent) => {
      if (!hero || event.pointerType === 'touch') return;
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      for (const element of depthElements) {
        const key = element.dataset.heroDepth ?? '';
        const depth = depthMap[key] ?? 3;
        gsap.to(element, {
          x: x * depth,
          y: y * depth,
          duration: 0.65,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
    };

    const resetDepth = () => {
      for (const element of depthElements) {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.65,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
    };

    hero?.addEventListener('pointermove', onPointerMove, { passive: true });
    hero?.addEventListener('pointerleave', resetDepth);

    return () => {
      hero?.removeEventListener('pointermove', onPointerMove);
      hero?.removeEventListener('pointerleave', resetDepth);
      context.revert();
    };
  }, []);
  return null;
}
