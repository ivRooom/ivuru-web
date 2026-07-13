import { useEffect, useRef } from 'react';
import { Code2, Gamepad2, Image, Sparkles } from 'lucide-react';

const placeholders = [
  { type: 'Development', icon: Code2, className: 'media-dev' },
  { type: 'Gaming', icon: Gamepad2, className: 'media-game' },
  { type: 'Community', icon: Sparkles, className: 'media-community' },
  { type: 'Creative', icon: Image, className: 'media-creative' },
];

export default function MediaReel() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const videos = root.current?.querySelectorAll('video') ?? [];
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting && !saveData) video.play().catch(() => undefined);
          else video.pause();
        }),
      { threshold: 0.45 },
    );
    videos.forEach((video) => observer.observe(video));
    return () => observer.disconnect();
  }, []);
  return (
    <div className="media-reel" ref={root}>
      {placeholders.map(({ type, icon: Icon, className }, index) => (
        <div className={`media-tile ${className}`} key={type}>
          <span>
            0{index + 1} / {type}
          </span>
          <Icon aria-hidden="true" />
          <small>
            MEDIA PLACEHOLDER
            <br />
            Add image or video in /public/assets
          </small>
        </div>
      ))}
    </div>
  );
}
