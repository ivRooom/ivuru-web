import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function ScrollEffects() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
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
    });
    return () => context.revert();
  }, []);
  return null;
}
