import { useEffect } from 'react';

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
  number: HTMLElement;
  title: HTMLElement;
};

const CHAPTERS = ['01', '02', '03'] as const;
const MOBILE_SCROLL_SCREENS = 5.7;

const isIOSWebKit = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const readStoryElements = (): StoryElements | null => {
  const root = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
  const stage = root?.querySelector<HTMLElement>('[data-anime-scroll-stage]');
  if (!root || !stage) return null;

  const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-anime-story-scene]'));
  if (scenes.length !== CHAPTERS.length) return null;

  return {
    root,
    stage,
    scenes,
    dots: Array.from(root.querySelectorAll<HTMLElement>('[data-story-progress-dot]')),
    readout: root.querySelector<HTMLElement>('[data-story-chapter-readout]'),
    progressLine: root.querySelector<HTMLElement>('[data-story-progress-line]'),
  };
};

const createGate = (stage: HTMLElement): GateElements => {
  stage.querySelector('[data-chapter-gate]')?.remove();

  const gate = document.createElement('div');
  gate.className = 'anime-chapter-gate';
  gate.setAttribute('data-chapter-gate', 'true');
  gate.setAttribute('aria-hidden', 'true');
  gate.innerHTML = `
    <span class="anime-chapter-gate__backdrop" data-gate-backdrop></span>
    <span class="anime-chapter-gate__grid"></span>
    <div class="anime-chapter-gate__rays" data-gate-rays>
      ${Array.from({ length: 8 }, (_, index) => `<i style="--gate-index:${index}"></i>`).join('')}
    </div>
    <div class="anime-chapter-gate__shards" data-gate-shards>
      ${Array.from({ length: 6 }, (_, index) => `<i style="--gate-index:${index}"></i>`).join('')}
    </div>
    <div class="anime-chapter-gate__iris" data-gate-iris>
      <span class="anime-chapter-gate__core"></span>
      <div class="anime-chapter-gate__rings" data-gate-rings>
        ${Array.from({ length: 4 }, (_, index) => `<i style="--gate-index:${index}"></i>`).join('')}
      </div>
      <div class="anime-chapter-gate__blades" data-gate-blades>
        ${Array.from({ length: 8 }, (_, index) => `<i style="--gate-index:${index}"></i>`).join('')}
      </div>
    </div>
    <span class="anime-chapter-gate__shutter anime-chapter-gate__shutter--left" data-gate-shutter-left></span>
    <span class="anime-chapter-gate__shutter anime-chapter-gate__shutter--right" data-gate-shutter-right></span>
    <span class="anime-chapter-gate__flash" data-gate-flash></span>
    <div class="anime-chapter-gate__copy">
      <small data-gate-title>WORLD FORGE / BUILD</small>
      <strong data-gate-number>02</strong>
    </div>
  `;
  stage.append(gate);

  const number = gate.querySelector<HTMLElement>('[data-gate-number]');
  const title = gate.querySelector<HTMLElement>('[data-gate-title]');
  if (!number || !title) throw new Error('iOS chapter gate structure is incomplete');

  return { root: gate, number, title };
};

export default function IOSNativeStoryDirector() {
  useEffect(() => {
    if (!isIOSWebKit()) return;

    let disposed = false;
    let frame = 0;
    let timeline: { progress: (value: number) => unknown; kill: () => void } | undefined;
    let gate: GateElements | undefined;
    let activeIndex = -1;
    let scrollStart = 0;
    let scrollEnd = 1;
    let elements: StoryElements | null = null;

    const viewportHeight = () =>
      Math.max(1, Math.round(window.visualViewport?.height ?? window.innerHeight));

    const applySceneState = (index: number) => {
      if (!elements) return;
      const nextIndex = Math.max(0, Math.min(CHAPTERS.length - 1, index));
      const code = CHAPTERS[nextIndex];

      elements.scenes.forEach((scene, sceneIndex) => {
        const active = sceneIndex === nextIndex;
        scene.dataset.active = active ? 'true' : 'false';
        scene.setAttribute('aria-hidden', active ? 'false' : 'true');
        scene.toggleAttribute('inert', !active);
      });
      elements.dots.forEach((dot, dotIndex) => {
        dot.dataset.active = dotIndex === nextIndex ? 'true' : 'false';
      });

      elements.root.dataset.storyChapter = code;
      elements.root.dataset.storyAuthorityChapter = code;
      if (elements.readout) elements.readout.textContent = `${code} / 03`;
      document.body.dataset.animeScene =
        elements.scenes[nextIndex]?.dataset.storyScene ?? (nextIndex === 0 ? 'ice' : 'sky');

      if (activeIndex !== nextIndex) {
        activeIndex = nextIndex;
        window.dispatchEvent(
          new CustomEvent('ivuru:story-chapter-change', {
            detail: { chapter: code, index: nextIndex, source: 'ios-native-world-forge' },
          }),
        );
      }
    };

    const syncTransitionState = (progress: number) => {
      if (!elements || !gate) return;

      const first = progress >= 0.2 && progress <= 0.46;
      const second = progress >= 0.54 && progress <= 0.8;
      if (!first && !second) {
        delete elements.root.dataset.storyTransition;
        delete elements.root.dataset.storyTransitionPhase;
        elements.root.style.setProperty('--chapter-gate-progress', '0');
        return;
      }

      const transitionStart = first ? 0.2 : 0.54;
      const local = clamp((progress - transitionStart) / 0.26);
      const from = first ? '01' : '02';
      const to = first ? '02' : '03';
      let phase = 'charge';
      if (local >= 0.72) phase = 'reveal';
      else if (local >= 0.5) phase = 'burst';
      else if (local >= 0.28) phase = 'collapse';

      elements.root.dataset.storyTransition = `${from}-${to}`;
      elements.root.dataset.storyTransitionPhase = phase;
      elements.root.style.setProperty('--chapter-gate-progress', local.toFixed(4));
      gate.number.textContent = to;
      gate.title.textContent = first ? 'WORLD FORGE / BUILD' : 'NEXUS LINK / CONNECT';
    };

    const syncProgress = () => {
      frame = 0;
      if (disposed || !elements) return;

      const progress = clamp((window.scrollY - scrollStart) / Math.max(1, scrollEnd - scrollStart));
      timeline?.progress(progress);

      const index = progress < 0.36 ? 0 : progress < 0.7 ? 1 : 2;
      applySceneState(index);
      syncTransitionState(progress);

      elements.root.dataset.storyRuntime = 'ready';
      elements.root.dataset.storyProgressAuthority = 'ready';
      elements.root.dataset.storyMobileStability = 'ready';
      elements.root.dataset.storyAuthorityProgress = progress.toFixed(4);
      elements.root.style.setProperty('--story-authority-progress', progress.toFixed(4));
      if (elements.progressLine) elements.progressLine.style.transform = `scaleX(${progress})`;
    };

    const scheduleSync = () => {
      if (frame || disposed) return;
      frame = requestAnimationFrame(syncProgress);
    };

    const syncLayout = () => {
      if (!elements) return;

      const height = viewportHeight();
      const distance = Math.max(height * MOBILE_SCROLL_SCREENS, height * 3);
      const currentY = window.scrollY;
      const top = elements.root.getBoundingClientRect().top + currentY;

      scrollStart = Math.round(top);
      scrollEnd = Math.round(top + distance);
      elements.root.dataset.storyScrollStart = String(scrollStart);
      elements.root.dataset.storyScrollEnd = String(scrollEnd);
      elements.root.style.setProperty('--story-native-viewport-height', `${height}px`);
      elements.root.style.setProperty('--story-native-scroll-distance', `${Math.round(distance)}px`);
      elements.root.style.minHeight = `${Math.round(height + distance)}px`;
      elements.root.style.height = 'auto';
      elements.root.style.overflow = 'visible';

      elements.stage.style.position = 'sticky';
      elements.stage.style.top = '0';
      elements.stage.style.height = `${height}px`;
      elements.stage.style.minHeight = '0';
      elements.stage.style.overflow = 'clip';
      scheduleSync();
    };

    const setup = async () => {
      elements = readStoryElements();
      if (!elements) return;

      const { gsap } = await import('gsap');
      if (disposed || !elements?.root.isConnected) return;

      gate = createGate(elements.stage);
      const copies = elements.scenes.map((scene) =>
        scene.querySelectorAll<HTMLElement>('[data-story-copy], [data-story-pop]'),
      );
      const visuals = elements.scenes.map((scene) =>
        scene.querySelectorAll<HTMLElement>('[data-story-visual], [data-story-depth]'),
      );

      gsap.set(elements.scenes, { autoAlpha: 0 });
      gsap.set(elements.scenes[0], { autoAlpha: 1 });
      gsap.set(gate.root, { autoAlpha: 0 });

      const motion = gsap.timeline({ paused: true, defaults: { ease: 'power3.inOut' } });
      motion
        .to(gate.root, { autoAlpha: 1, duration: 0.08 }, 0.2)
        .to(elements.scenes[0], { autoAlpha: 0, duration: 0.16 }, 0.27)
        .fromTo(
          elements.scenes[1],
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.18 },
          0.32,
        )
        .fromTo(copies[1], { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.18 }, 0.32)
        .fromTo(
          visuals[1],
          { scale: 0.9, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 0.2 },
          0.31,
        )
        .to(gate.root, { autoAlpha: 0, duration: 0.1 }, 0.42)
        .to(gate.root, { autoAlpha: 1, duration: 0.08 }, 0.54)
        .to(elements.scenes[1], { autoAlpha: 0, duration: 0.16 }, 0.61)
        .fromTo(
          elements.scenes[2],
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.18 },
          0.66,
        )
        .fromTo(copies[2], { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.18 }, 0.66)
        .fromTo(
          visuals[2],
          { scale: 0.9, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 0.2 },
          0.65,
        )
        .to(gate.root, { autoAlpha: 0, duration: 0.1 }, 0.76);

      timeline = motion;
      elements.root.dataset.storyPlatform = 'ios-webkit';
      elements.root.dataset.storyDirector = 'ready';
      elements.root.dataset.storyMode = 'motion';
      elements.root.dataset.storyMask = 'active';
      elements.root.dataset.storyPerformance = 'ios-native-world-forge';
      elements.root.dataset.storyCamera = 'stable-native';
      elements.root.dataset.storyTransitionEngine = 'world-forge';
      elements.root.dataset.storyAxis = 'portal-forward';
      elements.root.dataset.storySnap = 'disabled-mobile';
      elements.root.dataset.storySnapState = 'ready';
      elements.root.dataset.storyScrollMode = 'native-sticky';
      elements.root.dataset.storyRuntime = 'ready';
      elements.root.dataset.storyProgressAuthority = 'ready';
      elements.root.dataset.storyMobileStability = 'ready';
      delete elements.root.dataset.storyRuntimeReason;
      delete elements.root.dataset.storyMobileRecovery;
      delete elements.root.dataset.storyNativeRecovery;

      applySceneState(0);
      syncLayout();
    };

    const onViewportChange = () => syncLayout();
    const onPageShow = () => {
      syncLayout();
      scheduleSync();
    };

    void setup();
    window.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', onViewportChange, { passive: true });
    window.addEventListener('orientationchange', onViewportChange, { passive: true });
    window.addEventListener('pageshow', onPageShow);
    window.visualViewport?.addEventListener('resize', onViewportChange, { passive: true });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      timeline?.kill();
      gate?.root.remove();
      window.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('orientationchange', onViewportChange);
      window.removeEventListener('pageshow', onPageShow);
      window.visualViewport?.removeEventListener('resize', onViewportChange);

      if (elements) {
        elements.root.style.removeProperty('height');
        elements.root.style.removeProperty('min-height');
        elements.root.style.removeProperty('overflow');
        elements.root.style.removeProperty('--story-native-viewport-height');
        elements.root.style.removeProperty('--story-native-scroll-distance');
        elements.stage.style.removeProperty('position');
        elements.stage.style.removeProperty('top');
        elements.stage.style.removeProperty('height');
        elements.stage.style.removeProperty('min-height');
        elements.stage.style.removeProperty('overflow');
      }
    };
  }, []);

  return null;
}
