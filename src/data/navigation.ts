import type { Locale } from './site-config';
import { localePath } from './site-config';

export const navigation = (locale: Locale) => [
  { key: 'home', href: localePath(locale, '/') },
  { key: 'profile', href: localePath(locale, '/profile') },
  { key: 'works', href: localePath(locale, '/works') },
  { key: 'portfolio', href: localePath(locale, '/portfolio') },
  { key: 'blog', href: localePath(locale, '/blog') },
];
