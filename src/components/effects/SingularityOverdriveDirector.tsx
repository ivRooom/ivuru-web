import { useEffect } from 'react';

type RevertibleContext = { revert: () => void };

type OverdriveNodes = {
  overlay: HTMLDivElement;
  voidLayer: HTMLDivElement;
  core: HTMLDivElement;
  lenses: HTMLSpanElement[];
  rays: HTMLElement[];
  fragments: HTMLElement[];
  title: HTMLDivElement;
  chromatic: HTMLDivElement;
  whiteout: HTMLDivElement;
};

const SINGULARITY_RAY_COUNT = 24;
const SINGULARITY_FRAGMENT_COUNT = 12;

const createElement = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string) => {
  const element = document.createElement(tag);
  element.className = className;
  return element;
};

const buildOverdrive = (): OverdriveNodes => {
  const overlay = createElement('div', 'anime-singularity-overdrive');
  overlay.dataset.singularityOverdrive = '';
  overlay.setAttribute('aria-hidden', 'true');

  const voidLayer = createElement('div', 'anime-singularity-void');
  const core = createElement('div', 'anime-singularity-core');
  core.append(
    createElement('span', 'anime-singularity-core-halo'),
    createElement('span', 'anime-singularity-core-disc'),
    createElement('span', 'anime-singularity-core-star'),
  );

  const lensField = createElement('div', 'anime-singularity-lenses');
  const lenses = Array.from({ length: 5 }, (_, index) => {
    const lens = createElement('span', 'anime-singularity-lens');
    lens.style.setProperty('--singularity-lens-index', `${index}`);
    lensField.append(lens);
    return lens;
  });

  const tunnel = createElement('div', 'anime-singularity-tunnel');
  const rays = Array.from({ length: SINGULARITY_RAY_COUNT }, (_, index) => {
    const ray = createElement('i', 'anime-singularity-ray');
    const angle = index * (360 / SINGULARITY_RAY_COUNT) + ((index * 17) % 11) - 5;
    const length = 170 + (index % 6) * 44;
    const offset = 46 + (index % 5) * 14;
    ray.style.setProperty('--singularity-ray-angle', `${angle}deg`);
    ray.style.setProperty('--singularity-ray-length', `${length}px`);
    ray.style.setProperty('--singularity-ray-offset', `${offset}px`);
    tunnel.append(ray);
    return ray;
  });

  const fragmentField = createElement('div', 'anime-singularity-fragments');
  const fragments = Array.from({ length: SINGULARITY_FRAGMENT_COUNT }, (_, index) => {
    const fragment = createElement('i', 'anime-singularity-fragment');
    const angle = index * (360 / SINGULARITY_FRAGMENT_COUNT) + ((index * 13) % 17) - 8;
    const distance = 180 + (index % 4) * 72;
    fragment.dataset.singularityAngle = `${angle}`;
    fragment.dataset.singularityDistance = `${distance}`;
    fragment.style.setProperty('--singularity-fragment-angle', `${angle}deg`);
    fragment.style.setProperty('--singularity-fragment-size', `${7 + (index % 4) * 3}px`);
    fragmentField.append(fragment);
    return fragment;
  });

  const title = createElement('div', 'anime-singularity-title');
  const titleLead = createElement('span', 'anime-singularity-title-lead');
  titleLead.textContent = 'IVURU // SINGULARITY';
  const titleMain = createElement('strong', 'anime-singularity-title-main');
  titleMain.textContent = 'OVERDRIVE';
  title.append(titleLead, titleMain);

  const chromatic = createElement('div', 'anime-singularity-chromatic');
  const whiteout = createElement('div', 'anime-singularity-whiteout');

  overlay.append(
    voidLayer,
    lensField,
    tunnel,
    fragmentField,
    core,
    title,
    chromatic,
    whiteout,
  );

  return {
    overlay,
    voidLayer,
    core,
    lenses,
    rays,
    fragments,
    title,
    chromatic,
    whiteout,
  };
};

const getFragmentVector = (fragment: HTMLElement, axis: 'x' | 'y') => {
  const angle = Number(fragment.dataset.singularityAngle ?? 0) * (Math.PI / 180);
  const distance = Number(fragment.dataset.singularityDistance ?? 220);
  return (axis === 'x' ? Math.cos(angle) : Math.sin(angle)) * distance;
};

export default function SingularityOverdriveDirector() {
  useEffect(() => {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const compactViewport = matchMedia('(max-width: 767px)');
    let context: RevertibleContext | undefined;
    let activeRoot: HTMLElement | undefined;
    let activeOverlay: HTMLElement | undefined;
    let generation = 0;

    const cleanup = () => {
      generation += 1;
      context?.revert();
      context = undefined;
      activeOverlay?.remove();
      activeOverlay = undefined;
      if (activeRoot) {
        delete activeRoot.dataset.storyOverdrive;
        delete activeRoot.dataset.overdriveReady;
        delete activeRoot.dataset.overdrivePhase;
        activeRoot.style.removeProperty('--singularity-progress');
      }
      activeRoot = undefined;
    };

    const setup = async () => {
      cleanup();
      const root = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
      const layer = root?.querySelector<HTMLElement>('[data-entertainment-layer]');
      if (!root || !layer) return;

      activeRoot = root;
      root.style.setProperty('--singularity-progress', '0');

      if (reducedMotion.matches) {
        root.dataset.storyOverdrive = 'static';
        root.dataset.overdriveReady = 'true';
        root.dataset.overdrivePhase = 'static';
        return;
      }

      const nodes = buildOverdrive();
      layer.append(nodes.overlay);
      activeOverlay = nodes.overlay;

      const token = generation;
      const [gsapModule, triggerModule] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (token !== generation || !root.isConnected || reducedMotion.matches) return;

      const gsap = gsapModule.gsap;
      const ScrollTrigger = triggerModule.ScrollTrigger;
      const compact = compactViewport.matches;
      const scrollLength = () => `+=${Math.round(innerHeight * (compact ? 0.94 : 1.18))}`;

      gsap.registerPlugin(ScrollTrigger);
      root.dataset.storyOverdrive = 'singularity-overdrive';
      root.dataset.overdriveReady = 'true';
      root.dataset.overdrivePhase = 'charge';

      context = gsap.context(() => {
        gsap.set(nodes.overlay, { autoAlpha: 1, force3D: true });
        gsap.set([nodes.voidLayer, nodes.title, nodes.chromatic, nodes.whiteout], {
          autoAlpha: 0,
          force3D: true,
        });
        gsap.set(nodes.core, {
          autoAlpha: 0.22,
          scale: 0.3,
          z: -180,
          rotateZ: -18,
          force3D: true,
        });
        gsap.set(nodes.lenses, {
          autoAlpha: 0.12,
          scale: 0.36,
          z: -260,
          force3D: true,
        });
        gsap.set(nodes.rays, {
          autoAlpha: 0,
          scaleY: 0.06,
          z: -920,
          force3D: true,
        });
        gsap.set(nodes.fragments, {
          autoAlpha: 0,
          x: 0,
          y: 0,
          z: -260,
          scale: 0.2,
          force3D: true,
        });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: scrollLength,
            scrub: compact ? 0.1 : 0.18,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const progress = self.progress;
              root.style.setProperty('--singularity-progress', progress.toFixed(4));
              const phase =
                progress < 0.34
                  ? 'charge'
                  : progress < 0.5
                    ? 'collapse'
                    : progress < 0.82
                      ? 'burst'
                      : progress < 0.97
                        ? 'tunnel'
                        : 'complete';
              if (root.dataset.overdrivePhase !== phase) root.dataset.overdrivePhase = phase;
            },
          },
        });

        timeline.fromTo(
          nodes.voidLayer,
          { autoAlpha: 0 },
          { autoAlpha: compact ? 0.62 : 0.82, duration: 0.28, ease: 'sine.out' },
          0,
        );
        timeline.to(
          nodes.core,
          {
            autoAlpha: 1,
            scale: 1,
            z: 0,
            rotateZ: 0,
            duration: 0.32,
            ease: 'expo.out',
          },
          0,
        );

        nodes.lenses.forEach((lens, index) => {
          timeline.to(
            lens,
            {
              autoAlpha: compact ? 0.38 : 0.68,
              scale: 0.86 + index * 0.13,
              z: index * 18,
              rotateZ: (index % 2 === 0 ? 1 : -1) * (48 + index * 22),
              duration: 0.38,
              ease: 'expo.out',
              force3D: true,
            },
            0.02 + index * 0.018,
          );
        });

        timeline.fromTo(
          nodes.title,
          { autoAlpha: 0, y: 34, z: -240, scale: 0.72, rotateX: 22 },
          {
            autoAlpha: compact ? 0.54 : 0.92,
            y: 0,
            z: 0,
            scale: 1,
            rotateX: 0,
            duration: 0.25,
            ease: 'expo.out',
            force3D: true,
          },
          0.08,
        );
        timeline.to(
          nodes.title,
          { autoAlpha: 0, y: -28, z: 180, scale: 1.08, duration: 0.16, ease: 'power3.in' },
          0.36,
        );

        timeline.to(
          nodes.core,
          { scale: 0.075, rotateZ: -94, z: -90, duration: 0.17, ease: 'power4.in' },
          0.38,
        );
        nodes.lenses.forEach((lens, index) => {
          timeline.to(
            lens,
            {
              scale: 0.18 + index * 0.025,
              rotateZ: (index % 2 === 0 ? 1 : -1) * (190 + index * 34),
              z: -120,
              duration: 0.19,
              ease: 'power4.in',
            },
            0.36 + index * 0.006,
          );
        });

        timeline.to(
          nodes.fragments,
          {
            autoAlpha: compact ? 0.48 : 0.88,
            z: 0,
            scale: 1,
            stagger: 0.008,
            duration: 0.12,
            ease: 'power2.out',
          },
          0.4,
        );

        timeline.to(nodes.whiteout, { autoAlpha: 1, duration: 0.045, ease: 'none' }, 0.52);
        timeline.to(nodes.whiteout, { autoAlpha: 0, duration: 0.2, ease: 'power2.out' }, 0.565);
        timeline.fromTo(
          nodes.chromatic,
          { autoAlpha: 0, scale: 0.45, rotateZ: -18 },
          {
            autoAlpha: compact ? 0.5 : 0.9,
            scale: compact ? 2.4 : 3.5,
            rotateZ: 28,
            duration: 0.19,
            ease: 'expo.out',
            force3D: true,
          },
          0.51,
        );
        timeline.to(nodes.chromatic, { autoAlpha: 0, scale: 4.2, duration: 0.16 }, 0.69);
        timeline.to(
          nodes.core,
          {
            autoAlpha: 0,
            scale: compact ? 5.8 : 8.8,
            z: 720,
            rotateZ: 210,
            duration: 0.34,
            ease: 'expo.out',
            force3D: true,
          },
          0.52,
        );

        nodes.lenses.forEach((lens, index) => {
          timeline.to(
            lens,
            {
              autoAlpha: 0,
              scale: compact ? 4.4 + index * 0.42 : 7 + index * 0.72,
              z: 620 + index * 74,
              rotateZ: (index % 2 === 0 ? 1 : -1) * (420 + index * 62),
              duration: 0.38,
              ease: 'power4.in',
              force3D: true,
            },
            0.52 + index * 0.012,
          );
        });

        timeline.to(
          nodes.rays,
          {
            autoAlpha: compact ? 0.5 : 0.94,
            z: 960,
            scaleY: compact ? 2.8 : 4.6,
            stagger: 0.006,
            duration: compact ? 0.38 : 0.48,
            ease: 'power4.in',
            force3D: true,
          },
          0.49,
        );
        timeline.to(nodes.rays, { autoAlpha: 0, duration: 0.1, stagger: 0.002 }, 0.9);

        nodes.fragments.forEach((fragment, index) => {
          timeline.to(
            fragment,
            {
              autoAlpha: 0,
              x: getFragmentVector(fragment, 'x') * (compact ? 0.66 : 1),
              y: getFragmentVector(fragment, 'y') * (compact ? 0.66 : 1),
              z: 520 + (index % 4) * 120,
              rotateX: 160 + index * 23,
              rotateY: -130 + index * 31,
              rotateZ: 210 + index * 37,
              scale: 0.72 + (index % 3) * 0.34,
              duration: 0.4,
              ease: 'power4.out',
              force3D: true,
            },
            0.5 + index * 0.006,
          );
        });

        timeline.to(nodes.voidLayer, { autoAlpha: 0, duration: 0.34, ease: 'sine.out' }, 0.72);
        timeline.to(nodes.overlay, { autoAlpha: 0, duration: 0.14, ease: 'none' }, 1.02);
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
