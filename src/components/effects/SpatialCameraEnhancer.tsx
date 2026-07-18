import { useEffect } from 'react';

type RevertibleContext = { revert: () => void };

type MutableTriggerVars = {
  trigger?: Element | string;
  pin?: Element | string | boolean;
  end?: string | (() => string);
};

const cameraPath = [
  { x: 0, y: 0, z: 28, rotateX: 0, rotateY: 0, rotateZ: 0, px: 50, py: 44 },
  {
    x: -18,
    y: 10,
    z: 72,
    rotateX: 2,
    rotateY: -4,
    rotateZ: -0.8,
    px: 47,
    py: 46,
  },
  {
    x: 16,
    y: -12,
    z: 108,
    rotateX: -2,
    rotateY: 4,
    rotateZ: 0.8,
    px: 53,
    py: 42,
  },
];

export default function SpatialCameraEnhancer() {
  useEffect(() => {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const compactViewport = matchMedia('(max-width: 767px)');
    let context: RevertibleContext | undefined;
    let generation = 0;
    let syncTimer = 0;
    let activeRoot: HTMLElement | undefined;

    const cleanup = () => {
      generation += 1;
      window.clearTimeout(syncTimer);
      context?.revert();
      context = undefined;
      if (activeRoot) delete activeRoot.dataset.spatialCameraReady;
      activeRoot = undefined;
    };

    const setup = async () => {
      cleanup();
      const root = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
      const camera = root?.querySelector<HTMLElement>('[data-story-camera-rig]');
      if (!root || !camera) return;

      activeRoot = root;
      if (reducedMotion.matches) return;
      root.dataset.spatialCameraReady = 'pending';

      const flybys = Array.from(root.querySelectorAll<HTMLElement>('[data-story-flyby]'));
      const frontLayers = Array.from(
        root.querySelectorAll<HTMLElement>('[data-story-depth="front"]'),
      );
      const token = generation;
      const [gsapModule, triggerModule] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (token !== generation || !root.isConnected || reducedMotion.matches) return;

      const gsap = gsapModule.gsap;
      const ScrollTrigger = triggerModule.ScrollTrigger;
      const compact = compactViewport.matches;
      const distance = compact ? 0.46 : 1;
      const scrollLength = () => `+=${Math.round(innerHeight * (compact ? 5.7 : 7.2))}`;
      gsap.registerPlugin(ScrollTrigger);

      root.dataset.storyCamera = 'multi-axis';
      root.dataset.storyCameraPath = 'portal-forward-stabilized';
      context = gsap.context(() => {
        gsap.set(camera, { transformOrigin: '50% 50%', force3D: true });
        gsap.set(flybys, { autoAlpha: 0, force3D: true });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: scrollLength,
            scrub: compact ? 0.16 : 0.34,
            invalidateOnRefresh: true,
          },
        });

        cameraPath.forEach((pose, index) => {
          timeline.to(
            camera,
            {
              x: pose.x * distance,
              y: pose.y * distance,
              z: pose.z * distance,
              rotateX: pose.rotateX * distance,
              rotateY: pose.rotateY * distance,
              rotateZ: pose.rotateZ * distance,
              duration: 1,
              ease: 'sine.inOut',
              force3D: true,
            },
            index,
          );
          timeline.to(
            root,
            {
              '--story-perspective-x': `${pose.px}%`,
              '--story-perspective-y': `${pose.py}%`,
              duration: 1,
              ease: 'sine.inOut',
            },
            index,
          );
        });

        frontLayers.forEach((layer, index) => {
          const direction = index % 2 === 0 ? 1 : -1;
          timeline.fromTo(
            layer,
            {
              xPercent: direction * -30,
              yPercent: ((index % 3) - 1) * 18,
              z: 46 * distance,
              rotateX: -4 * direction,
              rotateY: 6 * direction,
              scale: 0.94,
              autoAlpha: 0.16,
            },
            {
              xPercent: direction * 34,
              yPercent: (((index + 1) % 3) - 1) * -22,
              z: 170 * distance,
              rotateX: 4 * direction,
              rotateY: -6 * direction,
              scale: 1.1,
              autoAlpha: 0.58,
              duration: 1.05,
              ease: 'none',
              force3D: true,
            },
            index * 0.82,
          );
        });

        flybys.forEach((flyby, index) => {
          const direction = index % 2 === 0 ? 1 : -1;
          const start = 0.2 + index * 0.54;
          timeline.fromTo(
            flyby,
            {
              autoAlpha: 0,
              xPercent: direction * -160,
              yPercent: ((index % 3) - 1) * 90,
              z: -320 * distance,
              rotateX: direction * -8,
              rotateY: direction * 14,
              rotateZ: direction * -6,
              scale: 0.46,
            },
            {
              autoAlpha: compact ? 0.28 : 0.64,
              xPercent: direction * 170,
              yPercent: (((index + 1) % 3) - 1) * -96,
              z: 430 * distance,
              rotateX: direction * 9,
              rotateY: direction * -16,
              rotateZ: direction * 7,
              scale: compact ? 1.16 : 1.65,
              duration: compact ? 0.42 : 0.56,
              ease: 'power2.in',
              force3D: true,
            },
            start,
          );
          timeline.to(flyby, { autoAlpha: 0, duration: 0.12 }, start + (compact ? 0.34 : 0.46));
        });
      }, root);

      const syncPinnedStory = (attempt = 0) => {
        if (token !== generation || !root.isConnected || reducedMotion.matches) return;
        const pinnedStory = ScrollTrigger.getAll().find((trigger) => {
          const vars = trigger.vars as MutableTriggerVars;
          return vars.trigger === root && vars.pin === root;
        });

        if (!pinnedStory) {
          if (attempt < 30) {
            syncTimer = window.setTimeout(() => syncPinnedStory(attempt + 1), 160);
          }
          return;
        }

        (pinnedStory.vars as MutableTriggerVars).end = scrollLength;
        pinnedStory.refresh();
        root.dataset.spatialCameraReady = 'true';
      };

      syncTimer = window.setTimeout(() => syncPinnedStory(), 160);
    };

    const onChange = () => void setup();
    void setup();
    document.addEventListener('astro:page-load', onChange);
    reducedMotion.addEventListener('change', onChange);
    compactViewport.addEventListener('change', onChange);

    return () => {
      cleanup();
      document.removeEventListener('astro:page-load', onChange);
      reducedMotion.removeEventListener('change', onChange);
      compactViewport.removeEventListener('change', onChange);
    };
  }, []);

  return null;
}
