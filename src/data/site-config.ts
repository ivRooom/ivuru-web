export const siteConfig = {
  name: 'いゔる。',
  idName: 'ivuru',
  title: 'いゔる。 / ivuru — Developer / Gamer',
  siteUrl: import.meta.env.SITE_URL ?? 'https://ivurugg.ivrm.jp',
  defaultOgImage: '/assets/og/ivuru-brand-og.png',
  xUrl: 'https://x.com/ivuruGG',
  xHandle: '@ivuruGG',
  instagramUrl: import.meta.env.PUBLIC_INSTAGRAM_URL ?? '',
  instagramPostUrls: (import.meta.env.PUBLIC_INSTAGRAM_POST_URLS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  githubUrl: '',
  discordUrl: '',
  ivrmUrl: 'https://ivrm.jp',
  contactUrl: import.meta.env.PUBLIC_CONTACT_URL ?? '',
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
