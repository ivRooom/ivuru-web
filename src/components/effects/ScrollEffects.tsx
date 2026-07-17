import { useEffect } from 'react';
import '@/styles/scroll-performance.css';

const revealSelectors = [
  '[data-anime-reveal]',
  '[data-reveal]',
  '[data-blue-reveal]',
  '[data-anime-visual]',
  '[data-blue-visual]',
  '[data-anime-line]',
  '[data-blue-path]',
];

const isStoryElement = (element: Element) => Boolean(element.closest('[data-anime-scroll-story]'));

const revealKind = (element: HTMLElement) => {
  if (element.matches('[data-anime-visual], [data-blue-visual]')) return 'visual';
  if (element.matches('[data-anime-line], [data-blue-path]')) return 'line';
  return 'copy';
};

const parseParallaxDistance = (element: HTMLElement) => {
  const raw = Number(element.dataset.animeParallax ?? 4);
  return Number.isFinite(raw) ? Math.min(Math.max(Math.abs(raw), 1), 10) : 4;
};

export default function ScrollEffects() {
  useEffect(() => {
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    let revealObserver: IntersectionObserver | undefined;
    let sceneObserver: IntersectionObserver | undefined;
    let setupFrame = 0;
    const settleTimers = new Set<number>();
    const observedElements = new Set<HTMLElement>();
    const parallaxElements = new Set<HTMLElement>();
    const sceneRatios = new Map<HTMLElement, number>();

    const settle = (element: HTMLElement) => {
      element.dataset.scrollReveal = 'settled';
      element.style.removeProperty('--scroll-reveal-delay');
    };

    const showImmediately = () => {
      document.documentElement.dataset.motionReady = 'reduced';
      document.querySelectorAll<HTMLElement>(revealSelectors.join(',')).forEach((element) => {
        element.dataset.scrollReveal = 'settled';
        element.style.removeProperty('--scroll-reveal-delay');
      });
      document.querySelectorAll<HTMLElement>('[data-anime-stagger] > *').forEach((element) => {
        element.dataset.scrollReveal = 'settled';
        element.style.removeProperty('--scroll-reveal-delay');
      });
      document.querySelectorAll<HTMLElement>('[data-anime-parallax]').forEach((element) => {
        delete element.dataset.scrollParallax;
        element.style.removeProperty('--scroll-parallax-distance');
      });
    };

    const cleanup = () => {
      cancelAnimationFrame(setupFrame);
      revealObserver?.disconnect();
      sceneObserver?.disconnect();
      revealObserver = undefined;
      sceneObserver = undefined;
      settleTimers.forEach((timer) => window.clearTimeout(timer));
      settleTimers.clear();
      sceneRatios.clear();
      observedElements.forEach((element) => {
        delete element.dataset.scrollReveal;
        delete element.dataset.scrollRevealKind;
        element.style.removeProperty('--scroll-reveal-delay');
      });
      parallaxElements.forEach((element) => {
        delete element.dataset.scrollParallax;
        element.style.removeProperty('--scroll-parallax-distance');
      });
      observedElements.clear();
      parallaxElements.clear();
    };

    const markVisible = (element: HTMLElement) => {
      if (
        element.dataset.scrollReveal === 'visible' ||
        element.dataset.scrollReveal === 'settled'
      ) {
        return;
      }
      element.dataset.scrollReveal = 'visible';
      revealObserver?.unobserve(element);
      const timer = window.setTimeout(() => {
        settleTimers.delete(timer);
        settle(element);
      }, 1050);
      settleTimers.add(timer);
    };

    const prepareElement = (element: HTMLElement, kind = revealKind(element), delayIndex = 0) => {
      if (isStoryElement(element)) return;
      observedElements.add(element);
      element.dataset.scrollReveal = 'pending';
      element.dataset.scrollRevealKind = kind;
      element.style.setProperty('--scroll-reveal-delay', `${Math.min(delayIndex, 6) * 55}ms`);
      revealObserver?.observe(element);
    };

    const setup = () => {
      cleanup();

      if (motionQuery.matches || !('IntersectionObserver' in window)) {
        showImmediately();
        return;
      }

      document.documentElement.dataset.motionReady = 'observer';

      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            markVisible(entry.target as HTMLElement);
          });
        },
        {
          root: null,
          rootMargin: '0px 0px -8% 0px',
          threshold: 0.08,
        },
      );

      setupFrame = requestAnimationFrame(() => {
        document.querySelectorAll<HTMLElement>(revealSelectors.join(',')).forEach((element) => {
          prepareElement(element);
        });

        document.querySelectorAll<HTMLElement>('[data-anime-stagger]').forEach((group) => {
          if (isStoryElement(group)) return;
          Array.from(group.children).forEach((child, index) => {
            if (child instanceof HTMLElement) prepareElement(child, 'stagger', index);
          });
        });

        document.querySelectorAll<HTMLElement>('[data-anime-parallax]').forEach((element) => {
          if (isStoryElement(element)) return;
          parallaxElements.add(element);
          element.style.setProperty(
            '--scroll-parallax-distance',
            `${parseParallaxDistance(element)}%`,
          );
          element.dataset.scrollParallax = CSS.supports('animation-timeline: view()')
            ? 'native'
            : 'disabled';
        });
      });

      const sceneSections = Array.from(
        document.querySelectorAll<HTMLElement>('[data-anime-scene]'),
      ).filter((section) => !isStoryElement(section));

      if (sceneSections.length > 0) {
        sceneObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              sceneRatios.set(
                entry.target as HTMLElement,
                entry.isIntersecting ? entry.intersectionRatio : 0,
              );
            });

            const active = Array.from(sceneRatios.entries()).toSorted((a, b) => b[1] - a[1])[0];
            const scene = active?.[0].dataset.animeScene;
            if (scene && active[1] > 0.18) document.body.dataset.animeScene = scene;
          },
          {
            root: null,
            rootMargin: '-32% 0px -32% 0px',
            threshold: [0, 0.18, 0.35, 0.55, 0.75],
          },
        );
        sceneSections.forEach((section) => {
          sceneRatios.set(section, 0);
          sceneObserver?.observe(section);
        });
      }
    };

    const onPageLoad = () => setup();
    const onMotionChange = () => setup();

    setup();
    document.addEventListener('astro:page-load', onPageLoad);
    motionQuery.addEventListener('change', onMotionChange);

    return () => {
      cleanup();
      document.removeEventListener('astro:page-load', onPageLoad);
      motionQuery.removeEventListener('change', onMotionChange);
      delete document.documentElement.dataset.motionReady;
    };
  }, []);

  return null;
}
