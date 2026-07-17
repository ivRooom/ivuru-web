import { useEffect } from 'react';

type RevertibleContext = { revert: () => void };

type StoryElements = {
  root: HTMLElement;
  scenes: HTMLElement[];
  dots: HTMLElement[];
  readout: HTMLElement | null;
  progressLine: HTMLElement | null;
};

type SpatialPose = {
  x: number;
  y: number;
  z: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scale: number;
};

type SceneMotionProfile = {
  sceneIn: SpatialPose;
  sceneOut: SpatialPose;
  copyIn: SpatialPose;
  copyOut: SpatialPose;
  visualIn: SpatialPose;
  visualOut: SpatialPose;
  orbit: Omit<SpatialPose, 'scale'>;
};

const SPATIAL_SCENE_PROFILES: SceneMotionProfile[] = [
  {
    sceneIn: { x: -120, y: 70, z: -300, rotateX: 7, rotateY: 14, rotateZ: -3, scale: 0.88 },
    sceneOut: { x: 190, y: -90, z: 360, rotateX: -8, rotateY: -18, rotateZ: 4, scale: 1.14 },
    copyIn: { x: -150, y: 80, z: -120, rotateX: 5, rotateY: 14, rotateZ: -3, scale: 0.96 },
    copyOut: { x: -190, y: -100, z: 180, rotateX: -6, rotateY: 18, rotateZ: -4, scale: 1.04 },
    visualIn: { x: 190, y: -60, z: -340, rotateX: -9, rotateY: -22, rotateZ: 5, scale: 0.84 },
    visualOut: { x: 220, y: -40, z: 390, rotateX: 9, rotateY: 20, rotateZ: -5, scale: 1.16 },
    orbit: { x: 32, y: -18, z: 55, rotateX: -2, rotateY: 5, rotateZ: 2 },
  },
  {
    sceneIn: { x: 220, y: 110, z: -360, rotateX: 9, rotateY: -18, rotateZ: 4, scale: 0.86 },
    sceneOut: { x: -210, y: -80, z: 340, rotateX: -7, rotateY: 17, rotateZ: -5, scale: 1.13 },
    copyIn: { x: 180, y: 90, z: -140, rotateX: 4, rotateY: -15, rotateZ: 3, scale: 0.96 },
    copyOut: { x: -180, y: -120, z: 180, rotateX: -5, rotateY: 17, rotateZ: -4, scale: 1.04 },
    visualIn: { x: -190, y: -80, z: -400, rotateX: -10, rotateY: 20, rotateZ: -5, scale: 0.82 },
    visualOut: { x: 230, y: -20, z: 410, rotateX: 8, rotateY: -22, rotateZ: 5, scale: 1.18 },
    orbit: { x: -36, y: -12, z: 70, rotateX: 3, rotateY: -6, rotateZ: -2 },
  },
  {
    sceneIn: { x: -230, y: -90, z: -420, rotateX: -8, rotateY: 22, rotateZ: -5, scale: 0.84 },
    sceneOut: { x: 200, y: -130, z: 380, rotateX: 10, rotateY: -19, rotateZ: 6, scale: 1.15 },
    copyIn: { x: -180, y: 110, z: -160, rotateX: 6, rotateY: 16, rotateZ: -4, scale: 0.95 },
    copyOut: { x: 210, y: -100, z: 210, rotateX: -5, rotateY: -18, rotateZ: 5, scale: 1.05 },
    visualIn: { x: 220, y: 70, z: -430, rotateX: 11, rotateY: -24, rotateZ: 6, scale: 0.8 },
    visualOut: { x: -230, y: -70, z: 430, rotateX: -10, rotateY: 22, rotateZ: -6, scale: 1.2 },
    orbit: { x: 42, y: 22, z: 85, rotateX: -4, rotateY: 7, rotateZ: 3 },
  },
  {
    sceneIn: { x: 0, y: 190, z: -500, rotateX: 18, rotateY: 0, rotateZ: -4, scale: 0.8 },
    sceneOut: { x: 0, y: -180, z: 420, rotateX: -16, rotateY: 0, rotateZ: 4, scale: 1.18 },
    copyIn: { x: 130, y: 150, z: -180, rotateX: 10, rotateY: -12, rotateZ: 4, scale: 0.94 },
    copyOut: { x: -150, y: -140, z: 220, rotateX: -9, rotateY: 14, rotateZ: -4, scale: 1.05 },
    visualIn: { x: -160, y: -120, z: -460, rotateX: -14, rotateY: 16, rotateZ: -6, scale: 0.78 },
    visualOut: { x: 180, y: -80, z: 450, rotateX: 12, rotateY: -18, rotateZ: 6, scale: 1.2 },
    orbit: { x: -28, y: -30, z: 95, rotateX: 5, rotateY: -5, rotateZ: -3 },
  },
];

const resolvePose = (pose: SpatialPose, compact: boolean): SpatialPose => {
  const distanceScale = compact ? 0.46 : 1;
  const rotationScale = compact ? 0.55 : 1;
  return {
    x: pose.x * distanceScale,
    y: pose.y * distanceScale,
    z: pose.z * distanceScale,
    rotateX: pose.rotateX * rotationScale,
    rotateY: pose.rotateY * rotationScale,
    rotateZ: pose.rotateZ * rotationScale,
    scale: compact ? 1 + (pose.scale - 1) * 0.55 : pose.scale,
  };
};

const readStoryElements = (): StoryElements | null => {
  const root = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
  if (!root) return null;

  const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-anime-story-scene]'));
  if (scenes.length === 0) return null;

  return {
    root,
    scenes,
    dots: Array.from(root.querySelectorAll<HTMLElement>('[data-story-progress-dot]')),
    readout: root.querySelector<HTMLElement>('[data-story-chapter-readout]'),
    progressLine: root.querySelector<HTMLElement>('[data-story-progress-line]'),
  };
};

const setSceneState = (scenes: HTMLElement[], activeIndex: number) => {
  scenes.forEach((scene, index) => {
    const active = index === activeIndex;
    scene.dataset.active = active ? 'true' : 'false';
    scene.setAttribute('aria-hidden', active ? 'false' : 'true');
    scene.inert = !active;
  });
};

export default function AnimeScrollDirector() {
  useEffect(() => {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const compactViewport = matchMedia('(max-width: 767px)');
    let observer: IntersectionObserver | undefined;
    let gsapContext: RevertibleContext | undefined;
    let refreshFrame = 0;
    let generation = 0;
    let initialized = false;
    let activeRoot: HTMLElement | undefined;
    let previousBodyScene: string | undefined;
    let bodySceneCaptured = false;

    const restoreBodyScene = () => {
      if (!bodySceneCaptured) return;
      if (previousBodyScene) document.body.dataset.animeScene = previousBodyScene;
      else delete document.body.dataset.animeScene;
      bodySceneCaptured = false;
    };

    const clearRoot = (root?: HTMLElement) => {
      if (!root) return;
      delete root.dataset.storyMode;
      delete root.dataset.storyMask;
      delete root.dataset.storySnap;
      delete root.dataset.storySnapState;
      delete root.dataset.storyInView;
      delete root.dataset.storyPerformance;
      delete root.dataset.storyChapter;
      delete root.dataset.storyCamera;
      root.style.removeProperty('--story-snap-strength');
    };

    const cleanup = () => {
      generation += 1;
      cancelAnimationFrame(refreshFrame);
      observer?.disconnect();
      observer = undefined;
      gsapContext?.revert();
      gsapContext = undefined;
      initialized = false;
      clearRoot(activeRoot);
      activeRoot = undefined;
      restoreBodyScene();
    };

    const setStaticMode = ({ root, scenes, dots, progressLine }: StoryElements) => {
      root.dataset.storyMode = 'static';
      root.dataset.storyMask = 'static';
      root.dataset.storyPerformance = 'transform-only';
      root.dataset.storyInView = 'true';
      root.dataset.storyChapter = '01';
      root.dataset.storyCamera = 'static';
      scenes.forEach((scene) => {
        scene.removeAttribute('aria-hidden');
        scene.inert = false;
        scene.dataset.active = 'true';
        scene.removeAttribute('style');
        scene
          .querySelectorAll<HTMLElement>(
            '[data-story-copy], [data-story-visual], [data-story-pop], [data-story-depth]',
          )
          .forEach((element) => element.removeAttribute('style'));
      });
      dots.forEach((dot) => (dot.dataset.active = 'true'));
      if (progressLine) progressLine.style.transform = 'scaleX(1)';
    };

    const initializeMotion = async (elements: StoryElements, token: number) => {
      if (initialized || reducedMotion.matches) return;
      initialized = true;

      const [gsapModule, triggerModule] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (token !== generation || reducedMotion.matches || !elements.root.isConnected) return;

      const gsap = gsapModule.gsap;
      const ScrollTrigger = triggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      const { root, scenes, dots, readout, progressLine } = elements;
      const compact = compactViewport.matches;
      const segment = 1.5;
      const storyDuration = segment * (scenes.length - 1) + 1;
      const activationDelay = compact ? 0.035 : 0.085;
      let activeIndex = -1;

      root.dataset.storyMode = 'motion';
      root.dataset.storyMask = 'active';
      root.dataset.storyPerformance = 'transform-only';
      root.dataset.storyCamera = 'multi-axis';
      root.dataset.storySnap = compact ? 'disabled-mobile' : 'labels-directional';
      root.dataset.storySnapState = 'ready';
      root.style.setProperty('--story-snap-strength', compact ? '0' : '1');

      const activate = (index: number) => {
        const nextIndex = Math.max(0, Math.min(scenes.length - 1, index));
        if (nextIndex === activeIndex) return;

        activeIndex = nextIndex;
        root.dataset.storyChapter = String(nextIndex + 1).padStart(2, '0');
        document.body.dataset.animeScene = scenes[nextIndex]?.dataset.storyScene ?? 'ice';
        setSceneState(scenes, nextIndex);
        dots.forEach((dot, dotIndex) => {
          dot.dataset.active = dotIndex === nextIndex ? 'true' : 'false';
        });
        if (readout) {
          readout.textContent = `${String(nextIndex + 1).padStart(2, '0')} / ${String(
            scenes.length,
          ).padStart(2, '0')}`;
        }
      };

      activate(0);
      const progressSetter = progressLine ? gsap.quickSetter(progressLine, 'scaleX') : null;
      const snap = compact
        ? undefined
        : {
            snapTo: 'labelsDirectional' as const,
            duration: { min: 0.18, max: 0.46 },
            delay: 0.08,
            ease: 'power3.inOut',
            inertia: false,
          };

      gsapContext = gsap.context(() => {
        scenes.forEach((scene, sceneIndex) => {
          const profile = SPATIAL_SCENE_PROFILES[sceneIndex % SPATIAL_SCENE_PROFILES.length]!;
          const sceneIn = resolvePose(profile.sceneIn, compact);
          const copyIn = resolvePose(profile.copyIn, compact);
          const visualIn = resolvePose(profile.visualIn, compact);
          const copy = scene.querySelector<HTMLElement>('[data-story-copy]');
          const visual = scene.querySelector<HTMLElement>('[data-story-visual]');
          const popElements = Array.from(scene.querySelectorAll<HTMLElement>('[data-story-pop]'));
          const active = sceneIndex === 0;

          gsap.set(scene, {
            autoAlpha: active ? 1 : 0,
            ...(active
              ? { x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 }
              : sceneIn),
            transformOrigin: '50% 50%',
            force3D: true,
          });

          if (copy) {
            gsap.set(copy, {
              autoAlpha: active ? 1 : 0,
              ...(active
                ? { x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 }
                : copyIn),
              transformOrigin: '50% 50%',
              force3D: true,
            });
          }

          if (visual) {
            gsap.set(visual, {
              autoAlpha: active ? 1 : 0,
              ...(active
                ? { x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 }
                : visualIn),
              transformOrigin: '50% 50%',
              force3D: true,
            });
          }

          popElements.forEach((element, popIndex) => {
            const angle =
              (popIndex / Math.max(popElements.length, 1)) * Math.PI * 2 + sceneIndex * 0.72;
            const radius = (compact ? 34 : 72) + popIndex * (compact ? 4 : 9);
            const depth = (compact ? -70 : -160) + (popIndex % 3) * (compact ? 26 : 58);
            gsap.set(element, {
              autoAlpha: active ? 1 : 0,
              x: active ? 0 : Math.cos(angle) * radius,
              y: active ? 0 : Math.sin(angle) * radius * 0.72,
              z: active ? 0 : depth,
              rotateX: active ? 0 : Math.sin(angle) * (compact ? 7 : 14),
              rotateY: active ? 0 : Math.cos(angle) * (compact ? 9 : 18),
              rotateZ: active ? 0 : (popIndex % 2 === 0 ? -1 : 1) * (compact ? 4 : 9),
              scale: active ? 1 : compact ? 0.93 : 0.84,
              transformOrigin: '50% 50%',
              force3D: true,
            });
          });
        });

        if (progressLine) {
          gsap.set(progressLine, { scaleX: 0, transformOrigin: 'left center', force3D: true });
        }

        const timeline = gsap.timeline({
          defaults: { ease: 'power4.out' },
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: () => `+=${Math.round(window.innerHeight * (compact ? 3.55 : 4.85))}`,
            scrub: compact ? 0.2 : 0.48,
            snap,
            pin: root,
            pinSpacing: true,
            anticipatePin: 1,
            fastScrollEnd: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              progressSetter?.(self.progress);
              const storyTime = self.progress * storyDuration;
              activate(Math.floor((storyTime - activationDelay + 0.001) / segment));
            },
          },
        });

        scenes.forEach((scene, sceneIndex) => {
          const at = sceneIndex * segment;
          const profile = SPATIAL_SCENE_PROFILES[sceneIndex % SPATIAL_SCENE_PROFILES.length]!;
          const sceneOut = resolvePose(profile.sceneOut, compact);
          const copyOut = resolvePose(profile.copyOut, compact);
          const visualOut = resolvePose(profile.visualOut, compact);
          const orbitScale = compact ? 0.55 : 1;
          const orbit = {
            x: profile.orbit.x * orbitScale,
            y: profile.orbit.y * orbitScale,
            z: profile.orbit.z * orbitScale,
            rotateX: profile.orbit.rotateX * orbitScale,
            rotateY: profile.orbit.rotateY * orbitScale,
            rotateZ: profile.orbit.rotateZ * orbitScale,
          };
          const copy = scene.querySelector<HTMLElement>('[data-story-copy]');
          const visual = scene.querySelector<HTMLElement>('[data-story-visual]');
          const popElements = scene.querySelectorAll<HTMLElement>('[data-story-pop]');
          const farLayers = compact
            ? []
            : Array.from(scene.querySelectorAll<HTMLElement>('[data-story-depth="far"]')).slice(
                0,
                3,
              );
          const midLayers = compact
            ? []
            : Array.from(scene.querySelectorAll<HTMLElement>('[data-story-depth="mid"]')).slice(
                0,
                3,
              );
          const nearLayers = compact
            ? []
            : Array.from(scene.querySelectorAll<HTMLElement>('[data-story-depth="near"]')).slice(
                0,
                3,
              );

          timeline.addLabel(`scene-${sceneIndex + 1}`, at);

          if (sceneIndex > 0) {
            timeline.to(
              scene,
              {
                autoAlpha: 1,
                x: 0,
                y: 0,
                z: 0,
                rotateX: 0,
                rotateY: 0,
                rotateZ: 0,
                scale: 1,
                duration: compact ? 0.5 : 0.68,
                ease: 'power4.out',
                force3D: true,
              },
              at,
            );
            if (copy) {
              timeline.to(
                copy,
                {
                  autoAlpha: 1,
                  x: 0,
                  y: 0,
                  z: 0,
                  rotateX: 0,
                  rotateY: 0,
                  rotateZ: 0,
                  scale: 1,
                  duration: compact ? 0.42 : 0.58,
                  ease: 'expo.out',
                  force3D: true,
                },
                at + 0.03,
              );
            }
            if (visual) {
              timeline.to(
                visual,
                {
                  autoAlpha: 1,
                  x: 0,
                  y: 0,
                  z: 0,
                  rotateX: 0,
                  rotateY: 0,
                  rotateZ: 0,
                  scale: 1,
                  duration: compact ? 0.52 : 0.72,
                  ease: compact ? 'power4.out' : 'back.out(1.08)',
                  force3D: true,
                },
                at + 0.01,
              );
            }
            if (popElements.length > 0) {
              timeline.to(
                popElements,
                {
                  autoAlpha: 1,
                  x: 0,
                  y: 0,
                  z: 0,
                  rotateX: 0,
                  rotateY: 0,
                  rotateZ: 0,
                  scale: 1,
                  duration: compact ? 0.4 : 0.58,
                  stagger: compact ? 0.016 : 0.032,
                  ease: compact ? 'power4.out' : 'back.out(1.12)',
                  force3D: true,
                },
                at + 0.06,
              );
            }
          }

          if (farLayers.length > 0) {
            timeline.fromTo(
              farLayers,
              {
                xPercent: orbit.x * -0.1,
                yPercent: orbit.y * -0.08,
                z: orbit.z * -1.2,
                rotateX: orbit.rotateX * -0.5,
                rotateY: orbit.rotateY * -0.5,
                scale: 0.985,
              },
              {
                xPercent: orbit.x * 0.1,
                yPercent: orbit.y * 0.08,
                z: orbit.z * 0.2,
                rotateX: orbit.rotateX * 0.5,
                rotateY: orbit.rotateY * 0.5,
                scale: 1.025,
                duration: 1.08,
                ease: 'none',
                force3D: true,
              },
              at,
            );
          }
          if (midLayers.length > 0) {
            timeline.fromTo(
              midLayers,
              {
                xPercent: orbit.x * -0.2,
                yPercent: orbit.y * -0.16,
                z: orbit.z * -0.45,
                rotateZ: orbit.rotateZ * -0.7,
                scale: 0.99,
              },
              {
                xPercent: orbit.x * 0.2,
                yPercent: orbit.y * 0.16,
                z: orbit.z * 0.35,
                rotateZ: orbit.rotateZ * 0.7,
                scale: 1.045,
                duration: 1.08,
                ease: 'none',
                force3D: true,
              },
              at,
            );
          }
          if (nearLayers.length > 0) {
            timeline.fromTo(
              nearLayers,
              {
                xPercent: orbit.x * -0.34,
                yPercent: orbit.y * -0.28,
                z: orbit.z * 0.2,
                rotateX: orbit.rotateX * -1.2,
                rotateY: orbit.rotateY * -1.2,
                scale: 1.01,
              },
              {
                xPercent: orbit.x * 0.34,
                yPercent: orbit.y * 0.28,
                z: orbit.z * 1.2,
                rotateX: orbit.rotateX * 1.2,
                rotateY: orbit.rotateY * 1.2,
                scale: 1.085,
                duration: 1.08,
                ease: 'none',
                force3D: true,
              },
              at,
            );
          }

          timeline.to(
            scene,
            {
              x: orbit.x * 0.22,
              y: orbit.y * 0.18,
              z: orbit.z * 0.12,
              rotateX: orbit.rotateX * 0.35,
              rotateY: orbit.rotateY * 0.35,
              rotateZ: orbit.rotateZ * 0.3,
              duration: 0.56,
              ease: 'none',
              force3D: true,
            },
            at + 0.42,
          );
          if (copy) {
            timeline.to(
              copy,
              {
                x: orbit.x * -0.34,
                y: orbit.y * 0.24,
                z: orbit.z * 0.18,
                rotateX: orbit.rotateX * -0.5,
                rotateY: orbit.rotateY * -0.45,
                rotateZ: orbit.rotateZ * -0.35,
                duration: 0.54,
                ease: 'none',
                force3D: true,
              },
              at + 0.45,
            );
          }
          if (visual) {
            timeline.to(
              visual,
              {
                x: orbit.x * 0.58,
                y: orbit.y * -0.38,
                z: orbit.z * 0.52,
                rotateX: orbit.rotateX * 0.8,
                rotateY: orbit.rotateY * 0.75,
                rotateZ: orbit.rotateZ * 0.6,
                duration: 0.56,
                ease: 'none',
                force3D: true,
              },
              at + 0.41,
            );
          }
          if (popElements.length > 0) {
            timeline.to(
              popElements,
              {
                x: (index: number) => Math.cos(index * 1.7 + sceneIndex) * (compact ? 12 : 30),
                y: (index: number) => Math.sin(index * 1.35 + sceneIndex) * (compact ? 9 : 22),
                z: (index: number) => ((index % 3) - 1) * (compact ? 24 : 64),
                rotateY: (index: number) => ((index % 2) * 2 - 1) * (compact ? 4 : 10),
                rotateZ: (index: number) => ((index % 3) - 1) * (compact ? 3 : 7),
                duration: 0.6,
                stagger: 0.012,
                ease: 'none',
                force3D: true,
              },
              at + 0.38,
            );
          }

          if (sceneIndex < scenes.length - 1) {
            if (copy) {
              timeline.to(
                copy,
                {
                  autoAlpha: 0,
                  ...copyOut,
                  duration: compact ? 0.34 : 0.46,
                  ease: 'power3.in',
                  force3D: true,
                },
                at + 1.02,
              );
            }
            if (visual) {
              timeline.to(
                visual,
                {
                  autoAlpha: 0,
                  ...visualOut,
                  duration: compact ? 0.4 : 0.54,
                  ease: 'power3.in',
                  force3D: true,
                },
                at + 1,
              );
            }
            timeline.to(
              scene,
              {
                autoAlpha: 0,
                ...sceneOut,
                duration: compact ? 0.44 : 0.58,
                ease: 'power3.in',
                force3D: true,
              },
              at + 1.01,
            );
          }
        });

        timeline.addLabel('story-end', storyDuration);
      }, root);

      refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    const setup = () => {
      cleanup();
      const elements = readStoryElements();
      if (!elements) return;

      const token = generation;
      activeRoot = elements.root;
      previousBodyScene = document.body.dataset.animeScene;
      bodySceneCaptured = true;
      elements.root.dataset.storyPerformance = 'transform-only';

      if (reducedMotion.matches) {
        setStaticMode(elements);
        return;
      }

      setSceneState(elements.scenes, 0);
      elements.root.dataset.storyChapter = '01';
      elements.dots.forEach((dot, index) => {
        dot.dataset.active = index === 0 ? 'true' : 'false';
      });
      if (elements.readout) {
        elements.readout.textContent = `01 / ${String(elements.scenes.length).padStart(2, '0')}`;
      }
      document.body.dataset.animeScene = elements.scenes[0]?.dataset.storyScene ?? 'ice';

      elements.root.dataset.storyMode = 'booting';
      elements.root.dataset.storyMask = 'active';
      elements.root.dataset.storyInView = 'false';

      if (!('IntersectionObserver' in window)) {
        void initializeMotion(elements, token);
        return;
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          elements.root.dataset.storyInView = entry.isIntersecting ? 'true' : 'false';
          if (entry.isIntersecting) void initializeMotion(elements, token);
        },
        { root: null, rootMargin: '110% 0px 110% 0px', threshold: 0 },
      );
      observer.observe(elements.root);
    };

    const onEnvironmentChange = () => setup();

    setup();
    document.addEventListener('astro:page-load', setup);
    reducedMotion.addEventListener('change', onEnvironmentChange);
    compactViewport.addEventListener('change', onEnvironmentChange);

    return () => {
      cleanup();
      document.removeEventListener('astro:page-load', setup);
      reducedMotion.removeEventListener('change', onEnvironmentChange);
      compactViewport.removeEventListener('change', onEnvironmentChange);
    };
  }, []);

  return null;
}
