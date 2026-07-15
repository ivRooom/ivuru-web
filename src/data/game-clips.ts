export type GameClip = {
  slug: string;
  title: string;
  game: string;
  platform: 'youtube' | 'twitch' | 'tiktok' | 'x' | 'local';
  url: string;
  thumbnail?: string;
  publishedAt?: string;
  duration?: string;
  tags?: string[];
  featured?: boolean;
};

// 公開できる実クリップを追加した時点でカードが表示されます。
// 架空のURLや動画は登録しません。
export const gameClips: GameClip[] = [
  {
    slug: 'neon-rift',
    title: 'NEON RIFT / Original Replay Concept',
    game: 'ivuru World Gate',
    platform: 'local',
    url: '/games',
    thumbnail: '/assets/video/games/neon-rift-poster.webp',
    publishedAt: '2026-07-15',
    duration: '00:06',
    tags: ['fps', 'anime', 'original'],
    featured: true,
  },
  {
    slug: 'sky-raid',
    title: 'SKY RAID / Original Replay Concept',
    game: 'ivuru World Gate',
    platform: 'local',
    url: '/games',
    thumbnail: '/assets/video/games/sky-raid-poster.webp',
    publishedAt: '2026-07-15',
    duration: '00:06',
    tags: ['coop', 'action', 'original'],
  },
  {
    slug: 'prism-arena',
    title: 'PRISM ARENA / Original Replay Concept',
    game: 'ivuru World Gate',
    platform: 'local',
    url: '/games',
    thumbnail: '/assets/video/games/prism-arena-poster.webp',
    publishedAt: '2026-07-15',
    duration: '00:06',
    tags: ['arena', 'highlight', 'original'],
  },
];
