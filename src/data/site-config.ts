export const siteConfig = {
  name: 'ivuruGG',
  title: 'ivuruGG — Developer / Gamer',
  siteUrl: import.meta.env.SITE_URL ?? 'https://ivuru-web.pages.dev',
  xUrl: 'https://x.com/ivuruGG',
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
