import { useEffect } from 'react';

type RevertibleContext = { revert: () => void };

type StoryElements = {
  root: HTMLElement;
  scenes: HTMLElement[];
  dots: HTMLElement[];
  readout: HTMLElement | null;
  progressLine: HTMLElement | null;
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
      const entryDepth = compact ? -130 : -260;
      const exitDepth = compact ? 150 : 320;
      let activeIndex = -1;

      root.dataset.storyMode = 'motion';
      root.dataset.storyMask = 'active';
      root.dataset.storyPerformance = 'transform-only';
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
        gsap.set(scenes, {
          autoAlpha: 0,
          scale: compact ? 0.94 : 0.89,
          z: entryDepth,
          transformOrigin: '50% 50%',
          force3D: true,
        });
        gsap.set(scenes[0], { autoAlpha: 1, scale: 1, z: 0, force3D: true });
        if (progressLine) {
          gsap.set(progressLine, { scaleX: 0, transformOrigin: 'left center', force3D: true });
        }

        scenes.forEach((scene, sceneIndex) => {
          const copy = scene.querySelector<HTMLElement>('[data-story-copy]');
          const visual = scene.querySelector<HTMLElement>('[data-story-visual]');
          const popElements = Array.from(scene.querySelectorAll<HTMLElement>('[data-story-pop]'));

          if (copy) {
            gsap.set(copy, {
              autoAlpha: sceneIndex === 0 ? 1 : 0,
              y: sceneIndex === 0 ? 0 : compact ? 38 : 66,
              z: sceneIndex === 0 ? 0 : compact ? -35 : -90,
              scale: sceneIndex === 0 ? 1 : 0.98,
              force3D: true,
            });
          }
          if (visual) {
            gsap.set(visual, {
              autoAlpha: sceneIndex === 0 ? 1 : 0,
              y: sceneIndex === 0 ? 0 : compact ? 30 : 52,
              z: sceneIndex === 0 ? 0 : entryDepth,
              scale: sceneIndex === 0 ? 1 : compact ? 0.95 : 0.9,
              rotateY: sceneIndex === 0 ? 0 : compact ? -4 : -9,
              force3D: true,
            });
          }
          popElements.forEach((element, popIndex) => {
            const direction = popIndex % 2 === 0 ? -1 : 1;
            gsap.set(element, {
              autoAlpha: sceneIndex === 0 ? 1 : 0,
              x: sceneIndex === 0 ? 0 : direction * (compact ? 30 : 64 + popIndex * 10),
              y: sceneIndex === 0 ? 0 : ((popIndex % 3) - 1) * (compact ? 18 : 34),
              z: sceneIndex === 0 ? 0 : compact ? -55 : -120,
              scale: sceneIndex === 0 ? 1 : compact ? 0.92 : 0.86,
              force3D: true,
            });
          });
        });

        const timeline = gsap.timeline({
          defaults: { ease: 'power4.out' },
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: () => `+=${Math.round(window.innerHeight * (compact ? 3.15 : 4.05))}`,
            scrub: compact ? 0.16 : 0.36,
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
          const copy = scene.querySelector<HTMLElement>('[data-story-copy]');
          const visual = scene.querySelector<HTMLElement>('[data-story-visual]');
          const popElements = scene.querySelectorAll<HTMLElement>('[data-story-pop]');
          const farLayers = compact
            ? []
            : Array.from(scene.querySelectorAll<HTMLElement>('[data-story-depth="far"]')).slice(
                0,
                2,
              );
          const nearLayers = compact
            ? []
            : Array.from(scene.querySelectorAll<HTMLElement>('[data-story-depth="near"]')).slice(
                0,
                2,
              );

          timeline.addLabel(`scene-${sceneIndex + 1}`, at);

          if (sceneIndex > 0) {
            timeline.to(
              scene,
              { autoAlpha: 1, scale: 1, z: 0, duration: compact ? 0.42 : 0.58, force3D: true },
              at,
            );
            if (copy) {
              timeline.to(
                copy,
                {
                  autoAlpha: 1,
                  y: 0,
                  z: 0,
                  scale: 1,
                  duration: compact ? 0.36 : 0.5,
                  ease: 'expo.out',
                  force3D: true,
                },
                at + 0.04,
              );
            }
            if (visual) {
              timeline.to(
                visual,
                {
                  autoAlpha: 1,
                  y: 0,
                  z: 0,
                  scale: 1,
                  rotateY: 0,
                  duration: compact ? 0.46 : 0.64,
                  ease: compact ? 'power4.out' : 'back.out(1.12)',
                  force3D: true,
                },
                at + 0.02,
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
                  scale: 1,
                  duration: compact ? 0.34 : 0.5,
                  stagger: compact ? 0.018 : 0.035,
                  ease: compact ? 'power4.out' : 'back.out(1.16)',
                  force3D: true,
                },
                at + 0.07,
              );
            }
          }

          if (farLayers.length > 0) {
            timeline.fromTo(
              farLayers,
              { yPercent: 2, scale: 1.01 },
              { yPercent: -2, scale: 1.04, duration: 1.08, ease: 'none', force3D: true },
              at,
            );
          }
          if (nearLayers.length > 0) {
            timeline.fromTo(
              nearLayers,
              { yPercent: 4, scale: 1.015 },
              { yPercent: -4, scale: 1.065, duration: 1.08, ease: 'none', force3D: true },
              at,
            );
          }

          if (sceneIndex < scenes.length - 1) {
            if (copy) {
              timeline.to(
                copy,
                {
                  autoAlpha: 0,
                  y: compact ? -34 : -58,
                  z: compact ? 65 : 130,
                  scale: 1.015,
                  duration: compact ? 0.28 : 0.38,
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
                  y: compact ? -18 : -30,
                  z: exitDepth,
                  scale: compact ? 1.07 : 1.14,
                  duration: compact ? 0.34 : 0.46,
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
                scale: compact ? 1.06 : 1.12,
                z: exitDepth,
                duration: compact ? 0.38 : 0.5,
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
