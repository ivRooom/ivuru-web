import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    category: z.enum(['Development', 'Gaming', 'ivRm', 'Creator', 'Music', 'Travel', 'Diary']),
    tags: z.array(z.string()).default([]),
    locale: z.enum(['ja', 'en', 'ko']),
    thumbnail: z.string().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    sample: z.boolean().default(true),
  }),
});

export const collections = { blog };
