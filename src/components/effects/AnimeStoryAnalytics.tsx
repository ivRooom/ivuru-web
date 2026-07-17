import { useEffect } from 'react';

const portalTargets = ['news', 'games', 'favorites'] as const;

export default function AnimeStoryAnalytics() {
  useEffect(() => {
    const applyAttributes = () => {
      const story = document.querySelector<HTMLElement>('[data-anime-scroll-story]');
      if (!story) return;

      story.querySelectorAll<HTMLAnchorElement>('.anime-portal-card').forEach((link, index) => {
        const target = portalTargets[index];
        if (!target) return;

        link.dataset.analyticsEvent = 'world_portal_open';
        link.dataset.analyticsTarget = target;
        link.dataset.analyticsSurface = 'home_blue_story';
        link.dataset.analyticsPosition = String(index + 1);
      });
    };

    applyAttributes();
    document.addEventListener('astro:page-load', applyAttributes);

    return () => {
      document.removeEventListener('astro:page-load', applyAttributes);
    };
  }, []);

  return null;
}
