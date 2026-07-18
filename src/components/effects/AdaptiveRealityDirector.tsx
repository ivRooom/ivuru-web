import { useEffect } from 'react';

type RealityQuality = 'ultra' | 'balanced' | 'lite';
type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

type RealityLayer = {
  root: HTMLElement;
  variantLabel: HTMLElement | null;
};

const FRACTURE_COUNT = 14;
const PARTICLE_COUNT = 24;
const GLYPH_COUNT = 8;
const SHOCKWAVE_COUNT = 3;

const resolveQuality = (): RealityQuality => {
  const hints = navigator as NavigatorWithHints;
  const memory = hints.deviceMemory ?? 4;
  const threads = hints.hardwareConcurrency ?? 4;
  const saveData = hints.connection?.saveData === true;

  if (saveData || memory <= 2 || threads <= 2) return 'lite';
  if (memory >= 8 && threads >= 8 && innerWidth >= 1024 && devicePixelRatio <= 2) return 'ultra';
  return 'balanced';
};

const createRealityLayer = (gate: HTMLElement): RealityLayer => {
  const layer = document.createElement('div');
  layer.className = 'anime-reality-overdrive';
  layer.dataset.adaptiveReality = 'true';
  layer.dataset.realityVariant = 'idle';
  layer.dataset.realityPhase = 'idle';
  layer.setAttribute('aria-hidden', 'true');

  const fractures = Array.from({ length: FRACTURE_COUNT }, (_, index) => {
    const direction = index % 2 === 0 ? -1 : 1;
    const x = direction * (18 + (index % 5) * 13);
    const y = ((index % 7) - 3) * 9;
    const chargeX = direction * (3 + (index % 4) * 2);
    const chargeY = ((index % 5) - 2) * 2;
    const rotation = direction * (14 + index * 17);
    const depth = 90 + (index % 4) * 95;
    return `<i style="--fracture-index:${index};--fracture-x:${x}vw;--fracture-y:${y}vh;--fracture-charge-x:${chargeX}vw;--fracture-charge-y:${chargeY}vh;--fracture-rotation:${rotation}deg;--fracture-depth:${depth}px"></i>`;
  }).join('');

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const angle = index * (360 / PARTICLE_COUNT) + (index % 3) * 5;
    const distance = 28 + (index % 6) * 9;
    const size = 2 + (index % 4);
    return `<i style="--particle-index:${index};--particle-angle:${angle}deg;--particle-distance:${distance}vmax;--particle-size:${size}px"></i>`;
  }).join('');

  const glyphs = ['IV', '01', '02', '03', 'BUILD', 'PLAY', 'LINK', 'NEXUS'];
  const glyphMarkup = glyphs
    .slice(0, GLYPH_COUNT)
    .map((glyph, index) => `<i style="--glyph-index:${index}">${glyph}</i>`)
    .join('');

  const shockwaves = Array.from(
    { length: SHOCKWAVE_COUNT },
    (_, index) => `<i style="--shockwave-index:${index}"></i>`,
  ).join('');

  layer.innerHTML = `
    <span class="anime-reality-overdrive__chromatic"></span>
    <span class="anime-reality-overdrive__beam"></span>
    <div class="anime-reality-overdrive__fractures">${fractures}</div>
    <div class="anime-reality-overdrive__particles">${particles}</div>
    <div class="anime-reality-overdrive__shockwaves">${shockwaves}</div>
    <div class="anime-reality-overdrive__glyphs">${glyphMarkup}</div>
    <div class="anime-reality-overdrive__telemetry">
      <small>ADAPTIVE REALITY ENGINE</small>
      <strong data-reality-variant-label>STANDBY</strong>
    </div>
  `;

  gate.append(layer);
  return {
    root: layer,
    variantLabel: layer.querySelector<HTMLElement>('[data-reality-variant-label]'),
  };
};

export default function AdaptiveRealityDirector() {
  useEffect(() => {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let disposeCurrent = () => {};

    const setup = () => {
      disposeCurrent();

      const story = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
      const stage = story?.querySelector<HTMLElement>('[data-anime-scroll-stage]');
      if (!story || !stage) {
        disposeCurrent = () => {};
        return;
      }

      const quality = reducedMotion.matches ? 'lite' : resolveQuality();
      story.dataset.storyRealityEngine = reducedMotion.matches ? 'static' : 'adaptive-overdrive';
      story.dataset.storyRealityQuality = quality;
      story.dataset.storyRealityIntensity = 'cinematic';
      story.dataset.storyRealityDirection = 'forward';
      story.style.setProperty('--reality-energy', '0');
      story.style.setProperty('--reality-pointer-x', '0');
      story.style.setProperty('--reality-pointer-y', '0');

      if (reducedMotion.matches) {
        disposeCurrent = () => {
          delete story.dataset.storyRealityEngine;
          delete story.dataset.storyRealityQuality;
          delete story.dataset.storyRealityIntensity;
          delete story.dataset.storyRealityDirection;
          story.style.removeProperty('--reality-energy');
          story.style.removeProperty('--reality-pointer-x');
          story.style.removeProperty('--reality-pointer-y');
        };
        return;
      }

      let reality: RealityLayer | undefined;
      let gateObserver: MutationObserver | undefined;
      let stateObserver: MutationObserver | undefined;
      let animationFrame = 0;
      let energy = 0;
      let targetEnergy = 0;
      let lastTouchY: number | undefined;

      const syncRealityState = () => {
        if (!reality) return;
        const transition = story.dataset.storyTransition;
        const phase = story.dataset.storyTransitionPhase ?? 'idle';
        const variant = transition === '01-02' ? 'forge' : transition === '02-03' ? 'nexus' : 'idle';

        reality.root.dataset.realityVariant = variant;
        reality.root.dataset.realityPhase = phase;
        if (reality.variantLabel) {
          reality.variantLabel.textContent =
            variant === 'forge' ? 'CRYSTAL WORLD FORGE' : variant === 'nexus' ? 'NEXUS HYPERLINK' : 'STANDBY';
        }
      };

      const attachRealityLayer = () => {
        if (reality) return true;
        const gate = stage.querySelector<HTMLElement>('[data-chapter-gate]');
        if (!gate) return false;
        reality = createRealityLayer(gate);
        reality.root.dataset.realityQuality = quality;
        syncRealityState();
        return true;
      };

      if (!attachRealityLayer()) {
        gateObserver = new MutationObserver(() => {
          if (!attachRealityLayer()) return;
          gateObserver?.disconnect();
          gateObserver = undefined;
        });
        gateObserver.observe(stage, { childList: true, subtree: true });
      }

      stateObserver = new MutationObserver(syncRealityState);
      stateObserver.observe(story, {
        attributes: true,
        attributeFilter: ['data-story-transition', 'data-story-transition-phase'],
      });

      const renderEnergy = () => {
        energy += (targetEnergy - energy) * 0.24;
        targetEnergy *= 0.84;
        const normalized = Math.max(0, Math.min(1, energy));
        story.style.setProperty('--reality-energy', normalized.toFixed(4));
        story.dataset.storyRealityIntensity =
          normalized >= 0.68 ? 'overdrive' : normalized >= 0.22 ? 'charged' : 'cinematic';

        if (normalized < 0.003 && targetEnergy < 0.003) {
          energy = 0;
          targetEnergy = 0;
          story.style.setProperty('--reality-energy', '0');
          story.dataset.storyRealityIntensity = 'cinematic';
          animationFrame = 0;
          return;
        }
        animationFrame = requestAnimationFrame(renderEnergy);
      };

      const injectEnergy = (delta: number) => {
        if (story.dataset.storyInView !== 'true') return;
        targetEnergy = Math.min(1, targetEnergy + Math.min(1, Math.abs(delta) / 420));
        story.dataset.storyRealityDirection = delta < 0 ? 'reverse' : 'forward';
        if (!animationFrame) animationFrame = requestAnimationFrame(renderEnergy);
      };

      const onWheel = (event: WheelEvent) => injectEnergy(event.deltaY);
      const onTouchStart = (event: TouchEvent) => {
        lastTouchY = event.touches[0]?.clientY;
      };
      const onTouchMove = (event: TouchEvent) => {
        const nextY = event.touches[0]?.clientY;
        if (nextY === undefined || lastTouchY === undefined) return;
        injectEnergy(lastTouchY - nextY);
        lastTouchY = nextY;
      };
      const onPointerMove = (event: PointerEvent) => {
        const rect = story.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        story.style.setProperty('--reality-pointer-x', Math.max(-1, Math.min(1, x)).toFixed(3));
        story.style.setProperty('--reality-pointer-y', Math.max(-1, Math.min(1, y)).toFixed(3));
      };

      story.addEventListener('wheel', onWheel, { passive: true });
      story.addEventListener('touchstart', onTouchStart, { passive: true });
      story.addEventListener('touchmove', onTouchMove, { passive: true });
      if (quality !== 'lite') story.addEventListener('pointermove', onPointerMove, { passive: true });

      disposeCurrent = () => {
        cancelAnimationFrame(animationFrame);
        gateObserver?.disconnect();
        stateObserver?.disconnect();
        reality?.root.remove();
        story.removeEventListener('wheel', onWheel);
        story.removeEventListener('touchstart', onTouchStart);
        story.removeEventListener('touchmove', onTouchMove);
        story.removeEventListener('pointermove', onPointerMove);
        delete story.dataset.storyRealityEngine;
        delete story.dataset.storyRealityQuality;
        delete story.dataset.storyRealityIntensity;
        delete story.dataset.storyRealityDirection;
        story.style.removeProperty('--reality-energy');
        story.style.removeProperty('--reality-pointer-x');
        story.style.removeProperty('--reality-pointer-y');
      };
    };

    const onEnvironmentChange = () => setup();
    setup();
    document.addEventListener('astro:page-load', setup);
    reducedMotion.addEventListener('change', onEnvironmentChange);

    return () => {
      disposeCurrent();
      document.removeEventListener('astro:page-load', setup);
      reducedMotion.removeEventListener('change', onEnvironmentChange);
    };
  }, []);

  return null;
}
