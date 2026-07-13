import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '@/data/site-config';

export async function GET() {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf(),
  );
  return rss({
    title: 'ivuruGG Blog',
    description: 'Development, Gaming, ivRm, Creator, Music, Travel, and Diary.',
    site: siteConfig.siteUrl,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `${post.data.locale === 'ja' ? '' : `/${post.data.locale}`}/blog/${post.id.replace(/^(ja|en|ko)\//, '').replace(/\.(md|mdx)$/, '')}`,
    })),
  });
}
