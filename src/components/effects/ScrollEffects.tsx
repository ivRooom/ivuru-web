import { useEffect } from 'react';
import '@/styles/scroll-performance.css';

type RevealKind = 'copy' | 'visual' | 'line' | 'stagger';

type SpatialProfile = {
  name: string;
  x: number;
  y: number;
  z: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scale: number;
};

const revealSelectors = [
  '[data-anime-reveal]',
  '[data-reveal]',
  '[data-blue-reveal]',
  '[data-anime-visual]',
  '[data-blue-visual]',
  '[data-anime-line]',
  '[data-blue-path]',
];

const REVEAL_PROFILES: SpatialProfile[] = [
  { name: 'left-depth', x: -96, y: 28, z: -190, rotateX: 5, rotateY: 17, rotateZ: -2, scale: 0.92 },
  {
    name: 'right-front',
    x: 112,
    y: -18,
    z: 120,
    rotateX: -4,
    rotateY: -15,
    rotateZ: 3,
    scale: 1.07,
  },
  { name: 'top-left', x: -74, y: -86, z: -130, rotateX: 12, rotateY: 11, rotateZ: -4, scale: 0.94 },
  {
    name: 'bottom-right',
    x: 82,
    y: 96,
    z: -230,
    rotateX: -11,
    rotateY: -13,
    rotateZ: 4,
    scale: 0.9,
  },
  { name: 'center-depth', x: 0, y: 18, z: -320, rotateX: 0, rotateY: 9, rotateZ: 0, scale: 0.84 },
  { name: 'left-front', x: -88, y: -34, z: 105, rotateX: 6, rotateY: 18, rotateZ: -3, scale: 1.06 },
  {
    name: 'right-depth',
    x: 94,
    y: 48,
    z: -210,
    rotateX: -8,
    rotateY: -17,
    rotateZ: 3,
    scale: 0.91,
  },
];

const PARALLAX_PROFILES = [
  { name: 'diagonal-left', x: -38, y: 24, z: 72, rotateX: 2.4, rotateY: -3.4, rotateZ: 1.2 },
  { name: 'diagonal-right', x: 42, y: -20, z: -86, rotateX: -2.2, rotateY: 3.8, rotateZ: -1.4 },
  { name: 'vertical-depth', x: 12, y: 34, z: 110, rotateX: 3.2, rotateY: 1.4, rotateZ: 0.8 },
  { name: 'cross-depth', x: -30, y: -26, z: -96, rotateX: -3.4, rotateY: -2.8, rotateZ: 1.8 },
];

const SPATIAL_VARIABLES = [
  '--scroll-enter-x',
  '--scroll-enter-y',
  '--scroll-enter-z',
  '--scroll-enter-rotate-x',
  '--scroll-enter-rotate-y',
  '--scroll-enter-rotate-z',
  '--scroll-enter-scale',
  '--scroll-parallax-x',
  '--scroll-parallax-y',
  '--scroll-parallax-z',
  '--scroll-parallax-rotate-x',
  '--scroll-parallax-rotate-y',
  '--scroll-parallax-rotate-z',
];

const isStoryElement = (element: Element) => Boolean(element.closest('[data-anime-scroll-story]'));

const revealKind = (element: HTMLElement): RevealKind => {
  if (element.matches('[data-anime-visual], [data-blue-visual]')) return 'visual';
  if (element.matches('[data-anime-line], [data-blue-path]')) return 'line';
  return 'copy';
};

const parseParallaxDistance = (element: HTMLElement) => {
  const raw = Number(element.dataset.animeParallax ?? 4);
  return Number.isFinite(raw) ? Math.min(Math.max(Math.abs(raw), 1), 10) : 4;
};

const clearSpatialVariables = (element: HTMLElement) => {
  SPATIAL_VARIABLES.forEach((property) => element.style.removeProperty(property));
};

export default function ScrollEffects() {
  useEffect(() => {
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    const compactQuery = matchMedia('(max-width: 767px)');
    let revealObserver: IntersectionObserver | undefined;
    let sceneObserver: IntersectionObserver | undefined;
    let setupFrame = 0;
    const settleTimers = new Set<number>();
    const observedElements = new Set<HTMLElement>();
    const parallaxElements = new Set<HTMLElement>();
    const spaceElements = new Set<HTMLElement>();
    const sceneRatios = new Map<HTMLElement, number>();

    const settle = (element: HTMLElement) => {
      element.dataset.scrollReveal = 'settled';
      element.style.removeProperty('--scroll-reveal-delay');
    };

    const registerSpace = (element: HTMLElement) => {
      const space = element.closest(
        '[data-cinematic-section], section, .section-inner, .anime-scene-anchor',
      );
      if (!(space instanceof HTMLElement)) return;
      space.dataset.scrollSpace = 'true';
      spaceElements.add(space);
    };

    const assignRevealProfile = (element: HTMLElement, kind: RevealKind, profileIndex: number) => {
      if (kind === 'line') return;
      const profile = REVEAL_PROFILES[profileIndex % REVEAL_PROFILES.length]!;
      const compactScale = compactQuery.matches ? 0.48 : 1;
      const strength = kind === 'visual' ? 1 : kind === 'stagger' ? 0.82 : 0.66;
      const rotationScale = (compactQuery.matches ? 0.55 : 1) * strength;
      const scale = 1 + (profile.scale - 1) * (compactQuery.matches ? 0.55 : strength);

      element.dataset.scrollRevealDirection = profile.name;
      element.style.setProperty('--scroll-enter-x', `${profile.x * compactScale * strength}px`);
      element.style.setProperty('--scroll-enter-y', `${profile.y * compactScale * strength}px`);
      element.style.setProperty('--scroll-enter-z', `${profile.z * compactScale * strength}px`);
      element.style.setProperty('--scroll-enter-rotate-x', `${profile.rotateX * rotationScale}deg`);
      element.style.setProperty('--scroll-enter-rotate-y', `${profile.rotateY * rotationScale}deg`);
      element.style.setProperty('--scroll-enter-rotate-z', `${profile.rotateZ * rotationScale}deg`);
      element.style.setProperty('--scroll-enter-scale', String(scale));
      registerSpace(element);
    };

    const assignParallaxProfile = (element: HTMLElement, profileIndex: number) => {
      const profile = PARALLAX_PROFILES[profileIndex % PARALLAX_PROFILES.length]!;
      const distanceScale = parseParallaxDistance(element) / 4;
      const compactScale = compactQuery.matches ? 0.42 : 1;
      element.dataset.scrollParallaxDirection = profile.name;
      element.style.setProperty(
        '--scroll-parallax-x',
        `${profile.x * distanceScale * compactScale}px`,
      );
      element.style.setProperty(
        '--scroll-parallax-y',
        `${profile.y * distanceScale * compactScale}px`,
      );
      element.style.setProperty(
        '--scroll-parallax-z',
        `${profile.z * distanceScale * compactScale}px`,
      );
      element.style.setProperty(
        '--scroll-parallax-rotate-x',
        `${profile.rotateX * compactScale}deg`,
      );
      element.style.setProperty(
        '--scroll-parallax-rotate-y',
        `${profile.rotateY * compactScale}deg`,
      );
      element.style.setProperty(
        '--scroll-parallax-rotate-z',
        `${profile.rotateZ * compactScale}deg`,
      );
      registerSpace(element);
    };

    const showImmediately = () => {
      document.documentElement.dataset.motionReady = 'reduced';
      document.querySelectorAll<HTMLElement>(revealSelectors.join(',')).forEach((element) => {
        element.dataset.scrollReveal = 'settled';
        delete element.dataset.scrollRevealDirection;
        element.style.removeProperty('--scroll-reveal-delay');
        clearSpatialVariables(element);
      });
      document.querySelectorAll<HTMLElement>('[data-anime-stagger] > *').forEach((element) => {
        element.dataset.scrollReveal = 'settled';
        delete element.dataset.scrollRevealDirection;
        element.style.removeProperty('--scroll-reveal-delay');
        clearSpatialVariables(element);
      });
      document.querySelectorAll<HTMLElement>('[data-anime-parallax]').forEach((element) => {
        delete element.dataset.scrollParallax;
        delete element.dataset.scrollParallaxDirection;
        clearSpatialVariables(element);
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
        delete element.dataset.scrollRevealDirection;
        element.style.removeProperty('--scroll-reveal-delay');
        clearSpatialVariables(element);
      });
      parallaxElements.forEach((element) => {
        delete element.dataset.scrollParallax;
        delete element.dataset.scrollParallaxDirection;
        clearSpatialVariables(element);
      });
      spaceElements.forEach((element) => delete element.dataset.scrollSpace);
      observedElements.clear();
      parallaxElements.clear();
      spaceElements.clear();
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
      }, 1250);
      settleTimers.add(timer);
    };

    const prepareElement = (
      element: HTMLElement,
      kind: RevealKind = revealKind(element),
      delayIndex = 0,
      profileIndex = 0,
    ) => {
      if (isStoryElement(element)) return;
      observedElements.add(element);
      element.dataset.scrollReveal = 'pending';
      element.dataset.scrollRevealKind = kind;
      element.style.setProperty('--scroll-reveal-delay', `${Math.min(delayIndex, 6) * 55}ms`);
      assignRevealProfile(element, kind, profileIndex);
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
        let profileIndex = 0;
        document.querySelectorAll<HTMLElement>(revealSelectors.join(',')).forEach((element) => {
          prepareElement(element, revealKind(element), 0, profileIndex);
          profileIndex += 1;
        });

        document
          .querySelectorAll<HTMLElement>('[data-anime-stagger]')
          .forEach((group, groupIndex) => {
            if (isStoryElement(group)) return;
            Array.from(group.children).forEach((child, childIndex) => {
              if (child instanceof HTMLElement) {
                prepareElement(
                  child,
                  'stagger',
                  childIndex,
                  profileIndex + groupIndex * 3 + childIndex,
                );
              }
            });
            profileIndex += group.children.length;
          });

        document
          .querySelectorAll<HTMLElement>('[data-anime-parallax]')
          .forEach((element, index) => {
            if (isStoryElement(element)) return;
            parallaxElements.add(element);
            assignParallaxProfile(element, index);
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
    const onEnvironmentChange = () => setup();

    setup();
    document.addEventListener('astro:page-load', onPageLoad);
    motionQuery.addEventListener('change', onEnvironmentChange);
    compactQuery.addEventListener('change', onEnvironmentChange);

    return () => {
      cleanup();
      document.removeEventListener('astro:page-load', onPageLoad);
      motionQuery.removeEventListener('change', onEnvironmentChange);
      compactQuery.removeEventListener('change', onEnvironmentChange);
      delete document.documentElement.dataset.motionReady;
    };
  }, []);

  return null;
}
