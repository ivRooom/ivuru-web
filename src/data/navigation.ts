import type { Locale } from './site-config';
import { localePath } from './site-config';

export const navigation = (locale: Locale) => [
  { key: 'home', href: localePath(locale, '/') },
  { key: 'profile', href: localePath(locale, '/profile') },
  { key: 'works', href: localePath(locale, '/works') },
  { key: 'news', href: localePath(locale, '/news') },
  { key: 'games', href: localePath(locale, '/games') },
  { key: 'favorites', href: localePath(locale, '/favorites') },
  { key: 'blog', href: localePath(locale, '/blog') },
  { key: 'contact', href: localePath(locale, '/contact') },
];
