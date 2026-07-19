import { useEffect } from 'react';

type RevertibleContext = { revert: () => void };

type CometPath = {
  start: number;
  from: {
    xPercent: number;
    yPercent: number;
    z: number;
    rotateZ: number;
    scale: number;
  };
  to: {
    xPercent: number;
    yPercent: number;
    z: number;
    rotateZ: number;
    scale: number;
  };
};

const COMET_PATHS: CometPath[] = [
  {
    start: 0.18,
    from: { xPercent: -230, yPercent: -180, z: -620, rotateZ: -24, scale: 0.28 },
    to: { xPercent: 250, yPercent: 190, z: 680, rotateZ: -24, scale: 2.2 },
  },
  {
    start: 0.76,
    from: { xPercent: 230, yPercent: -120, z: -520, rotateZ: 18, scale: 0.34 },
    to: { xPercent: -250, yPercent: 170, z: 760, rotateZ: 18, scale: 2.5 },
  },
  {
    start: 1.36,
    from: { xPercent: -210, yPercent: 150, z: -700, rotateZ: 28, scale: 0.26 },
    to: { xPercent: 240, yPercent: -180, z: 720, rotateZ: 28, scale: 2.3 },
  },
  {
    start: 1.94,
    from: { xPercent: 220, yPercent: 170, z: -560, rotateZ: -20, scale: 0.3 },
    to: { xPercent: -260, yPercent: -150, z: 820, rotateZ: -20, scale: 2.6 },
  },
  {
    start: 2.5,
    from: { xPercent: -240, yPercent: -70, z: -760, rotateZ: -8, scale: 0.24 },
    to: { xPercent: 260, yPercent: 110, z: 860, rotateZ: -8, scale: 2.8 },
  },
  {
    start: 2.82,
    from: { xPercent: 230, yPercent: -190, z: -680, rotateZ: 26, scale: 0.26 },
    to: { xPercent: -250, yPercent: 190, z: 780, rotateZ: 26, scale: 2.4 },
  },
];

export default function CinematicEntertainmentDirector() {
  useEffect(() => {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const compactViewport = matchMedia('(max-width: 767px)');
    let context: RevertibleContext | undefined;
    let loaderObserver: MutationObserver | undefined;
    let tapTimer = 0;
    let generation = 0;
    let activeRoot: HTMLElement | undefined;
    let activeStage: HTMLElement | undefined;

    const markReady = (root: HTMLElement) => {
      root.dataset.entertainmentReady = 'true';
    };

    const watchLoader = (root: HTMLElement) => {
      const loader = document.querySelector<HTMLElement>('.world-loader');
      if (!loader || loader.hidden || loader.style.display === 'none') {
        markReady(root);
        return;
      }

      const releaseIfHidden = () => {
        if (
          loader.hidden ||
          loader.getAttribute('aria-hidden') === 'true' ||
          loader.style.display === 'none'
        ) {
          markReady(root);
          loaderObserver?.disconnect();
          loaderObserver = undefined;
        }
      };

      loaderObserver = new MutationObserver(releaseIfHidden);
      loaderObserver.observe(loader, {
        attributes: true,
        attributeFilter: ['hidden', 'style', 'class', 'aria-hidden'],
      });
      releaseIfHidden();
    };

    const updatePointer = (event: PointerEvent) => {
      const root = activeRoot;
      const stage = activeStage;
      if (!root || !stage || reducedMotion.matches) return;
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      root.style.setProperty('--entertainment-pointer-x', x.toFixed(4));
      root.style.setProperty('--entertainment-pointer-y', y.toFixed(4));
    };

    const resetPointer = () => {
      activeRoot?.style.setProperty('--entertainment-pointer-x', '0');
      activeRoot?.style.setProperty('--entertainment-pointer-y', '0');
    };

    const triggerTapImpact = () => {
      const root = activeRoot;
      if (!root || reducedMotion.matches) return;
      window.clearTimeout(tapTimer);
      delete root.dataset.entertainmentTap;
      requestAnimationFrame(() => {
        root.dataset.entertainmentTap = 'true';
        tapTimer = window.setTimeout(() => delete root.dataset.entertainmentTap, 620);
      });
    };

    const cleanup = () => {
      generation += 1;
      context?.revert();
      context = undefined;
      loaderObserver?.disconnect();
      loaderObserver = undefined;
      window.clearTimeout(tapTimer);
      activeStage?.removeEventListener('pointermove', updatePointer);
      activeStage?.removeEventListener('pointerleave', resetPointer);
      activeStage?.removeEventListener('pointerdown', triggerTapImpact);
      if (activeRoot) {
        delete activeRoot.dataset.storyEntertainment;
        delete activeRoot.dataset.entertainmentReady;
        delete activeRoot.dataset.entertainmentTap;
        activeRoot.style.removeProperty('--entertainment-pointer-x');
        activeRoot.style.removeProperty('--entertainment-pointer-y');
        activeRoot.style.removeProperty('--entertainment-progress');
      }
      activeRoot = undefined;
      activeStage = undefined;
    };

    const setup = async () => {
      cleanup();
      const root = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
      const stage = root?.querySelector<HTMLElement>('[data-anime-scroll-stage]');
      const layer = root?.querySelector<HTMLElement>('[data-entertainment-layer]');
      if (!root || !stage || !layer) return;

      activeRoot = root;
      activeStage = stage;
      watchLoader(root);
      stage.addEventListener('pointermove', updatePointer, { passive: true });
      stage.addEventListener('pointerleave', resetPointer, { passive: true });
      stage.addEventListener('pointerdown', triggerTapImpact, { passive: true });

      if (reducedMotion.matches) {
        root.dataset.storyEntertainment = 'static';
        markReady(root);
        return;
      }

      const token = generation;
      const [gsapModule, triggerModule] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (token !== generation || !root.isConnected || reducedMotion.matches) return;

      const gsap = gsapModule.gsap;
      const ScrollTrigger = triggerModule.ScrollTrigger;
      const compact = compactViewport.matches;
      const distance = compact ? 0.52 : 1;
      const scrollLength = () => `+=${Math.round(innerHeight * (compact ? 2.35 : 3.05))}`;
      const rings = Array.from(layer.querySelectorAll<HTMLElement>('[data-entertainment-ring]'));
      const comets = Array.from(layer.querySelectorAll<HTMLElement>('[data-entertainment-comet]'));
      const words = Array.from(layer.querySelectorAll<HTMLElement>('[data-entertainment-word]'));
      const slices = Array.from(layer.querySelectorAll<HTMLElement>('[data-entertainment-slice]'));
      const flash = layer.querySelector<HTMLElement>('[data-entertainment-flash]');
      const shockwave = layer.querySelector<HTMLElement>('[data-entertainment-shockwave]');

      gsap.registerPlugin(ScrollTrigger);
      root.dataset.storyEntertainment = 'cinematic-impact';

      context = gsap.context(() => {
        gsap.set([...rings, ...comets, ...words, ...slices], {
          autoAlpha: 0,
          force3D: true,
        });
        if (flash) gsap.set(flash, { autoAlpha: 0, force3D: true });
        if (shockwave) gsap.set(shockwave, { autoAlpha: 0, force3D: true });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: scrollLength,
            scrub: compact ? 0.12 : 0.24,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              root.style.setProperty('--entertainment-progress', self.progress.toFixed(4));
            },
          },
        });

        rings.forEach((ring, index) => {
          const start = index * 0.42;
          const direction = index % 2 === 0 ? 1 : -1;
          timeline.fromTo(
            ring,
            {
              autoAlpha: 0,
              z: (-980 - index * 90) * distance,
              rotateX: direction * 52,
              rotateY: direction * -38,
              rotateZ: direction * 24,
              scale: 0.12,
            },
            {
              autoAlpha: compact ? 0.2 : 0.48,
              z: (640 + index * 50) * distance,
              rotateX: direction * -18,
              rotateY: direction * 28,
              rotateZ: direction * 92,
              scale: compact ? 1.8 : 2.8,
              duration: 1.18,
              ease: 'power2.in',
              force3D: true,
            },
            start,
          );
          timeline.to(ring, { autoAlpha: 0, duration: 0.14 }, start + 1.02);
        });

        comets.slice(0, compact ? 4 : COMET_PATHS.length).forEach((comet, index) => {
          const path = COMET_PATHS[index]!;
          timeline.fromTo(
            comet,
            {
              autoAlpha: 0,
              xPercent: path.from.xPercent,
              yPercent: path.from.yPercent,
              z: path.from.z * distance,
              rotateZ: path.from.rotateZ,
              scale: path.from.scale,
            },
            {
              autoAlpha: compact ? 0.5 : 0.94,
              xPercent: path.to.xPercent,
              yPercent: path.to.yPercent,
              z: path.to.z * distance,
              rotateZ: path.to.rotateZ,
              scale: compact ? path.to.scale * 0.68 : path.to.scale,
              duration: compact ? 0.34 : 0.46,
              ease: 'power3.in',
              force3D: true,
            },
            path.start,
          );
          timeline.to(comet, { autoAlpha: 0, duration: 0.08 }, path.start + 0.38);
        });

        const impactCuts = [1.12, 2.56];
        impactCuts.forEach((at, cutIndex) => {
          if (flash) {
            timeline.fromTo(
              flash,
              { autoAlpha: 0, scaleX: 0.12, rotateZ: cutIndex === 0 ? -8 : 7 },
              {
                autoAlpha: compact ? 0.52 : 0.9,
                scaleX: 1.3,
                rotateZ: cutIndex === 0 ? -3 : 3,
                duration: 0.11,
                ease: 'power4.out',
                force3D: true,
              },
              at,
            );
            timeline.to(flash, { autoAlpha: 0, scaleX: 1.6, duration: 0.16 }, at + 0.1);
          }

          slices.forEach((slice, sliceIndex) => {
            const direction = (sliceIndex + cutIndex) % 2 === 0 ? 1 : -1;
            timeline.fromTo(
              slice,
              {
                autoAlpha: 0,
                xPercent: direction * -125,
                yPercent: (sliceIndex - 1) * 26,
                rotateZ: direction * -8,
                scaleX: 0.4,
              },
              {
                autoAlpha: compact ? 0.35 : 0.72,
                xPercent: direction * 118,
                yPercent: (sliceIndex - 1) * -18,
                rotateZ: direction * -4,
                scaleX: 1.25,
                duration: 0.24,
                ease: 'power4.inOut',
                force3D: true,
              },
              at + sliceIndex * 0.025,
            );
            timeline.to(slice, { autoAlpha: 0, duration: 0.08 }, at + 0.2);
          });

          if (shockwave) {
            timeline.fromTo(
              shockwave,
              { autoAlpha: 0.82, scale: 0.12, rotateZ: cutIndex * 38 },
              {
                autoAlpha: 0,
                scale: compact ? 1.7 : 3.1,
                rotateZ: 120 + cutIndex * 40,
                duration: 0.46,
                ease: 'power3.out',
                force3D: true,
              },
              at + 0.03,
            );
          }
        });

        if (words[0]) {
          timeline.fromTo(
            words[0],
            { autoAlpha: 0, xPercent: 72, z: -420 * distance, rotateY: -32, scale: 0.72 },
            {
              autoAlpha: compact ? 0.16 : 0.34,
              xPercent: -12,
              z: 90 * distance,
              rotateY: 4,
              scale: 1.08,
              duration: 0.72,
              ease: 'expo.out',
              force3D: true,
            },
            0.86,
          );
          timeline.to(words[0], { autoAlpha: 0, xPercent: -68, z: 360, duration: 0.5 }, 1.42);
        }

        if (words[1]) {
          timeline.fromTo(
            words[1],
            { autoAlpha: 0, xPercent: -78, z: -480 * distance, rotateY: 34, scale: 0.68 },
            {
              autoAlpha: compact ? 0.14 : 0.3,
              xPercent: 10,
              z: 120 * distance,
              rotateY: -4,
              scale: 1.12,
              duration: 0.74,
              ease: 'expo.out',
              force3D: true,
            },
            1.18,
          );
          timeline.to(words[1], { autoAlpha: 0, xPercent: 72, z: 380, duration: 0.5 }, 1.8);
        }

        if (words[2]) {
          timeline.fromTo(
            words[2],
            { autoAlpha: 0, yPercent: 64, z: -620 * distance, rotateX: -28, scale: 0.6 },
            {
              autoAlpha: compact ? 0.16 : 0.36,
              yPercent: 2,
              z: 150 * distance,
              rotateX: 3,
              scale: 1.04,
              duration: 0.82,
              ease: 'expo.out',
              force3D: true,
            },
            2.22,
          );
          timeline.to(words[2], { autoAlpha: 0, yPercent: -54, z: 430, duration: 0.56 }, 2.88);
        }
      }, root);
    };

    const onEnvironmentChange = () => void setup();
    void setup();
    document.addEventListener('astro:page-load', onEnvironmentChange);
    reducedMotion.addEventListener('change', onEnvironmentChange);
    compactViewport.addEventListener('change', onEnvironmentChange);

    return () => {
      cleanup();
      document.removeEventListener('astro:page-load', onEnvironmentChange);
      reducedMotion.removeEventListener('change', onEnvironmentChange);
      compactViewport.removeEventListener('change', onEnvironmentChange);
    };
  }, []);

  return null;
}
