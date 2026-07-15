import { useEffect, useRef } from 'react';
import { Code2, Gamepad2, Music2, Newspaper } from 'lucide-react';

const media = [
  {
    type: 'Development',
    icon: Code2,
    className: 'media-dev',
    href: '/works',
    poster: '/assets/video/games/sky-raid-poster.webp',
    webm: '/assets/video/games/sky-raid.webm',
    mp4: '/assets/video/games/sky-raid.mp4',
    label: 'Build logs / interfaces / cloud',
  },
  {
    type: 'Gaming',
    icon: Gamepad2,
    className: 'media-game',
    href: '/games',
    poster: '/assets/video/games/neon-rift-poster.webp',
    webm: '/assets/video/games/neon-rift.webm',
    mp4: '/assets/video/games/neon-rift.mp4',
    label: 'Original replay concepts',
  },
  {
    type: 'News',
    icon: Newspaper,
    className: 'media-community',
    href: '/news',
    poster: '/assets/video/games/prism-arena-poster.webp',
    webm: '/assets/video/games/prism-arena.webm',
    mp4: '/assets/video/games/prism-arena.mp4',
    label: 'Release and community signals',
  },
  {
    type: 'Favorites',
    icon: Music2,
    className: 'media-creative',
    href: '/favorites',
    poster: '/assets/video/hero-anime-op-poster.webp',
    webm: '/assets/video/hero-anime-op-loop.webm',
    mp4: '/assets/video/hero-anime-op-loop.mp4',
    label: 'Pages / music / visual worlds',
  },
];

export default function MediaReel() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const videos = root.current?.querySelectorAll('video') ?? [];
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const slow = ['slow-2g', '2g'].includes(connection?.effectiveType ?? '');
    const canPlay = !reduced && !connection?.saveData && !slow;
    if (!canPlay || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) void video.play().catch(() => undefined);
          else video.pause();
        }),
      { threshold: 0.45 },
    );
    videos.forEach((video) => observer.observe(video));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="media-reel" ref={root}>
      {media.map(({ type, icon: Icon, className, href, poster, webm, mp4, label }, index) => (
        <a className={`media-tile ${className} media-tile-live`} key={type} href={href}>
          <video
            muted
            loop
            playsInline
            preload="none"
            poster={poster}
            tabIndex={-1}
            aria-hidden="true"
          >
            <source src={webm} type="video/webm" />
            <source src={mp4} type="video/mp4" />
          </video>
          <span>
            0{index + 1} / {type}
          </span>
          <Icon aria-hidden="true" />
          <small>{label}</small>
          <b>OPEN WORLD ↗</b>
        </a>
      ))}
    </div>
  );
}
