import { useEffect } from 'react';

type RevertibleContext = { revert: () => void };

const cameraPath = [
  { x: 34, y: -18, z: 90, rotateX: -4, rotateY: 8, rotateZ: 1.5, px: 58, py: 42 },
  { x: -52, y: 24, z: 150, rotateX: 7, rotateY: -13, rotateZ: -2.5, px: 42, py: 48 },
  { x: 38, y: -38, z: 210, rotateX: -8, rotateY: 16, rotateZ: 3, px: 63, py: 37 },
];

export default function SpatialCameraEnhancer() {
  useEffect(() => {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const compactViewport = matchMedia('(max-width: 767px)');
    let context: RevertibleContext | undefined;
    let generation = 0;

    const cleanup = () => {
      generation += 1;
      context?.revert();
      context = undefined;
    };

    const setup = async () => {
      cleanup();
      const root = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
      const camera = root?.querySelector<HTMLElement>('[data-story-camera-rig]');
      if (!root || !camera || reducedMotion.matches) return;

      const flybys = Array.from(root.querySelectorAll<HTMLElement>('[data-story-flyby]'));
      const frontLayers = Array.from(root.querySelectorAll<HTMLElement>('[data-story-depth="front"]'));
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
      gsap.registerPlugin(ScrollTrigger);

      root.dataset.storyCamera = 'orbital-flythrough';
      context = gsap.context(() => {
        gsap.set(camera, { transformOrigin: '50% 50%', force3D: true });
        gsap.set(flybys, { autoAlpha: 0, force3D: true });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: () => `+=${Math.round(innerHeight * (compact ? 2.35 : 3.05))}`,
            scrub: compact ? 0.14 : 0.3,
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
              xPercent: direction * -80,
              yPercent: ((index % 3) - 1) * 50,
              z: 80 * distance,
              rotateX: -10 * direction,
              rotateY: 16 * direction,
              scale: 0.84,
              autoAlpha: 0.18,
            },
            {
              xPercent: direction * 90,
              yPercent: ((index + 1) % 3 - 1) * -60,
              z: 360 * distance,
              rotateX: 12 * direction,
              rotateY: -18 * direction,
              scale: 1.28,
              autoAlpha: 0.82,
              duration: 1.05,
              ease: 'none',
              force3D: true,
            },
            index * 0.82,
          );
        });

        flybys.forEach((flyby, index) => {
          const direction = index % 2 === 0 ? 1 : -1;
          const start = 0.16 + index * 0.52;
          timeline.fromTo(
            flyby,
            {
              autoAlpha: 0,
              xPercent: direction * -220,
              yPercent: ((index % 3) - 1) * 150,
              z: -560 * distance,
              rotateX: direction * -18,
              rotateY: direction * 34,
              rotateZ: direction * -12,
              scale: 0.34,
            },
            {
              autoAlpha: compact ? 0.44 : 0.86,
              xPercent: direction * 230,
              yPercent: ((index + 1) % 3 - 1) * -160,
              z: 760 * distance,
              rotateX: direction * 20,
              rotateY: direction * -38,
              rotateZ: direction * 16,
              scale: compact ? 1.35 : 2.15,
              duration: compact ? 0.4 : 0.52,
              ease: 'power2.in',
              force3D: true,
            },
            start,
          );
          timeline.to(flyby, { autoAlpha: 0, duration: 0.1 }, start + (compact ? 0.32 : 0.43));
        });
      }, root);
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
