export const siteConfig = {
  name: 'いゔる。',
  idName: 'ivuru',
  title: 'いゔる。 / ivuru — Developer / Gamer',
  siteUrl: import.meta.env.SITE_URL ?? 'https://ivuru.ivrm.jp',
  defaultOgImage: '/assets/og/og-background.png',
  fallbackOgImage: '/assets/og/og-background.png',
  profileImageUrl: '/assets/images/ivuru-profile-fallback.png',
  xUrl: 'https://x.com/ivuruGG',
  xHandle: '@ivuruGG',
  instagramUrl: '',
  instagramPostUrls: [] as string[],
  tiktokUrl: '',
  twitchUrl: '',
  youtubeUrl: '',
  discordUrl: '',
  litLinkUrl: 'https://lit.link/ivuruGG',
  spotifyPlaylistUrl: 'https://open.spotify.com/playlist/37i9dQZEVXdgE4Qkd43TnK',
  spotifyPlaylistId: '37i9dQZEVXdgE4Qkd43TnK',
  email: 'contact.ivuru@ivrm.jp',
  contactUrl: 'mailto:contact.ivuru@ivrm.jp',
  githubUrl: 'https://github.com/mizzz-dev',
  githubHandle: 'mizzz-dev',
  ivrmUrl: 'https://ivrm.jp',
  locales: ['ja', 'en', 'ko'] as const,
  defaultLocale: 'ja' as const,
  acceptingProjects: false,
  analyticsId: import.meta.env.PUBLIC_ANALYTICS_ID ?? '',
};

export type Locale = (typeof siteConfig.locales)[number];

export const localePath = (locale: Locale, path = '/') => {
  const clean = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return locale === 'ja' ? clean || '/' : `/${locale}${clean}`;
};
