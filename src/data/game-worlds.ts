import type { Locale } from './site-config';

export type GameWorld = {
  slug: string;
  title: string;
  subtitle: Record<Locale, string>;
  description: Record<Locale, string>;
  webm: string;
  mp4: string;
  poster: string;
  side: 'left' | 'right';
  accent: 'cyan' | 'pink' | 'gold';
  tags: string[];
};

export const gameWorlds: GameWorld[] = [
  {
    slug: 'neon-rift',
    title: 'NEON RIFT',
    subtitle: { ja: '境界線を駆け抜ける', en: 'Run through the boundary', ko: '경계를 가로지르다' },
    description: {
      ja: 'シアンとマゼンタの光が交差する、スピード感を重視したオリジナルコンセプトクリップ。',
      en: 'An original concept clip built around speed, cyan light, and magenta trails.',
      ko: '속도감, 시안 빛, 마젠타 궤적을 중심으로 만든 오리지널 콘셉트 클립입니다.',
    },
    webm: '/assets/video/games/neon-rift.webm',
    mp4: '/assets/video/games/neon-rift.mp4',
    poster: '/assets/video/games/neon-rift-poster.webp',
    side: 'left',
    accent: 'cyan',
    tags: ['FPS', 'Speed', 'Original Clip'],
  },
  {
    slug: 'sky-raid',
    title: 'SKY RAID',
    subtitle: {
      ja: '空と光を奪還する',
      en: 'Take back the sky and light',
      ko: '하늘과 빛을 되찾다',
    },
    description: {
      ja: 'アニメOPの空気感と協力プレイの高揚感を重ねた、明るい空中戦コンセプト。',
      en: 'A bright aerial battle concept mixing anime-opening energy with co-op excitement.',
      ko: '애니메이션 오프닝의 에너지와 협동 플레이의 고양감을 섞은 공중전 콘셉트입니다.',
    },
    webm: '/assets/video/games/sky-raid.webm',
    mp4: '/assets/video/games/sky-raid.mp4',
    poster: '/assets/video/games/sky-raid-poster.webp',
    side: 'right',
    accent: 'pink',
    tags: ['Co-op', 'Action', 'Anime Motion'],
  },
  {
    slug: 'prism-arena',
    title: 'PRISM ARENA',
    subtitle: {
      ja: '色彩がぶつかる競技場',
      en: 'An arena where colors collide',
      ko: '색채가 충돌하는 아레나',
    },
    description: {
      ja: '競技シーン、配信、ショートクリップを意識した、華やかなアリーナ演出。',
      en: 'A vivid arena sequence designed for competitive scenes, streams, and short clips.',
      ko: '경쟁 장면, 방송, 쇼트 클립을 위한 화려한 아레나 연출입니다.',
    },
    webm: '/assets/video/games/prism-arena.webm',
    mp4: '/assets/video/games/prism-arena.mp4',
    poster: '/assets/video/games/prism-arena-poster.webp',
    side: 'left',
    accent: 'gold',
    tags: ['Arena', 'Competitive', 'Highlight'],
  },
];
