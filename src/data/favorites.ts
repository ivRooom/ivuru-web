import type { Locale } from './site-config';

export type FavoriteLink = {
  title: string;
  label: Record<Locale, string>;
  description: Record<Locale, string>;
  href: string;
  kind: 'create' | 'play' | 'listen' | 'connect';
};

export const favoriteLinks: FavoriteLink[] = [
  {
    title: 'GitHub',
    label: {
      ja: 'コードとアイデアが集まる場所',
      en: 'Where code and ideas gather',
      ko: '코드와 아이디어가 모이는 곳',
    },
    description: {
      ja: '個人開発、学習記録、コミュニティ向けツールを形にするための開発拠点。',
      en: 'The development home for personal projects, learning, and community tools.',
      ko: '개인 개발, 학습 기록, 커뮤니티 도구를 만드는 개발 거점입니다.',
    },
    href: 'https://github.com/',
    kind: 'create',
  },
  {
    title: 'ivRm',
    label: {
      ja: 'ゲームと創作のコミュニティ',
      en: 'A community for games and creation',
      ko: '게임과 창작 커뮤니티',
    },
    description: {
      ja: 'ゲーム、雑談、配信、イラスト、勉強会を通して人がつながる場所。',
      en: 'A place to connect through games, streams, illustration, conversation, and study sessions.',
      ko: '게임, 방송, 일러스트, 대화, 스터디를 통해 사람들이 연결되는 공간입니다.',
    },
    href: 'https://ivrm.jp',
    kind: 'connect',
  },
  {
    title: 'Spotify',
    label: {
      ja: '制作とプレイを支える音楽',
      en: 'Music for building and playing',
      ko: '제작과 플레이를 위한 음악',
    },
    description: {
      ja: '集中したい時間やゲームの余韻を楽しむ時間に流すサウンドトラック。',
      en: 'A soundtrack for focused building sessions and moments after the game.',
      ko: '집중해서 만들 때와 게임의 여운을 즐길 때 듣는 사운드트랙입니다.',
    },
    href: 'https://open.spotify.com/',
    kind: 'listen',
  },
  {
    title: 'Minecraft',
    label: {
      ja: '世界をつくり、みんなで遊ぶ',
      en: 'Build a world and play together',
      ko: '세계를 만들고 함께 플레이하기',
    },
    description: {
      ja: 'サーバー運営、建築、冒険、MOD構成まで、技術と遊びが交差するゲーム。',
      en: 'A game where infrastructure, building, adventure, and mod design meet.',
      ko: '서버 운영, 건축, 모험, MOD 구성이 기술과 놀이로 만나는 게임입니다.',
    },
    href: 'https://www.minecraft.net/',
    kind: 'play',
  },
];

export const spotifyEmbedUrl =
  'https://open.spotify.com/embed/playlist/37i9dQZF1DX8Uebhn9wzrS?utm_source=generator&theme=0';
