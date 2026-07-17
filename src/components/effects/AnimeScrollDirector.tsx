import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
    gsap.registerPlugin(ScrollTrigger);

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    let gsapContext: ReturnType<typeof gsap.context> | undefined;
    let refreshFrame = 0;
    let removePointer: (() => void) | undefined;
    let bodySceneBeforeStory: string | undefined;
    let bodySceneCaptured = false;
    let activeRoot: HTMLElement | undefined;

    const restoreBodyScene = () => {
      if (!bodySceneCaptured) return;
      if (bodySceneBeforeStory) document.body.dataset.animeScene = bodySceneBeforeStory;
      else delete document.body.dataset.animeScene;
      bodySceneCaptured = false;
    };

    const cleanup = () => {
      cancelAnimationFrame(refreshFrame);
      removePointer?.();
      removePointer = undefined;
      gsapContext?.revert();
      gsapContext = undefined;
      if (activeRoot) {
        delete activeRoot.dataset.storySnap;
        delete activeRoot.dataset.storyMask;
        delete activeRoot.dataset.storySnapState;
        activeRoot.style.removeProperty('--story-snap-strength');
      }
      activeRoot = undefined;
      restoreBodyScene();
    };

    const setup = () => {
      cleanup();

      const root = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
      const stage = root?.querySelector<HTMLElement>('[data-anime-scroll-stage]');
      const scenes = root
        ? Array.from(root.querySelectorAll<HTMLElement>('[data-anime-story-scene]'))
        : [];
      const dots = root
        ? Array.from(root.querySelectorAll<HTMLElement>('[data-story-progress-dot]'))
        : [];
      const readout = root?.querySelector<HTMLElement>('[data-story-chapter-readout]');

      if (!root || !stage || scenes.length === 0) return;

      activeRoot = root;
      bodySceneBeforeStory = document.body.dataset.animeScene;
      bodySceneCaptured = true;
      delete root.dataset.cinematicPointer;
      root.style.setProperty('--story-pointer-x', '0px');
      root.style.setProperty('--story-pointer-y', '0px');
      root.style.setProperty('--story-progress', '0');

      let activeIndex = -1;
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

      if (reducedMotion.matches) {
        root.dataset.storyMode = 'static';
        root.dataset.storyMask = 'static';
        scenes.forEach((scene) => {
          scene.removeAttribute('aria-hidden');
          scene.inert = false;
          scene.dataset.active = 'true';
          gsap.set(scene, { clearProps: 'all' });
          gsap.set(
            scene.querySelectorAll('[data-story-copy], [data-story-visual], [data-story-pop]'),
            { clearProps: 'all' },
          );
        });
        dots.forEach((dot) => (dot.dataset.active = 'true'));
        return;
      }

      const compactMotion = window.innerWidth < 768;
      const entryDepth = compactMotion ? -360 : -680;
      const entryScale = compactMotion ? 0.84 : 0.72;
      const entryBlur = compactMotion ? 12 : 24;
      const visualDepth = compactMotion ? -220 : -420;
      const exitDepth = compactMotion ? 300 : 620;
      const exitBlur = compactMotion ? 10 : 22;

      root.dataset.storyMode = 'motion';
      root.dataset.storySnap = 'labels-directional';
      root.dataset.storyMask = 'active';
      root.dataset.storySnapState = 'ready';
      root.style.setProperty('--story-snap-strength', compactMotion ? '0.72' : '1');
      activate(0);

      gsapContext = gsap.context(() => {
        gsap.set(scenes, {
          autoAlpha: 0,
          scale: entryScale,
          z: entryDepth,
          filter: `blur(${entryBlur}px)`,
          clipPath: 'circle(0% at 62% 50%)',
          transformOrigin: '50% 50%',
        });
        gsap.set(scenes[0], {
          autoAlpha: 1,
          scale: 1,
          z: 0,
          filter: 'blur(0px)',
          clipPath: 'circle(150% at 62% 50%)',
        });

        scenes.forEach((scene, sceneIndex) => {
          const copy = scene.querySelector<HTMLElement>('[data-story-copy]');
          const visual = scene.querySelector<HTMLElement>('[data-story-visual]');
          const popElements = Array.from(scene.querySelectorAll<HTMLElement>('[data-story-pop]'));

          if (sceneIndex === 0) {
            if (copy) {
              gsap.set(copy, {
                opacity: 1,
                y: 0,
                z: 0,
                clipPath: 'inset(0% 0% 0% 0% round 0px)',
              });
            }
            if (visual) {
              gsap.set(visual, {
                opacity: 1,
                y: 0,
                z: 0,
                rotateY: 0,
                clipPath: 'circle(90% at 50% 50%)',
              });
            }
          } else {
            if (copy) {
              gsap.set(copy, {
                opacity: 0,
                y: compactMotion ? 54 : 86,
                z: compactMotion ? -80 : -150,
                clipPath: 'inset(0% 0% 100% 0% round 32px)',
              });
            }
            if (visual) {
              gsap.set(visual, {
                opacity: 0,
                y: compactMotion ? 34 : 58,
                z: visualDepth,
                rotateY: compactMotion ? -8 : -18,
                clipPath: 'circle(0% at 50% 50%)',
              });
            }
          }

          popElements.forEach((element, popIndex) => {
            const direction = popIndex % 2 === 0 ? -1 : 1;
            gsap.set(element, {
              opacity: sceneIndex === 0 ? 1 : 0,
              x: sceneIndex === 0 ? 0 : direction * (compactMotion ? 68 : 126 + popIndex * 30),
              y: sceneIndex === 0 ? 0 : ((popIndex % 3) - 1) * (compactMotion ? 42 : 82),
              z: sceneIndex === 0 ? 0 : -(compactMotion ? 150 : 280 + popIndex * 38),
              rotate: sceneIndex === 0 ? 0 : direction * (compactMotion ? 5 : 9 + popIndex * 2),
              rotateX: sceneIndex === 0 ? 0 : compactMotion ? 5 : 12,
              scale: sceneIndex === 0 ? 1 : compactMotion ? 0.82 : 0.7,
            });
          });
        });

        const segment = 1.55;
        const storyDuration = segment * (scenes.length - 1) + 1.18;
        const activationDelay = compactMotion ? 0.04 : 0.1;
        const timeline = gsap.timeline({
          defaults: { ease: 'power3.inOut' },
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: () =>
              `+=${Math.round(window.innerHeight * (window.innerWidth < 768 ? 3.5 : 4.4))}`,
            scrub: compactMotion ? 0.52 : 0.78,
            snap: {
              snapTo: 'labelsDirectional',
              duration: compactMotion ? { min: 0.18, max: 0.44 } : { min: 0.24, max: 0.62 },
              delay: compactMotion ? 0.06 : 0.1,
              ease: 'power2.inOut',
              inertia: false,
            },
            pin: root,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              root.style.setProperty('--story-progress', self.progress.toFixed(4));
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
          const depthLayers = scene.querySelectorAll<HTMLElement>('[data-story-depth]');

          timeline.addLabel(`scene-${sceneIndex + 1}`, at);

          if (sceneIndex > 0) {
            timeline.to(
              scene,
              {
                autoAlpha: 1,
                scale: 1,
                z: 0,
                filter: 'blur(0px)',
                clipPath: 'circle(150% at 62% 50%)',
                duration: compactMotion ? 0.46 : 0.62,
              },
              at,
            );
            if (copy) {
              timeline.to(
                copy,
                {
                  opacity: 1,
                  y: 0,
                  z: 0,
                  clipPath: 'inset(0% 0% 0% 0% round 0px)',
                  duration: compactMotion ? 0.42 : 0.56,
                },
                at + 0.05,
              );
            }
            if (visual) {
              timeline.to(
                visual,
                {
                  opacity: 1,
                  y: 0,
                  z: 0,
                  rotateY: 0,
                  clipPath: 'circle(90% at 50% 50%)',
                  duration: compactMotion ? 0.56 : 0.76,
                  ease: compactMotion ? 'power3.out' : 'back.out(1.25)',
                },
                at + 0.02,
              );
            }
            if (popElements.length > 0) {
              timeline.to(
                popElements,
                {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  z: 0,
                  rotate: 0,
                  rotateX: 0,
                  scale: 1,
                  duration: compactMotion ? 0.48 : 0.66,
                  stagger: compactMotion ? 0.025 : 0.05,
                  ease: compactMotion ? 'power3.out' : 'back.out(1.5)',
                },
                at + 0.08,
              );
            }
          }

          if (depthLayers.length > 0) {
            timeline.fromTo(
              depthLayers,
              { yPercent: compactMotion ? 2 : 5, scale: 1.015 },
              {
                yPercent: compactMotion ? -2 : -6,
                scale: compactMotion ? 1.045 : 1.12,
                duration: 1.18,
                ease: 'none',
              },
              at,
            );
          }

          if (sceneIndex < scenes.length - 1) {
            if (copy) {
              timeline.to(
                copy,
                {
                  opacity: 0,
                  y: compactMotion ? -58 : -96,
                  z: compactMotion ? 120 : 220,
                  clipPath: 'inset(0% 0% 100% 0% round 24px)',
                  duration: compactMotion ? 0.34 : 0.44,
                  ease: 'power2.in',
                },
                at + 1.03,
              );
            }
            if (visual) {
              timeline.to(
                visual,
                {
                  opacity: 0,
                  y: compactMotion ? -24 : -40,
                  z: exitDepth,
                  scale: compactMotion ? 1.1 : 1.22,
                  clipPath: 'circle(120% at 50% 50%)',
                  duration: compactMotion ? 0.42 : 0.54,
                  ease: 'power2.in',
                },
                at + 1.01,
              );
            }
            timeline.to(
              scene,
              {
                autoAlpha: 0,
                scale: compactMotion ? 1.1 : 1.2,
                z: exitDepth,
                filter: `blur(${exitBlur}px)`,
                duration: compactMotion ? 0.48 : 0.6,
              },
              at + 1.02,
            );
          }
        });

        timeline.addLabel('story-end', storyDuration);
      }, root);

      if (finePointer.matches) {
        let pointerFrame = 0;
        let pointerX = 0;
        let pointerY = 0;
        root.dataset.cinematicPointer = 'active';

        const renderPointer = () => {
          pointerFrame = 0;
          root.style.setProperty('--story-pointer-x', `${(pointerX * 14).toFixed(2)}px`);
          root.style.setProperty('--story-pointer-y', `${(pointerY * 10).toFixed(2)}px`);
        };
        const onPointerMove = (event: PointerEvent) => {
          const rect = stage.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
          pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
          if (!pointerFrame) pointerFrame = requestAnimationFrame(renderPointer);
        };
        const onPointerLeave = () => {
          pointerX = 0;
          pointerY = 0;
          if (!pointerFrame) pointerFrame = requestAnimationFrame(renderPointer);
        };
        stage.addEventListener('pointermove', onPointerMove, { passive: true });
        stage.addEventListener('pointerleave', onPointerLeave, { passive: true });
        removePointer = () => {
          cancelAnimationFrame(pointerFrame);
          stage.removeEventListener('pointermove', onPointerMove);
          stage.removeEventListener('pointerleave', onPointerLeave);
          delete root.dataset.cinematicPointer;
        };
      }

      refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    const onPageLoad = () => setup();
    const onEnvironmentChange = () => setup();

    setup();
    document.addEventListener('astro:page-load', onPageLoad);
    reducedMotion.addEventListener('change', onEnvironmentChange);
    finePointer.addEventListener('change', onEnvironmentChange);

    return () => {
      cleanup();
      document.removeEventListener('astro:page-load', onPageLoad);
      reducedMotion.removeEventListener('change', onEnvironmentChange);
      finePointer.removeEventListener('change', onEnvironmentChange);
    };
  }, []);

  return null;
}
