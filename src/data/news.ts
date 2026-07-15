import type { Locale } from './site-config';

export type NewsCategory = 'release' | 'development' | 'community' | 'media';

export type NewsItem = {
  slug: string;
  publishedAt: string;
  category: NewsCategory;
  title: Record<Locale, string>;
  summary: Record<Locale, string>;
  href?: string;
  accent: 'cyan' | 'pink' | 'violet' | 'gold';
};

export const newsItems: NewsItem[] = [
  {
    slug: 'immersive-worlds-started',
    publishedAt: '2026-07-15',
    category: 'development',
    title: {
      ja: 'NEWS・GAMES・FAVORITESの新しいワールドを開発開始',
      en: 'Development begins on the new News, Games, and Favorites worlds',
      ko: 'News, Games, Favorites 신규 월드 개발 시작',
    },
    summary: {
      ja: 'サイト全体をアニメ作品のチャプターとして体験できる構成へ拡張しています。',
      en: 'The site is expanding into a chapter-based experience inspired by animated opening sequences.',
      ko: '사이트 전체를 애니메이션 작품의 챕터처럼 경험할 수 있도록 확장하고 있습니다.',
    },
    accent: 'violet',
  },
  {
    slug: 'colorful-anime-hero',
    publishedAt: '2026-07-15',
    category: 'media',
    title: {
      ja: 'トップヒーローをカラフルなアニメ調へアップデート',
      en: 'The top hero has been updated with a colorful anime-inspired direction',
      ko: '톱 히어로를 컬러풀한 애니메이션풍으로 업데이트',
    },
    summary: {
      ja: '光彩、花びら、プリズム、生成キービジュアルを追加し、従来より明るい世界観へ更新しました。',
      en: 'Glow, petals, prism effects, and an original key visual create a brighter world.',
      ko: '광채, 꽃잎, 프리즘, 생성 키 비주얼을 더해 한층 밝은 세계관으로 업데이트했습니다.',
    },
    href: 'https://github.com/ivRooom/ivuru-web/pull/28',
    accent: 'pink',
  },
  {
    slug: 'contact-routing',
    publishedAt: '2026-07-15',
    category: 'release',
    title: {
      ja: 'お問い合わせメールの送信経路を更新',
      en: 'Contact email delivery routes have been updated',
      ko: '문의 메일 전송 경로 업데이트',
    },
    summary: {
      ja: '管理者通知、自動受付メール、BCCの役割を分離し、運用しやすい構成へ整理しました。',
      en: 'Administrator notifications, receipt emails, and BCC routing are now separated.',
      ko: '관리자 알림, 자동 접수 메일, BCC 경로를 분리해 운영성을 개선했습니다.',
    },
    href: 'https://github.com/ivRooom/ivuru-web/pull/27',
    accent: 'cyan',
  },
  {
    slug: 'ivrm-community',
    publishedAt: '2026-07-01',
    category: 'community',
    title: {
      ja: 'ivRmコミュニティのWeb連携を継続強化',
      en: 'Continuing to strengthen web integration for the ivRm community',
      ko: 'ivRm 커뮤니티 웹 연동 지속 강화',
    },
    summary: {
      ja: 'Discord、Minecraft、Webサイトをつなぐためのプロフィール・メンバー・運営基盤を整備しています。',
      en: 'Profile, member, and operations foundations are being prepared across Discord, Minecraft, and the web.',
      ko: 'Discord, Minecraft, 웹사이트를 잇는 프로필, 멤버, 운영 기반을 정비하고 있습니다.',
    },
    href: 'https://ivrm.jp',
    accent: 'gold',
  },
];

export const newsCategoryLabels: Record<Locale, Record<NewsCategory, string>> = {
  ja: { release: 'リリース', development: '開発', community: 'コミュニティ', media: 'メディア' },
  en: { release: 'Release', development: 'Development', community: 'Community', media: 'Media' },
  ko: { release: '릴리스', development: '개발', community: '커뮤니티', media: '미디어' },
};
