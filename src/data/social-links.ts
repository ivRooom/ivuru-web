import { siteConfig } from './site-config';

export type SocialLink = {
  key: 'x' | 'instagram' | 'tiktok' | 'twitch' | 'youtube' | 'discord' | 'email';
  label: string;
  description: string;
  href: string;
  accent: 'cyan' | 'pink' | 'violet' | 'red' | 'indigo' | 'blue' | 'green';
};

export const socialLinks: SocialLink[] = [
  {
    key: 'x',
    label: 'X',
    description: 'Updates / Timeline',
    href: siteConfig.xUrl,
    accent: 'cyan',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    description: 'Visual Archive',
    href: siteConfig.instagramUrl,
    accent: 'pink',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    description: 'Short Clips',
    href: siteConfig.tiktokUrl,
    accent: 'violet',
  },
  {
    key: 'twitch',
    label: 'Twitch',
    description: 'Live Stream',
    href: siteConfig.twitchUrl,
    accent: 'indigo',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    description: 'Video Archive',
    href: siteConfig.youtubeUrl,
    accent: 'red',
  },
  {
    key: 'discord',
    label: 'Discord',
    description: 'Community Gate',
    href: siteConfig.discordUrl,
    accent: 'blue',
  },
  {
    key: 'email',
    label: 'Email',
    description: siteConfig.email,
    href: siteConfig.contactUrl,
    accent: 'green',
  },
].filter((item) => item.href);
