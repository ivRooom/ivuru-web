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

    const cleanup = () => {
      cancelAnimationFrame(refreshFrame);
      removePointer?.();
      removePointer = undefined;
      gsapContext?.revert();
      gsapContext = undefined;
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

      root.style.setProperty('--story-pointer-x', '0px');
      root.style.setProperty('--story-pointer-y', '0px');
      root.style.setProperty('--story-progress', '0');

      let activeIndex = -1;
      const activate = (index: number) => {
        const nextIndex = Math.max(0, Math.min(scenes.length - 1, index));
        if (nextIndex === activeIndex) return;

        activeIndex = nextIndex;
        root.dataset.storyChapter = String(nextIndex + 1).padStart(2, '0');
        document.body.dataset.animeScene = scenes[nextIndex]?.dataset.animeScene ?? 'ice';
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

      root.dataset.storyMode = 'motion';
      activate(0);

      gsapContext = gsap.context(() => {
        gsap.set(scenes, {
          autoAlpha: 0,
          scale: 0.72,
          z: -680,
          filter: 'blur(24px)',
          transformOrigin: '50% 50%',
        });
        gsap.set(scenes[0], { autoAlpha: 1, scale: 1, z: 0, filter: 'blur(0px)' });

        scenes.forEach((scene, sceneIndex) => {
          const copy = scene.querySelector<HTMLElement>('[data-story-copy]');
          const visual = scene.querySelector<HTMLElement>('[data-story-visual]');
          const popElements = Array.from(scene.querySelectorAll<HTMLElement>('[data-story-pop]'));

          if (sceneIndex === 0) {
            if (copy) gsap.set(copy, { opacity: 1, y: 0, z: 0 });
            if (visual) gsap.set(visual, { opacity: 1, y: 0, z: 0, rotateY: 0 });
          } else {
            if (copy) gsap.set(copy, { opacity: 0, y: 80, z: -120 });
            if (visual) gsap.set(visual, { opacity: 0, y: 50, z: -360, rotateY: -16 });
          }

          popElements.forEach((element, popIndex) => {
            const direction = popIndex % 2 === 0 ? -1 : 1;
            gsap.set(element, {
              opacity: sceneIndex === 0 ? 1 : 0,
              x: sceneIndex === 0 ? 0 : direction * (120 + popIndex * 28),
              y: sceneIndex === 0 ? 0 : ((popIndex % 3) - 1) * 78,
              z: sceneIndex === 0 ? 0 : -260 - popIndex * 34,
              rotate: sceneIndex === 0 ? 0 : direction * (8 + popIndex * 2),
              scale: sceneIndex === 0 ? 1 : 0.72,
            });
          });
        });

        const segment = 1.55;
        const storyDuration = segment * (scenes.length - 1) + 1.18;
        const timeline = gsap.timeline({
          defaults: { ease: 'power3.inOut' },
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: () =>
              `+=${Math.round(window.innerHeight * (window.innerWidth < 768 ? 3.5 : 4.4))}`,
            scrub: window.innerWidth < 768 ? 0.58 : 0.82,
            pin: stage,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              root.style.setProperty('--story-progress', self.progress.toFixed(4));
              const storyTime = self.progress * storyDuration;
              activate(Math.floor((storyTime + 0.001) / segment));
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
                duration: 0.58,
              },
              at,
            );
            if (copy) {
              timeline.to(copy, { opacity: 1, y: 0, z: 0, duration: 0.52 }, at + 0.08);
            }
            if (visual) {
              timeline.to(
                visual,
                { opacity: 1, y: 0, z: 0, rotateY: 0, duration: 0.72, ease: 'back.out(1.3)' },
                at + 0.03,
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
                  scale: 1,
                  duration: 0.62,
                  stagger: 0.045,
                  ease: 'back.out(1.55)',
                },
                at + 0.08,
              );
            }
          }

          if (depthLayers.length > 0) {
            timeline.fromTo(
              depthLayers,
              { yPercent: 5, scale: 1.02 },
              { yPercent: -5, scale: 1.1, duration: 1.18, ease: 'none' },
              at,
            );
          }

          if (sceneIndex < scenes.length - 1) {
            if (copy) {
              timeline.to(
                copy,
                { opacity: 0, y: -92, z: 180, duration: 0.42, ease: 'power2.in' },
                at + 1.03,
              );
            }
            if (visual) {
              timeline.to(
                visual,
                { opacity: 0, y: -36, z: 520, scale: 1.18, duration: 0.52, ease: 'power2.in' },
                at + 1.01,
              );
            }
            timeline.to(
              scene,
              {
                autoAlpha: 0,
                scale: 1.18,
                z: 520,
                filter: 'blur(20px)',
                duration: 0.58,
              },
              at + 1.02,
            );
          }
        });
      }, root);

      if (finePointer.matches) {
        let pointerFrame = 0;
        let pointerX = 0;
        let pointerY = 0;
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
