import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const depthMap: Record<string, number> = {
  background: 5,
  grid: 9,
  ribbons: 15,
  orbit: 12,
  grain: 3,
  frame: 7,
  'label-left': 11,
  'label-right': 11,
  copy: 4,
  coordinates: 8,
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
        const introTimeline = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
        introTimeline
          .fromTo('.hero-cinematic-title-card', { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.55 })
          .to('.hero-cinematic-title-card', { opacity: 0, y: -12, duration: 0.35 }, '+=0.5')
          .to('.hero-cinematic-shutter-top', { yPercent: -102, duration: 0.8 }, '-=0.08')
          .to('.hero-cinematic-shutter-bottom', { yPercent: 102, duration: 0.8 }, '<')
          .set(intro, { display: 'none' });
      }

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element, index) => {
        gsap.fromTo(
          element,
          { y: 48, opacity: 0, filter: 'blur(12px)' },
          {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 1,
            delay: (index % 3) * 0.06,
            ease: 'power3.out',
            scrollTrigger: { trigger: element, start: 'top 86%', once: true },
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
            scrollTrigger: { trigger: element, start: 'top 75%', end: 'bottom 45%', scrub: true },
          },
        );
      });

      gsap.to('[data-hero-art]', {
        scale: 1.08,
        yPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('[data-hero-copy]', {
        yPercent: 32,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: '[data-hero]', start: '22% top', end: '78% top', scrub: true },
      });
      gsap.to('[data-hero-depth="grid"]', {
        yPercent: 18,
        scale: 1.08,
        ease: 'none',
        scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('[data-hero-depth="orbit"]', {
        rotation: 18,
        scale: 1.14,
        opacity: 0.2,
        ease: 'none',
        scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true },
      });
    });

    const onPointerMove = (event: PointerEvent) => {
      if (!hero || event.pointerType === 'touch') return;
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      for (const element of depthElements) {
        const key = element.dataset.heroDepth ?? '';
        const depth = depthMap[key] ?? 5;
        gsap.to(element, {
          x: x * depth,
          y: y * depth,
          duration: 0.8,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      }
    };

    const resetDepth = () => {
      for (const element of depthElements) {
        gsap.to(element, { x: 0, y: 0, duration: 0.9, ease: 'power3.out', overwrite: 'auto' });
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
