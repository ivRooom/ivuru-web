import { useEffect } from 'react';

type ScrollTriggerLike = {
  start: number;
  end: number;
  vars: { trigger?: Element | string; pin?: Element | string | boolean };
  animation?: {
    progress: (value?: number, suppressEvents?: boolean) => number | unknown;
  };
  update: () => void;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const CHAPTER_BREAKS = [0, 0.31, 0.69];

const chapterAt = (progress: number) => {
  if (progress >= CHAPTER_BREAKS[2]!) return 2;
  if (progress >= CHAPTER_BREAKS[1]!) return 1;
  return 0;
};

export default function StoryProgressAuthority() {
  useEffect(() => {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let disposeCurrent = () => {};
    let generation = 0;

    const setup = async () => {
      disposeCurrent();
      generation += 1;
      const token = generation;

      const root = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
      if (!root || reducedMotion.matches) return;

      const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-anime-story-scene]'));
      const dots = Array.from(root.querySelectorAll<HTMLElement>('[data-story-progress-dot]'));
      const readout = root.querySelector<HTMLElement>('[data-story-chapter-readout]');
      const progressLine = root.querySelector<HTMLElement>('[data-story-progress-line]');
      if (scenes.length !== 3) return;

      root.dataset.storyProgressAuthority = 'booting';
      const triggerModule = await import('gsap/ScrollTrigger');
      if (token !== generation || !root.isConnected) return;

      const ScrollTrigger = triggerModule.ScrollTrigger;
      let frame = 0;
      let lastProgress = -1;
      let activeChapter = -1;
      let trigger: ScrollTriggerLike | undefined;

      const findTrigger = () => {
        trigger = ScrollTrigger.getAll().find((candidate) => {
          const current = candidate as unknown as ScrollTriggerLike;
          return current.vars.trigger === root && current.vars.pin === root;
        }) as unknown as ScrollTriggerLike | undefined;
        return trigger;
      };

      const nativeRange = () => {
        const spacer = root.parentElement?.classList.contains('pin-spacer')
          ? root.parentElement
          : null;
        const anchor = spacer ?? root;
        const rect = anchor.getBoundingClientRect();
        const start = rect.top + window.scrollY;
        const distance = Math.max(
          window.innerHeight * 5.7,
          anchor.scrollHeight - window.innerHeight,
        );
        return { start, end: start + distance };
      };

      const activateChapter = (index: number) => {
        if (index === activeChapter) return;
        activeChapter = index;
        const code = String(index + 1).padStart(2, '0');
        root.dataset.storyChapter = code;
        root.dataset.storyAuthorityChapter = code;

        scenes.forEach((scene, sceneIndex) => {
          const active = sceneIndex === index;
          scene.dataset.active = active ? 'true' : 'false';
          scene.setAttribute('aria-hidden', active ? 'false' : 'true');
          scene.toggleAttribute('inert', !active);
        });
        dots.forEach((dot, dotIndex) => {
          dot.dataset.active = dotIndex === index ? 'true' : 'false';
        });
        if (readout) readout.textContent = `${code} / 03`;
        document.body.dataset.animeScene = scenes[index]?.dataset.storyScene ?? 'ice';
        window.dispatchEvent(
          new CustomEvent('ivuru:story-chapter-change', {
            detail: { chapter: code, index, source: 'progress-authority' },
          }),
        );
      };

      const render = () => {
        frame = 0;
        const pinned = trigger ?? findTrigger();
        const range =
          pinned && Number.isFinite(pinned.start) && Number.isFinite(pinned.end)
            ? { start: pinned.start, end: pinned.end }
            : nativeRange();
        const distance = Math.max(1, range.end - range.start);
        const progress = clamp01((window.scrollY - range.start) / distance);

        if (Math.abs(progress - lastProgress) < 0.0005) return;
        lastProgress = progress;
        root.style.setProperty('--story-authority-progress', progress.toFixed(4));
        root.dataset.storyAuthorityProgress = progress.toFixed(4);
        if (progressLine) progressLine.style.transform = `scaleX(${progress})`;
        activateChapter(chapterAt(progress));

        if (pinned?.animation) {
          const current = Number(pinned.animation.progress());
          if (!Number.isFinite(current) || Math.abs(current - progress) > 0.006) {
            pinned.animation.progress(progress, false);
            pinned.update();
          }
        }
      };

      const requestRender = () => {
        if (!frame) frame = requestAnimationFrame(render);
      };

      const triggerProbe = window.setInterval(() => {
        if (findTrigger()) {
          root.dataset.storyProgressAuthority = 'ready';
          window.clearInterval(triggerProbe);
          requestRender();
        }
      }, 120);

      root.dataset.storyProgressAuthority = 'ready';
      window.addEventListener('scroll', requestRender, { passive: true });
      window.addEventListener('resize', requestRender, { passive: true });
      window.addEventListener('orientationchange', requestRender, { passive: true });
      document.addEventListener('visibilitychange', requestRender);
      requestRender();

      disposeCurrent = () => {
        cancelAnimationFrame(frame);
        window.clearInterval(triggerProbe);
        window.removeEventListener('scroll', requestRender);
        window.removeEventListener('resize', requestRender);
        window.removeEventListener('orientationchange', requestRender);
        document.removeEventListener('visibilitychange', requestRender);
        delete root.dataset.storyProgressAuthority;
        delete root.dataset.storyAuthorityProgress;
        delete root.dataset.storyAuthorityChapter;
        root.style.removeProperty('--story-authority-progress');
      };
    };

    const onChange = () => void setup();
    void setup();
    document.addEventListener('astro:page-load', onChange);
    reducedMotion.addEventListener('change', onChange);

    return () => {
      generation += 1;
      disposeCurrent();
      document.removeEventListener('astro:page-load', onChange);
      reducedMotion.removeEventListener('change', onChange);
    };
  }, []);

  return null;
}
