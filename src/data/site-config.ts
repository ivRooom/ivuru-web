export const siteConfig = {
  name: 'いゔる。',
  idName: 'ivuru',
  title: 'いゔる。 / ivuru — Developer / Gamer',
  siteUrl: import.meta.env.SITE_URL ?? 'https://ivurugg.ivrm.jp',
  defaultOgImage: '/assets/og/ivuru-brand-og.svg',
  fallbackOgImage: '/assets/og/og-background.png',
  profileImageUrl: 'https://unavatar.io/x/ivuruGG',
  xUrl: 'https://x.com/ivuruGG',
  xHandle: '@ivuruGG',
  instagramUrl: '',
  instagramPostUrls: [] as string[],
  tiktokUrl: '',
  twitchUrl: '',
  youtubeUrl: '',
  discordUrl: '',
  email: 'contact.ivuru@ivrm.jp',
  contactUrl: 'mailto:contact.ivuru@ivrm.jp',
  githubUrl: '',
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
