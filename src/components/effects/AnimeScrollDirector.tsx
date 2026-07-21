import { useEffect } from 'react';

type RevertibleContext = { revert: () => void };

type StoryElements = {
  root: HTMLElement;
  stage: HTMLElement;
  scenes: HTMLElement[];
  dots: HTMLElement[];
  readout: HTMLElement | null;
  progressLine: HTMLElement | null;
};

type GateElements = {
  root: HTMLElement;
  backdrop: HTMLElement;
  iris: HTMLElement;
  rings: HTMLElement[];
  blades: HTMLElement[];
  rays: HTMLElement[];
  shards: HTMLElement[];
  shutterLeft: HTMLElement;
  shutterRight: HTMLElement;
  flash: HTMLElement;
  number: HTMLElement;
  title: HTMLElement;
};

const CHAPTER_SEGMENT = 2.4;
const CHAPTER_HOLD = 1.04;
const GATE_DURATION = 1.36;
const GATE_SWITCH = CHAPTER_HOLD + 0.68;
const GATE_BLADE_COUNT = 12;
const GATE_RAY_COUNT = 18;
const GATE_SHARD_COUNT = 10;

const readStoryElements = (): StoryElements | null => {
  const root = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
  const stage = root?.querySelector<HTMLElement>('[data-anime-scroll-stage]');
  if (!root || !stage) return null;

  const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-anime-story-scene]'));
  if (scenes.length !== 3) return null;

  return {
    root,
    stage,
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
    scene.toggleAttribute('inert', !active);
  });
};

const createGate = (stage: HTMLElement): GateElements => {
  const gate = document.createElement('div');
  gate.className = 'anime-chapter-gate';
  gate.setAttribute('data-chapter-gate', 'true');
  gate.setAttribute('aria-hidden', 'true');
  gate.innerHTML = `
    <span class="anime-chapter-gate__backdrop" data-gate-backdrop></span>
    <span class="anime-chapter-gate__grid"></span>
    <div class="anime-chapter-gate__rays" data-gate-rays></div>
    <div class="anime-chapter-gate__shards" data-gate-shards></div>
    <div class="anime-chapter-gate__iris" data-gate-iris>
      <span class="anime-chapter-gate__core"></span>
      <div class="anime-chapter-gate__rings" data-gate-rings></div>
      <div class="anime-chapter-gate__blades" data-gate-blades></div>
    </div>
    <span class="anime-chapter-gate__shutter anime-chapter-gate__shutter--left" data-gate-shutter-left></span>
    <span class="anime-chapter-gate__shutter anime-chapter-gate__shutter--right" data-gate-shutter-right></span>
    <span class="anime-chapter-gate__flash" data-gate-flash></span>
    <div class="anime-chapter-gate__copy">
      <small data-gate-title>WORLD FORGE / BUILD</small>
      <strong data-gate-number>02</strong>
    </div>
  `;

  const rings = gate.querySelector<HTMLElement>('[data-gate-rings]');
  const blades = gate.querySelector<HTMLElement>('[data-gate-blades]');
  const rays = gate.querySelector<HTMLElement>('[data-gate-rays]');
  const shards = gate.querySelector<HTMLElement>('[data-gate-shards]');
  if (!rings || !blades || !rays || !shards) {
    throw new Error('Chapter gate structure is incomplete');
  }

  rings.innerHTML = Array.from(
    { length: 5 },
    (_, index) => `<i style="--gate-index:${index}"></i>`,
  ).join('');
  blades.innerHTML = Array.from(
    { length: GATE_BLADE_COUNT },
    (_, index) => `<i style="--gate-index:${index}"></i>`,
  ).join('');
  rays.innerHTML = Array.from(
    { length: GATE_RAY_COUNT },
    (_, index) => `<i style="--gate-index:${index};--gate-thickness:${(index % 3) + 1}px"></i>`,
  ).join('');
  shards.innerHTML = Array.from(
    { length: GATE_SHARD_COUNT },
    (_, index) => `<i style="--gate-index:${index}"></i>`,
  ).join('');
  stage.append(gate);

  const required = <T extends HTMLElement>(selector: string) => {
    const node = gate.querySelector<T>(selector);
    if (!node) throw new Error(`Missing chapter gate node: ${selector}`);
    return node;
  };

  return {
    root: gate,
    backdrop: required('[data-gate-backdrop]'),
    iris: required('[data-gate-iris]'),
    rings: Array.from(gate.querySelectorAll<HTMLElement>('[data-gate-rings] > i')),
    blades: Array.from(gate.querySelectorAll<HTMLElement>('[data-gate-blades] > i')),
    rays: Array.from(gate.querySelectorAll<HTMLElement>('[data-gate-rays] > i')),
    shards: Array.from(gate.querySelectorAll<HTMLElement>('[data-gate-shards] > i')),
    shutterLeft: required('[data-gate-shutter-left]'),
    shutterRight: required('[data-gate-shutter-right]'),
    flash: required('[data-gate-flash]'),
    number: required('[data-gate-number]'),
    title: required('[data-gate-title]'),
  };
};

const chapterIndexAt = (storyTime: number, sceneCount: number) => {
  for (let index = sceneCount - 2; index >= 0; index -= 1) {
    if (storyTime >= index * CHAPTER_SEGMENT + GATE_SWITCH) return index + 1;
  }
  return 0;
};

const transitionStateAt = (storyTime: number, sceneCount: number) => {
  for (let index = 0; index < sceneCount - 1; index += 1) {
    const start = index * CHAPTER_SEGMENT + CHAPTER_HOLD;
    const local = storyTime - start;
    if (local < 0 || local > GATE_DURATION) continue;

    const ratio = local / GATE_DURATION;
    let phase = 'charge';
    if (ratio >= 0.72) phase = 'reveal';
    else if (ratio >= 0.5) phase = 'burst';
    else if (ratio >= 0.28) phase = 'collapse';
    return { index, ratio, phase };
  }
  return null;
};

export default function AnimeScrollDirector() {
  useEffect(() => {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const compactViewport = matchMedia('(max-width: 767px)');
    let observer: IntersectionObserver | undefined;
    let context: RevertibleContext | undefined;
    let refreshFrame = 0;
    let generation = 0;
    let initialized = false;
    let activeRoot: HTMLElement | undefined;
    let gate: GateElements | undefined;
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
      delete root.dataset.storyTransitionEngine;
      delete root.dataset.storyTransition;
      delete root.dataset.storyTransitionPhase;
      delete root.dataset.storyAxis;
      delete root.dataset.storyDirector;
      root.style.removeProperty('--chapter-gate-progress');
    };

    const cleanup = () => {
      generation += 1;
      cancelAnimationFrame(refreshFrame);
      observer?.disconnect();
      observer = undefined;
      context?.revert();
      context = undefined;
      gate?.root.remove();
      gate = undefined;
      initialized = false;
      clearRoot(activeRoot);
      activeRoot = undefined;
      restoreBodyScene();
    };

    const setStaticMode = ({ root, scenes, dots, progressLine }: StoryElements) => {
      root.dataset.storyDirector = 'ready';
      root.dataset.storyMode = 'static';
      root.dataset.storyMask = 'static';
      root.dataset.storyPerformance = 'static';
      root.dataset.storyInView = 'true';
      root.dataset.storyChapter = '01';
      root.dataset.storyCamera = 'static';
      root.dataset.storyTransitionEngine = 'static';
      root.dataset.storyAxis = 'portal-forward';
      scenes.forEach((scene) => {
        scene.removeAttribute('aria-hidden');
        scene.removeAttribute('inert');
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

      const { root, stage, scenes, dots, readout, progressLine } = elements;
      const compact = compactViewport.matches;
      const storyDuration = CHAPTER_SEGMENT * (scenes.length - 1) + 1.2;
      const scrollLength = () => `+=${Math.round(innerHeight * (compact ? 5.7 : 7.2))}`;
      let activeIndex = -1;
      let activeTransition = '';

      root.dataset.storyDirector = 'ready';
      root.dataset.storyMode = 'motion';
      root.dataset.storyMask = 'active';
      root.dataset.storyPerformance = 'composited-world-forge';
      root.dataset.storyCamera = 'multi-axis';
      root.dataset.storyTransitionEngine = 'world-forge';
      root.dataset.storyAxis = 'portal-forward';
      root.dataset.storySnap = compact ? 'disabled-mobile' : 'labels-directional';
      root.dataset.storySnapState = 'ready';
      const chapterGate = createGate(stage);
      gate = chapterGate;

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
        if (readout) readout.textContent = `${String(nextIndex + 1).padStart(2, '0')} / 03`;
      };

      const updateState = (storyTime: number) => {
        activate(chapterIndexAt(storyTime, scenes.length));
        const transition = transitionStateAt(storyTime, scenes.length);
        if (!transition) {
          if (activeTransition) {
            delete root.dataset.storyTransition;
            delete root.dataset.storyTransitionPhase;
            root.style.setProperty('--chapter-gate-progress', '0');
            activeTransition = '';
          }
          return;
        }

        const transitionKey = `${String(transition.index + 1).padStart(2, '0')}-${String(
          transition.index + 2,
        ).padStart(2, '0')}`;
        activeTransition = transitionKey;
        root.dataset.storyTransition = transitionKey;
        root.dataset.storyTransitionPhase = transition.phase;
        root.style.setProperty('--chapter-gate-progress', transition.ratio.toFixed(4));
        chapterGate.number.textContent = String(transition.index + 2).padStart(2, '0');
        chapterGate.title.textContent =
          transition.index === 0 ? 'WORLD FORGE / BUILD' : 'NEXUS LINK / CONNECT';
      };

      activate(0);
      const progressSetter = progressLine ? gsap.quickSetter(progressLine, 'scaleX') : null;

      context = gsap.context(() => {
        const timeline = gsap.timeline({
          defaults: { ease: 'power3.inOut' },
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: scrollLength,
            pin: root,
            scrub: compact ? 0.14 : 0.28,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            snap: compact
              ? undefined
              : {
                  snapTo: 'labelsDirectional',
                  duration: { min: 0.18, max: 0.44 },
                  delay: 0.08,
                  ease: 'power3.inOut',
                  inertia: false,
                },
            onUpdate: (self) => {
              const storyTime = self.progress * storyDuration;
              updateState(storyTime);
              progressSetter?.(self.progress);
            },
          },
        });

        scenes.forEach((scene, index) => {
          gsap.set(scene, {
            autoAlpha: index === 0 ? 1 : 0,
            z: index === 0 ? 0 : -720,
            scale: index === 0 ? 1 : 0.72,
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            transformOrigin: '50% 50%',
            force3D: true,
          });
          timeline.addLabel(
            `chapter-${String(index + 1).padStart(2, '0')}`,
            index * CHAPTER_SEGMENT,
          );
        });

        gsap.set(chapterGate.root, { autoAlpha: 0, force3D: true });
        gsap.set(
          [chapterGate.flash, chapterGate.backdrop, ...chapterGate.rays, ...chapterGate.shards],
          { autoAlpha: 0 },
        );
        gsap.set([chapterGate.shutterLeft, chapterGate.shutterRight], {
          xPercent: 0,
        });

        scenes.slice(0, -1).forEach((scene, index) => {
          const nextScene = scenes[index + 1]!;
          const start = index * CHAPTER_SEGMENT + CHAPTER_HOLD;

          timeline.set(
            chapterGate.number,
            { textContent: String(index + 2).padStart(2, '0') },
            start,
          );
          timeline.set(
            chapterGate.title,
            {
              textContent: index === 0 ? 'WORLD FORGE / BUILD' : 'NEXUS LINK / CONNECT',
            },
            start,
          );
          timeline.to(chapterGate.root, { autoAlpha: 1, duration: 0.12 }, start);
          timeline.fromTo(
            chapterGate.iris,
            { scale: 0.16, z: -500, rotateZ: index % 2 === 0 ? -120 : 120 },
            { scale: 1, z: 0, rotateZ: 0, duration: 0.46, ease: 'expo.out' },
            start,
          );
          timeline.to(
            chapterGate.rings,
            {
              rotateZ: index % 2 === 0 ? 220 : -220,
              duration: 0.62,
              stagger: 0.035,
            },
            start,
          );
          timeline.fromTo(
            chapterGate.blades,
            { scaleY: 0.08, autoAlpha: 0 },
            { scaleY: 1, autoAlpha: 0.9, duration: 0.34, stagger: 0.012 },
            start + 0.06,
          );
          timeline.to(
            scene,
            {
              autoAlpha: 0,
              z: 650,
              scale: 1.5,
              duration: 0.56,
              ease: 'power3.in',
            },
            start + 0.14,
          );
          timeline.fromTo(
            nextScene,
            { autoAlpha: 0, z: -760, scale: 0.62 },
            {
              autoAlpha: 1,
              z: -80,
              scale: 0.92,
              duration: 0.38,
              ease: 'power2.in',
            },
            start + 0.3,
          );
          timeline.to(
            [chapterGate.shutterLeft, chapterGate.shutterRight],
            { xPercent: (targetIndex: number) => (targetIndex === 0 ? 90 : -90), duration: 0.28 },
            start + 0.32,
          );
          timeline.to(
            chapterGate.flash,
            { autoAlpha: 1, scale: 1.25, duration: 0.08, ease: 'power4.out' },
            start + 0.49,
          );
          timeline.to(chapterGate.backdrop, { autoAlpha: 0.86, duration: 0.12 }, start + 0.47);
          timeline.fromTo(
            chapterGate.rays,
            { autoAlpha: 0, scaleX: 0.04, xPercent: -50 },
            { autoAlpha: 0.9, scaleX: 1, xPercent: 0, duration: 0.24, stagger: 0.006 },
            start + 0.48,
          );
          timeline.fromTo(
            chapterGate.shards,
            {
              autoAlpha: 0,
              x: 0,
              y: 0,
              z: -120,
              scale: 0.18,
            },
            {
              autoAlpha: 0.86,
              x: (shardIndex: number) => Math.cos(shardIndex * 1.71) * (compact ? 170 : 360),
              y: (shardIndex: number) => Math.sin(shardIndex * 1.37) * (compact ? 150 : 280),
              z: (shardIndex: number) => 150 + (shardIndex % 4) * 90,
              rotateZ: (shardIndex: number) => shardIndex * 47,
              scale: 1.2,
              duration: 0.42,
              stagger: 0.01,
              ease: 'power3.out',
            },
            start + 0.5,
          );
          timeline.to(
            nextScene,
            {
              z: 0,
              scale: 1,
              duration: 0.5,
              ease: 'expo.out',
            },
            start + 0.58,
          );
          timeline.to(
            [chapterGate.shutterLeft, chapterGate.shutterRight],
            { xPercent: 0, duration: 0.36, ease: 'expo.out' },
            start + 0.62,
          );
          timeline.to(
            [chapterGate.flash, chapterGate.backdrop, ...chapterGate.rays, ...chapterGate.shards],
            { autoAlpha: 0, duration: 0.34 },
            start + 0.7,
          );
          timeline.to(
            chapterGate.iris,
            {
              scale: 3.4,
              z: 560,
              rotateZ: index % 2 === 0 ? 170 : -170,
              autoAlpha: 0,
              duration: 0.44,
              ease: 'power3.in',
            },
            start + 0.72,
          );
          timeline.to(chapterGate.root, { autoAlpha: 0, duration: 0.18 }, start + 1.06);
        });

        timeline.addLabel('story-end', storyDuration);
      }, root);

      refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    const setup = () => {
      const recoveryRoot = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
      if (recoveryRoot?.dataset.storyNativeRecovery === 'true') return;
      cleanup();
      const elements = readStoryElements();
      if (!elements) return;

      const token = generation;
      activeRoot = elements.root;
      activeRoot.dataset.storyDirector = 'booting';
      previousBodyScene = document.body.dataset.animeScene;
      bodySceneCaptured = true;

      if (reducedMotion.matches) {
        setStaticMode(elements);
        return;
      }

      setSceneState(elements.scenes, 0);
      elements.root.dataset.storyChapter = '01';
      elements.dots.forEach((dot, index) => {
        dot.dataset.active = index === 0 ? 'true' : 'false';
      });
      if (elements.readout) elements.readout.textContent = '01 / 03';
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
