import { siteConfig } from '@/data/site-config';

export function GET() {
  return new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${siteConfig.siteUrl}/sitemap-index.xml\n`,
    {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    },
  );
}
