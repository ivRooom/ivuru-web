import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.SITE_URL ?? 'https://ivuru-web.pages.dev';

export default defineConfig({
  site,
  output: 'static',
  integrations: [
    react(),
    mdx(),
    sitemap({ i18n: { defaultLocale: 'ja', locales: { ja: 'ja-JP', en: 'en-US', ko: 'ko-KR' } } }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: { sourcemap: false },
  },
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  experimental: { clientPrerender: true },
});
